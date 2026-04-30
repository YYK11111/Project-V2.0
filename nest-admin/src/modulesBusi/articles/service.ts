import { ForbiddenException, Injectable } from "@nestjs/common";
import { ArticleDto } from "./dto";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, TreeRepository } from "typeorm";
import { Article, Status, status } from "./entity";
import { VisibilityType } from "./constants";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { ArticleCatalogsService } from "../articleCatalogs/service";
import { TasksService } from "src/common/tasks/tasks.service";
import { ArticleTagsService } from "../articleTags/service";
import { ArticleTag } from "../articleTags/entity";
import { UsersService } from "src/modules/users/users.service";
import { ArticleSearchRecordsService } from "../articleSearchRecords/service";
import dayjs from "dayjs";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { Project } from "../projects/entity";
import { ProjectMember, ProjectMemberRole } from "../project-members/entity";
import { DocumentNode } from "./document.schema";
import {
  DOCUMENT_READY_STATUS,
  DOCUMENT_SCHEMA_VERSION,
} from "./document.schema";
import {
  ensureDocumentEditable,
  validateDocumentJson,
  validateDocumentSchemaVersion,
} from "./document.validator";
import { ArticleChunkEmbeddingsService } from "../articleChunkEmbeddings/service";

@Injectable()
export class ArticlesService extends BaseService<Article, ArticleDto> {
  constructor(
    @InjectRepository(Article) repository: Repository<Article>,
    @InjectRepository(ArticleCatalog)
    private articleCatalogRepository: TreeRepository<ArticleCatalog>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private projectMemberRepository: Repository<ProjectMember>,
    private articleCatalogsService: ArticleCatalogsService,
    private articleTagsService: ArticleTagsService,
    private usersService: UsersService,
    private articleSearchRecordsService: ArticleSearchRecordsService,
    private tasksService: TasksService,
    private articleChunkEmbeddingsService: ArticleChunkEmbeddingsService,
  ) {
    super(Article, repository);
  }

  async save(dto) {
    const currentUserId = dto._operatorId ? String(dto._operatorId) : "";
    await this.validateProjectKnowledgePermissionForSave(dto, currentUserId);
    const existing = dto.id
      ? await this.repository.findOne({
          where: { id: dto.id } as any,
          relations: ["catalog"],
        })
      : null;

    if (dto.id) {
      ensureDocumentEditable(existing?.contentStatus);
    }

    validateDocumentSchemaVersion(
      dto.contentVersion ?? existing?.contentVersion,
    );
    validateDocumentJson(dto.contentJson);

    dto.summary = dto.summary || dto.desc || "";
    dto.desc = dto.summary || dto.desc || "";
    dto.contentText =
      this.extractPlainTextFromDocument(dto.contentJson) ||
      this.extractPlainTextFromHtml(dto.content);
    dto.contentVersion = DOCUMENT_SCHEMA_VERSION;
    dto.contentStatus = DOCUMENT_READY_STATUS;
    dto.contentChunks = this.buildContentChunks(
      dto.contentText,
      dto.contentJson,
      dto.id,
      dto.contentVersion,
    );
    const operatorId = dto._operatorId ? String(dto._operatorId) : "";
    if (!dto.authorId && operatorId) {
      dto.authorId = operatorId;
    }
    if (operatorId) {
      dto.maintainerId = operatorId;
    }
    dto.versionNo = dto.id
      ? Number(dto.versionNo || 1) + 1
      : Number(dto.versionNo || 1);
    dto.embeddingStatus = "pending";
    dto.embeddingVersion = Number(dto.embeddingVersion || 1);
    dto.retrievalWeight = Number(dto.retrievalWeight || 1);
    dto.aiPreferred = dto.aiPreferred || "0";
    dto.authorityLevel = dto.authorityLevel || "0";
    dto.isTop = dto.isTop || "0";
    dto.topSort = Number(dto.topSort || 0);
    dto.visibleRoleIds = Array.isArray(dto.visibleRoleIds)
      ? dto.visibleRoleIds
      : this.normalizeIdList(dto.visibleRoleIds);
    dto.visibleUserIds = Array.isArray(dto.visibleUserIds)
      ? dto.visibleUserIds
      : this.normalizeIdList(dto.visibleUserIds);

    if (dto.catalogId) {
      const catalog = await this.articleCatalogsService.getOne(
        { id: dto.catalogId },
        false,
      );
      if (catalog) {
        dto.visibilityType =
          dto.visibilityType ||
          catalog.defaultVisibilityType ||
          VisibilityType.public;
        if (!dto.visibleRoleIds?.length) {
          dto.visibleRoleIds = this.normalizeIdList(
            catalog.defaultVisibleRoleIds,
          );
        }
        if (!dto.visibleUserIds?.length) {
          dto.visibleUserIds = this.normalizeIdList(
            catalog.defaultVisibleUserIds,
          );
        }
      }
    }

    const tagIds = this.normalizeIdList(dto.tagIds);
    const tags = tagIds.length
      ? await this.articleTagsService.repository.findBy({
          id: In(tagIds) as any,
        })
      : [];
    dto.tags = tags as ArticleTag[];
    delete dto.tagIds;

    if (dto.publishTime) {
      dto.status = Status.wait;
    }

    dto.id && this.tasksService.deleteTimeout("Timeout:articles:" + dto.id);

    const res = await super.save(dto);
    await this.syncArticleEmbeddings(res);
    await this.repository.update(res.id, {
      embeddingStatus: res.embeddingStatus,
    });

    if (dto.status !== Status.draft && dto.publishTime) {
      let task = (id) => {
        this.update({ id, status: Status.published });
      };
      this.tasksService.addTimeout(
        "Timeout:articles:" + res.id,
        res.publishTime,
        task.bind(this, res.id),
      );
    }

    return res;
  }

  async rebuildEmbeddings(id: string) {
    const article = await this.getOne({ where: { id } });
    try {
      const result =
        await this.articleChunkEmbeddingsService.rebuildArticleChunkEmbeddings({
          articleId: article.id,
          embeddingVersion: Number(article.embeddingVersion || 1),
          chunks: article.contentChunks || [],
        });
      await this.repository.update(id, { embeddingStatus: result.status });
      article.embeddingStatus = result.status;
      return { ...result, articleId: id };
    } catch (error) {
      await this.repository.update(id, { embeddingStatus: "failed" });
      throw error;
    }
  }

  async list(
    query: QueryListDto,
    currentUser?: Record<string, any>,
  ): Promise<ResponseListDto<Article>> {
    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const keyword = String(query.keyword || query.title || "").trim();
    const {
      status,
      catalogId,
      knowledgeType,
      sourceType,
      sourceProjectId,
      templateType,
      visibilityType,
      authorId,
      tagIds,
      sortBy,
    } = query as any;
    const catalogIds = catalogId
      ? (await this.articleCatalogsService.getChildren({ id: catalogId }))?.map(
          (item) => item.id,
        )
      : [];

    const qb = this.repository
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.catalog", "catalog")
      .leftJoinAndSelect("article.author", "author")
      .leftJoinAndSelect("article.maintainer", "maintainer")
      .leftJoinAndSelect("article.tags", "tag")
      .where("article.is_delete IS NULL");

    if (status !== undefined && status !== "") {
      qb.andWhere("article.status = :status", { status });
    }
    if (catalogIds?.length) {
      qb.andWhere("article.catalogId IN (:...catalogIds)", { catalogIds });
    }
    if (knowledgeType) {
      qb.andWhere("article.knowledgeType = :knowledgeType", { knowledgeType });
    }
    if (sourceType) {
      qb.andWhere("article.sourceType = :sourceType", { sourceType });
    }
    if (sourceProjectId) {
      qb.andWhere("article.sourceProjectId = :sourceProjectId", {
        sourceProjectId,
      });
    }
    if (templateType) {
      qb.andWhere("article.templateType = :templateType", { templateType });
    }
    if (visibilityType) {
      qb.andWhere("article.visibilityType = :visibilityType", {
        visibilityType,
      });
    }
    if (authorId) {
      qb.andWhere("article.authorId = :authorId", { authorId });
    }
    if (keyword) {
      qb.andWhere(
        "(article.title LIKE :keyword OR article.summary LIKE :keyword OR article.contentText LIKE :keyword OR article.keywords LIKE :keyword)",
        {
          keyword: `%${keyword}%`,
        },
      );
    }
    if (tagIds) {
      const ids = String(tagIds)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (ids.length) {
        qb.andWhere("tag.id IN (:...tagIds)", { tagIds: ids });
      }
    }

    const sortMap = {
      top: () =>
        qb
          .orderBy("article.isTop", "DESC")
          .addOrderBy("article.topSort", "ASC")
          .addOrderBy("article.updateTime", "DESC")
          .addOrderBy("article.createTime", "DESC"),
      latest: () =>
        qb
          .orderBy("article.updateTime", "DESC")
          .addOrderBy("article.createTime", "DESC"),
      weight: () =>
        qb
          .orderBy("article.retrievalWeight", "DESC")
          .addOrderBy("article.updateTime", "DESC"),
      authority: () =>
        qb
          .orderBy("article.authorityLevel", "DESC")
          .addOrderBy("article.retrievalWeight", "DESC")
          .addOrderBy("article.updateTime", "DESC"),
      aiPreferred: () =>
        qb
          .orderBy("article.aiPreferred", "DESC")
          .addOrderBy("article.retrievalWeight", "DESC")
          .addOrderBy("article.updateTime", "DESC"),
    };
    (sortMap[sortBy] || sortMap.latest)();

    const [list, total] = await qb
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    const currentUserId = currentUser?.id ? String(currentUser.id) : "";
    const roleIds = currentUserId
      ? await this.getCurrentUserRoleIds(currentUserId)
      : [];
    const canViewAll = this.hasGlobalAccess(currentUser);
    const data = await Promise.all(
      list.map((article) =>
        this.maskArticleForCurrentUser(
          article,
          currentUserId,
          roleIds,
          canViewAll,
        ),
      ),
    );

    return {
      list: data,
      rows: data,
      data,
      total,
      pageNum,
      pageSize,
    } as ResponseListDto<Article>;
  }

  async getOneForAccess(id: string, currentUser?: Record<string, any>) {
    const article = await this.getOne({
      where: { id },
      relations: ["catalog", "author", "maintainer", "tags"],
    });
    const currentUserId = currentUser?.id ? String(currentUser.id) : "";
    const roleIds = currentUserId
      ? await this.getCurrentUserRoleIds(currentUserId)
      : [];
    const access = this.checkArticleAccess(
      article,
      currentUserId,
      roleIds,
      this.hasGlobalAccess(currentUser),
    );
    if (!access.hasAccess) {
      const error: any = new Error("当前知识无访问权限");
      error.status = 403;
      error.code = "KNOWLEDGE_FORBIDDEN";
      error.canBorrow = access.canBorrow;
      error.catalogId = article.catalogId;
      error.articleId = article.id;
      throw error;
    }
    return this.maskArticleForCurrentUser(
      article,
      currentUserId,
      roleIds,
      this.hasGlobalAccess(currentUser),
    );
  }

  async retrieveForAi(
    query: {
      keyword?: string;
      knowledgeType?: string;
      catalogId?: string;
      limit?: number;
    },
    currentUser?: Record<string, any>,
  ) {
    const keyword = String(query.keyword || "").trim();
    const limit = Math.min(Number(query.limit || 10), 20);
    const catalogIds = query.catalogId
      ? (await this.articleCatalogsService.getChildren({ id: query.catalogId }))
          ?.map((item) => item.id)
          .filter(Boolean)
      : [];
    const currentUserId = currentUser?.id ? String(currentUser.id) : "";
    const roleIds = currentUserId
      ? await this.getCurrentUserRoleIds(currentUserId)
      : [];
    const canViewAll = this.hasGlobalAccess(currentUser);

    const qb = this.repository
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.catalog", "catalog")
      .leftJoinAndSelect("article.tags", "tag")
      .where("article.is_delete IS NULL")
      .andWhere("article.status = :status", { status: Status.published });

    if (query.knowledgeType) {
      qb.andWhere("article.knowledgeType = :knowledgeType", {
        knowledgeType: query.knowledgeType,
      });
    }
    if (catalogIds?.length) {
      qb.andWhere("article.catalogId IN (:...catalogIds)", { catalogIds });
    }
    if (keyword) {
      qb.andWhere(
        "(article.title LIKE :keyword OR article.summary LIKE :keyword OR article.contentText LIKE :keyword OR article.keywords LIKE :keyword)",
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    const list = await qb
      .orderBy("article.retrievalWeight", "DESC")
      .addOrderBy("article.updateTime", "DESC")
      .take(limit * 3)
      .getMany();
    const data = list
      .map((article) =>
        this.maskArticleForCurrentUser(
          article,
          currentUserId,
          roleIds,
          canViewAll,
        ),
      )
      .filter((article: any) => article.hasAccess)
      .flatMap((article: any) => this.buildAiRetrieveItems(article, keyword))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (Number(right.aiPreferred || 0) !== Number(left.aiPreferred || 0)) {
          return Number(right.aiPreferred || 0) - Number(left.aiPreferred || 0);
        }
        if (
          Number(right.authorityLevel || 0) !== Number(left.authorityLevel || 0)
        ) {
          return (
            Number(right.authorityLevel || 0) - Number(left.authorityLevel || 0)
          );
        }
        return (
          Number(right.retrievalWeight || 0) - Number(left.retrievalWeight || 0)
        );
      })
      .slice(0, limit);

    return {
      total: data.length,
      data,
    };
  }

  async getHomeData(currentUser?: Record<string, any>) {
    const [topRes, hotRes, latestRes, hotCatalogs, hotKeywords] =
      await Promise.all([
        this.list(
          {
            pageNum: 1,
            pageSize: 8,
            status: Status.published,
            visibilityType: VisibilityType.public,
            sortBy: "top",
          } as any,
          currentUser,
        ),
        this.list(
          {
            pageNum: 1,
            pageSize: 6,
            status: Status.published,
            visibilityType: VisibilityType.public,
            sortBy: "weight",
          } as any,
          currentUser,
        ),
        this.list(
          {
            pageNum: 1,
            pageSize: 8,
            status: Status.published,
            sortBy: "latest",
          } as any,
          currentUser,
        ),
        this.getHotCatalogs(),
        this.getHotKeywords(),
      ]);

    const topArticles = (topRes.list || [])
      .filter((item: any) => this.isArticleTop(item))
      .slice(0, 4);
    return {
      topArticles: topArticles.length
        ? topArticles
        : (topRes.list || []).slice(0, 4),
      hotArticles: (hotRes.list || []).slice(0, 6),
      latestArticles: (latestRes.list || []).slice(0, 8),
      hotCatalogs,
      hotKeywords,
    };
  }

  async getHotKeywords() {
    const records = await this.articleSearchRecordsService.getHotKeywords(8);
    if (records.length) {
      return records;
    }

    const tagList = await this.articleTagsService.repository.find({
      order: { sort: "DESC", updateTime: "DESC" },
      take: 6,
    });
    const fallback = ["实施指南", "流程规范", "项目复盘"];
    return [
      ...new Set([...tagList.map((item) => item.name), ...fallback]),
    ].slice(0, 8);
  }

  async recordSearchKeyword(
    keyword: string,
    currentUser?: Record<string, any>,
  ) {
    return this.articleSearchRecordsService.recordKeyword(keyword, currentUser);
  }

  private async getHotCatalogs() {
    const rows = (await this.repository
      .createQueryBuilder("article")
      .leftJoin("article.catalog", "catalog")
      .select("article.catalogId", "id")
      .addSelect("catalog.name", "name")
      .addSelect("COUNT(article.id)", "articleCount")
      .where("article.is_delete IS NULL")
      .andWhere("article.status = :status", { status: Status.published })
      .andWhere("article.visibilityType = :visibilityType", {
        visibilityType: VisibilityType.public,
      })
      .andWhere("article.catalogId IS NOT NULL")
      .groupBy("article.catalogId")
      .addGroupBy("catalog.name")
      .orderBy("COUNT(article.id)", "DESC")
      .addOrderBy("MAX(article.updateTime)", "DESC")
      .limit(8)
      .getRawMany()) as Array<{
      id: string;
      name: string;
      articleCount: string;
    }>;

    return rows.map((item) => ({
      id: item.id,
      name: item.name,
      displayName: item.name,
      articleCount: Number(item.articleCount || 0),
      hotScore: Number(item.articleCount || 0),
    }));
  }

  private isArticleTop(article: any) {
    if (String(article?.isTop || "0") !== "1") {
      return false;
    }
    const now = dayjs();
    if (article.topStartTime && dayjs(article.topStartTime).isAfter(now)) {
      return false;
    }
    if (article.topEndTime && dayjs(article.topEndTime).isBefore(now)) {
      return false;
    }
    return true;
  }

  private extractPlainTextFromHtml(content = "") {
    return String(content || "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractPlainTextFromDocument(
    contentJson?: DocumentNode | Record<string, unknown> | null,
  ) {
    if (!contentJson || typeof contentJson !== "object") {
      return "";
    }

    const blockNodeTypes = new Set([
      "heading",
      "paragraph",
      "taskItem",
      "blockquote",
      "codeBlock",
      "tableCell",
      "tableHeader",
    ]);

    const normalizeInlineText = (text: string) => text.replace(/\s+/g, " ");

    const collectInlineText = (node: unknown): string => {
      if (!node || typeof node !== "object") {
        return "";
      }

      const documentNode = node as Record<string, unknown>;
      let text = "";

      if (typeof documentNode.text === "string" && documentNode.text.length) {
        text += normalizeInlineText(documentNode.text);
      }

      if (Array.isArray(documentNode.content)) {
        documentNode.content.forEach((child) => {
          text += collectInlineText(child);
        });
      }

      return text;
    };

    const collectBlockTexts = (node: unknown): string[] => {
      if (!node || typeof node !== "object") {
        return [];
      }

      const documentNode = node as Record<string, unknown>;
      const nodeType =
        typeof documentNode.type === "string" ? documentNode.type : "";

      if (blockNodeTypes.has(nodeType)) {
        const blockText = collectInlineText(node).trim();
        return blockText ? [blockText] : [];
      }

      if (!Array.isArray(documentNode.content)) {
        return [];
      }

      return documentNode.content.flatMap((child) => collectBlockTexts(child));
    };

    return collectBlockTexts(contentJson)
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;!?，。；：！？])/g, "$1")
      .trim();
  }

  private buildContentChunks(
    contentText = "",
    contentJson?: DocumentNode | Record<string, unknown> | null,
    articleId = "",
    contentVersion = DOCUMENT_SCHEMA_VERSION,
  ) {
    const structuredChunks = this.buildStructuredContentChunks(
      contentJson,
      articleId,
      contentVersion,
    );
    if (structuredChunks.length) {
      return structuredChunks;
    }

    const paragraphs = String(contentText || "")
      .split(/(?<=[。！？\.!?])\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return paragraphs.slice(0, 50).map((text, index) => ({
      id: this.createChunkId(articleId, contentVersion, index + 1),
      order: index + 1,
      title: `片段 ${index + 1}`,
      headingPath: [],
      text,
      summary: text.slice(0, 120),
      tokenEstimate: this.estimateTokenCount(text),
    }));
  }

  private buildStructuredContentChunks(
    contentJson?: DocumentNode | Record<string, unknown> | null,
    articleId = "",
    contentVersion = DOCUMENT_SCHEMA_VERSION,
  ) {
    if (!contentJson || typeof contentJson !== "object") {
      return [];
    }

    const chunks: Array<{
      id: string;
      order: number;
      title: string;
      headingPath: string[];
      text: string;
      summary: string;
      tokenEstimate: number;
    }> = [];
    const headingPath: string[] = [];
    const maxChunkLength = 900;
    const targetChunkLength = 500;
    let pendingTexts: string[] = [];
    let pendingHeadingPath: string[] = [];
    let order = 1;

    const flushPending = () => {
      const text = pendingTexts.join(" ").replace(/\s+/g, " ").trim();
      if (!text) return;
      this.splitChunkText(text, maxChunkLength).forEach((chunkText) => {
        const title =
          pendingHeadingPath[pendingHeadingPath.length - 1] || `片段 ${order}`;
        chunks.push({
          id: this.createChunkId(articleId, contentVersion, order),
          order,
          title,
          headingPath: [...pendingHeadingPath],
          text: chunkText,
          summary: chunkText.slice(0, 120),
          tokenEstimate: this.estimateTokenCount(chunkText),
        });
        order += 1;
      });
      pendingTexts = [];
    };

    const appendBlockText = (text: string) => {
      const normalizedText = String(text || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!normalizedText) return;
      if (
        pendingTexts.length &&
        pendingTexts.join(" ").length + normalizedText.length >
          targetChunkLength
      ) {
        flushPending();
      }
      pendingHeadingPath = [...headingPath];
      pendingTexts.push(normalizedText);
      if (pendingTexts.join(" ").length >= targetChunkLength) {
        flushPending();
      }
    };

    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const documentNode = node as Record<string, any>;
      const nodeType =
        typeof documentNode.type === "string" ? documentNode.type : "";

      if (nodeType === "heading") {
        flushPending();
        const level = Math.max(
          1,
          Math.min(Number(documentNode.attrs?.level || 1), 6),
        );
        const headingText = this.collectInlineText(documentNode).trim();
        if (headingText) {
          headingPath.splice(level - 1);
          headingPath[level - 1] = headingText;
        }
        return;
      }

      if (
        [
          "paragraph",
          "taskItem",
          "blockquote",
          "codeBlock",
          "tableCell",
          "tableHeader",
        ].includes(nodeType)
      ) {
        appendBlockText(this.collectInlineText(documentNode));
        return;
      }

      if (Array.isArray(documentNode.content)) {
        documentNode.content.forEach((child) => walk(child));
      }
    };

    walk(contentJson);
    flushPending();
    return chunks.slice(0, 50);
  }

  private collectInlineText(node: unknown): string {
    if (!node || typeof node !== "object") return "";
    const documentNode = node as Record<string, unknown>;
    const currentText =
      typeof documentNode.text === "string" ? documentNode.text : "";
    const childText = Array.isArray(documentNode.content)
      ? documentNode.content
          .map((child) => this.collectInlineText(child))
          .join("")
      : "";
    return `${currentText}${childText}`;
  }

  private splitChunkText(text: string, maxLength: number) {
    if (text.length <= maxLength) return [text];
    const sentences = text
      .split(/(?<=[。！？\.!?])\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
    const result: string[] = [];
    let current = "";
    sentences.forEach((sentence) => {
      if (!current) {
        current = sentence;
        return;
      }
      if (current.length + sentence.length > maxLength) {
        result.push(current.slice(0, maxLength));
        current = sentence;
        return;
      }
      current = `${current} ${sentence}`;
    });
    if (current) result.push(current.slice(0, maxLength));
    return result.flatMap((item) => {
      if (item.length <= maxLength) return [item];
      const chunks: string[] = [];
      for (let index = 0; index < item.length; index += maxLength) {
        chunks.push(item.slice(index, index + maxLength));
      }
      return chunks;
    });
  }

  private estimateTokenCount(text: string) {
    return Math.ceil(String(text || "").length / 2);
  }

  private createChunkId(
    articleId: string,
    contentVersion: number,
    order: number,
  ) {
    return `${articleId || "article"}:${contentVersion || DOCUMENT_SCHEMA_VERSION}:${order}`;
  }

  private buildAiRetrieveItems(article: any, keyword: string) {
    const chunks = Array.isArray(article.contentChunks)
      ? article.contentChunks
      : [];
    if (!chunks.length) {
      const chunk = {
        order: 0,
        title: "全文",
        text: article.contentText || "",
        summary: (article.contentText || "").slice(0, 120),
      };
      const scoreBreakdown = this.calculateAiRetrieveScore(
        article,
        chunk,
        keyword,
      );
      return [
        {
          articleId: article.id,
          articleTitle: article.title,
          articleSummary: article.summary || article.desc || "",
          catalog: article.catalog
            ? { id: article.catalog.id, name: article.catalog.name }
            : null,
          knowledgeType: article.knowledgeType,
          tags: (article.tags || []).map((tag) => ({
            id: tag.id,
            name: tag.name,
          })),
          chunkOrder: chunk.order,
          chunkTitle: chunk.title,
          headingPath: chunk.headingPath || [],
          chunkText: chunk.text,
          chunkSummary: chunk.summary,
          tokenEstimate: chunk.tokenEstimate,
          score: scoreBreakdown.finalScore,
          scoreBreakdown,
          matchedTerms: scoreBreakdown.matchedTerms,
          matchedFields: scoreBreakdown.matchedFields,
          retrievalWeight: article.retrievalWeight,
          aiPreferred: article.aiPreferred,
          authorityLevel: article.authorityLevel,
          embeddingStatus: article.embeddingStatus,
          embeddingVersion: article.embeddingVersion,
          visibilityType: article.visibilityType,
          updateTime: article.updateTime,
        },
      ];
    }

    return chunks.map((chunk) => {
      const scoreBreakdown = this.calculateAiRetrieveScore(
        article,
        chunk,
        keyword,
      );
      return {
        articleId: article.id,
        articleTitle: article.title,
        articleSummary: article.summary || article.desc || "",
        catalog: article.catalog
          ? { id: article.catalog.id, name: article.catalog.name }
          : null,
        knowledgeType: article.knowledgeType,
        tags: (article.tags || []).map((tag) => ({
          id: tag.id,
          name: tag.name,
        })),
        chunkOrder: chunk.order,
        chunkTitle: chunk.title,
        headingPath: chunk.headingPath || [],
        chunkText: chunk.text,
        chunkSummary: chunk.summary,
        tokenEstimate: chunk.tokenEstimate,
        score: scoreBreakdown.finalScore,
        scoreBreakdown,
        matchedTerms: scoreBreakdown.matchedTerms,
        matchedFields: scoreBreakdown.matchedFields,
        retrievalWeight: article.retrievalWeight,
        aiPreferred: article.aiPreferred,
        authorityLevel: article.authorityLevel,
        embeddingStatus: article.embeddingStatus,
        embeddingVersion: article.embeddingVersion,
        visibilityType: article.visibilityType,
        updateTime: article.updateTime,
      };
    });
  }

  async rebuildChunks(id: string, currentUser?: Record<string, any>) {
    const article = await this.getOne({
      where: { id },
      relations: ["catalog", "author", "maintainer", "tags"],
    });
    const currentUserId = currentUser?.id ? String(currentUser.id) : "";
    const roleIds = currentUserId
      ? await this.getCurrentUserRoleIds(currentUserId)
      : [];
    const access = this.checkArticleAccess(
      article,
      currentUserId,
      roleIds,
      this.hasGlobalAccess(currentUser),
    );
    if (!access.hasAccess) {
      throw new Error("当前无重建切片权限");
    }
    article.contentText =
      this.extractPlainTextFromDocument(article.contentJson) ||
      this.extractPlainTextFromHtml(article.content);
    article.contentChunks = this.buildContentChunks(
      article.contentText,
      article.contentJson,
      article.id,
      Number(article.contentVersion || DOCUMENT_SCHEMA_VERSION),
    );
    article.embeddingStatus = "pending";
    article.embeddingVersion = Number(article.embeddingVersion || 1) + 1;
    await this.syncArticleEmbeddings(article);
    article.updateUser = currentUser?.name || article.updateUser;
    return this.repository.save(article);
  }

  private async syncArticleEmbeddings(article: Article) {
    try {
      const result =
        await this.articleChunkEmbeddingsService.rebuildArticleChunkEmbeddings({
          articleId: article.id,
          embeddingVersion: Number(article.embeddingVersion || 1),
          chunks: article.contentChunks || [],
        });
      article.embeddingStatus = result.status;
      return result;
    } catch (error) {
      article.embeddingStatus = "failed";
      throw error;
    }
  }

  async del(
    ids: string[] | string,
    updateUser?: string,
    permissions: string[] = [],
    operatorName?: string,
    operatorId?: string,
  ) {
    const idList = Array.isArray(ids)
      ? ids.map((item) => String(item))
      : String(ids || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    const currentUserId = String(operatorId || "");
    if (currentUserId) {
      const articles = await this.repository.find({
        where: { id: In(idList) as any, isDelete: null as any } as any,
        relations: ["catalog"],
      });
      for (const article of articles) {
        const articlePermissions = await this.getArticlePermissions(
          article,
          currentUserId,
          permissions,
        );
        if (!articlePermissions.canDelete) {
          throw new ForbiddenException("当前无删除该项目知识的权限");
        }
      }
    }
    return super.del(idList, updateUser, permissions, operatorName);
  }

  private async validateProjectKnowledgePermissionForSave(
    dto: any,
    currentUserId: string,
  ) {
    if (!currentUserId) return;
    const targetCatalogId = String(dto.catalogId || "").trim();
    const existing = dto.id
      ? await this.repository.findOne({
          where: { id: dto.id } as any,
          relations: ["catalog"],
        })
      : null;
    const existingContext = existing?.catalogId
      ? await this.getProjectKnowledgeContext(existing.catalogId, currentUserId)
      : null;
    const targetContext = targetCatalogId
      ? await this.getProjectKnowledgeContext(targetCatalogId, currentUserId)
      : null;

    if (existing && existingContext) {
      const existingPermissions = await this.getArticlePermissions(
        existing,
        currentUserId,
      );
      if (!existingPermissions.canEdit) {
        throw new ForbiddenException("当前无编辑该项目知识的权限");
      }
    }

    if (!existing && targetContext && !targetContext.isMember) {
      throw new ForbiddenException(
        "只有项目成员可以在该项目知识空间中新增知识",
      );
    }

    if (existing && targetContext && !targetContext.isMember) {
      throw new ForbiddenException("当前无权限将知识移动到该项目知识空间");
    }
  }

  private calculateChunkScore(text: string, keyword: string) {
    if (!keyword) {
      return 1;
    }
    const normalizedText = String(text || "").toLowerCase();
    const terms = this.getAiRetrieveTerms(keyword);
    return terms.reduce(
      (score, term) => (normalizedText.includes(term) ? score + 1 : score),
      0,
    );
  }

  private getAiRetrieveTerms(keyword: string) {
    const normalizedKeyword = String(keyword || "")
      .toLowerCase()
      .trim();
    const baseTerms = normalizedKeyword
      .split(/[\s,，、;；]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 1);
    const compactKeyword = normalizedKeyword.replace(/[\s,，、;；]+/g, "");
    const chineseTerms = compactKeyword.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const slidingTerms = chineseTerms.flatMap((text) => {
      const result: string[] = [];
      for (let size = 2; size <= Math.min(4, text.length); size += 1) {
        for (let index = 0; index <= text.length - size; index += 1) {
          result.push(text.slice(index, index + size));
        }
      }
      return result;
    });
    return [...new Set([...baseTerms, ...slidingTerms])];
  }

  private calculateAiRetrieveScore(article: any, chunk: any, keyword: string) {
    const terms = this.getAiRetrieveTerms(keyword);
    const fieldWeights = [
      { field: "title", text: article.title, weight: 8 },
      { field: "keywords", text: article.keywords, weight: 6 },
      { field: "summary", text: article.summary || article.desc, weight: 4 },
      { field: "chunkTitle", text: chunk.title, weight: 3 },
      {
        field: "chunkText",
        text: `${chunk.text || ""} ${chunk.summary || ""}`,
        weight: 1,
      },
    ];
    const matchedTerms = new Set<string>();
    const matchedFields = new Set<string>();
    let keywordScore = keyword ? 0 : 1;

    fieldWeights.forEach(({ field, text, weight }) => {
      const normalizedText = String(text || "").toLowerCase();
      terms.forEach((term) => {
        if (!term || !normalizedText.includes(term)) return;
        matchedTerms.add(term);
        matchedFields.add(field);
        keywordScore += weight;
      });
    });

    const aiPreferredBonus = String(article.aiPreferred || "0") === "1" ? 5 : 0;
    const authorityBonus =
      String(article.authorityLevel || "0") === "1" ? 4 : 0;
    const retrievalWeightBonus = Number(article.retrievalWeight || 0) * 0.5;
    const freshnessBonus =
      article.updateTime && dayjs().diff(dayjs(article.updateTime), "day") <= 30
        ? 1
        : 0;
    const finalScore = Number(
      (
        keywordScore +
        aiPreferredBonus +
        authorityBonus +
        retrievalWeightBonus +
        freshnessBonus
      ).toFixed(2),
    );

    return {
      finalScore,
      keywordScore,
      aiPreferredBonus,
      authorityBonus,
      retrievalWeightBonus,
      freshnessBonus,
      matchedTerms: [...matchedTerms],
      matchedFields: [...matchedFields],
    };
  }

  private normalizeIdList(value: string[] | string) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private async getCurrentUserRoleIds(userId: string) {
    const user = await this.usersService.getOne({ id: userId }, false);
    return (user?.roles || []).map((role) => String(role.id));
  }

  private hasGlobalAccess(currentUser?: Record<string, any>) {
    const permissions = currentUser?.permissions || [];
    return (
      permissions.includes("*") ||
      permissions.includes("content/articles/viewAll")
    );
  }

  private hasGlobalManageAccess(permissions: string[] = []) {
    return permissions.includes("*");
  }

  private async getProjectKnowledgeContext(
    catalogId: string,
    currentUserId: string,
  ) {
    if (!catalogId) return null;
    const ancestors = await this.articleCatalogRepository.findAncestors(
      new ArticleCatalog({ id: catalogId }),
    );
    const ancestorIds = ancestors
      .map((item) => String(item.id))
      .filter(Boolean);
    if (!ancestorIds.length) return null;
    const project = await this.projectRepository.findOne({
      where: {
        knowledgeCatalogId: In(ancestorIds) as any,
        isDelete: null as any,
      } as any,
    });
    if (!project) return null;

    const member = currentUserId
      ? await this.projectMemberRepository.findOne({
          where: {
            projectId: project.id,
            userId: currentUserId,
            isActive: "1",
            isDelete: null as any,
          } as any,
        })
      : null;
    const isManager =
      String(project.leaderId || "") === currentUserId ||
      member?.role === ProjectMemberRole.manager;
    const isVisitor = member?.role === ProjectMemberRole.visitor;
    return {
      project,
      member,
      isMember: Boolean(member) || isManager,
      isManager,
      isVisitor,
    };
  }

  private async getArticlePermissions(
    article: Article,
    currentUserId: string,
    permissions: string[] = [],
  ) {
    if (this.hasGlobalManageAccess(permissions)) {
      return { canEdit: true, canDelete: true };
    }

    const projectContext = await this.getProjectKnowledgeContext(
      article.catalogId,
      currentUserId,
    );
    if (!projectContext) {
      return {
        canEdit: permissions.includes("business/articles/update"),
        canDelete: permissions.includes("business/articles/delete"),
      };
    }

    if (projectContext.isManager) {
      return { canEdit: true, canDelete: true };
    }

    const isOwner =
      String(article.authorId || "") === currentUserId ||
      String(article.maintainerId || "") === currentUserId;
    return {
      canEdit: projectContext.isMember && isOwner,
      canDelete: false,
    };
  }

  private checkArticleAccess(
    article: Article,
    currentUserId: string,
    roleIds: string[],
    canViewAll = false,
  ) {
    if (canViewAll) {
      return {
        hasAccess: true,
        canBorrow: false,
        isRestricted: false,
        accessSource: "admin",
      };
    }
    if (article.authorId && String(article.authorId) === currentUserId) {
      return {
        hasAccess: true,
        canBorrow: false,
        isRestricted: false,
        accessSource: "author",
      };
    }
    if (
      article.maintainerId &&
      String(article.maintainerId) === currentUserId
    ) {
      return {
        hasAccess: true,
        canBorrow: false,
        isRestricted: false,
        accessSource: "maintainer",
      };
    }
    if (article.visibilityType === VisibilityType.public) {
      return {
        hasAccess: true,
        canBorrow: false,
        isRestricted: false,
        accessSource: "public",
      };
    }
    if (article.visibilityType === VisibilityType.role) {
      const visibleRoles = this.normalizeIdList(article.visibleRoleIds);
      if (visibleRoles.some((id) => roleIds.includes(String(id)))) {
        return {
          hasAccess: true,
          canBorrow: false,
          isRestricted: false,
          accessSource: "role",
        };
      }
    }
    if (article.visibilityType === VisibilityType.specified) {
      const visibleUsers = this.normalizeIdList(article.visibleUserIds);
      if (visibleUsers.includes(currentUserId)) {
        return {
          hasAccess: true,
          canBorrow: false,
          isRestricted: false,
          accessSource: "specified",
        };
      }
    }

    const allowBorrow = article.catalog?.allowBorrow === "1";
    return {
      hasAccess: false,
      canBorrow: allowBorrow,
      isRestricted: true,
      accessSource: "none",
    };
  }

  private async maskArticleForCurrentUser(
    article: Article,
    currentUserId: string,
    roleIds: string[],
    canViewAll = false,
  ) {
    const access = this.checkArticleAccess(
      article,
      currentUserId,
      roleIds,
      canViewAll,
    );
    const projectContext = currentUserId
      ? await this.getProjectKnowledgeContext(article.catalogId, currentUserId)
      : null;
    const permissions = await this.getArticlePermissions(
      article,
      currentUserId,
    );
    if (access.hasAccess || projectContext?.isMember) {
      return Object.assign(
        article,
        access.hasAccess
          ? access
          : {
              hasAccess: true,
              canBorrow: false,
              isRestricted: false,
              accessSource: projectContext?.isVisitor
                ? "projectVisitor"
                : "projectMember",
            },
        permissions,
      );
    }
    return Object.assign(article, {
      ...access,
      ...permissions,
      summary: "当前知识受限，暂无查看权限",
      desc: "当前知识受限，暂无查看权限",
      content: "",
      contentJson: null,
      contentText: "",
      contentChunks: [],
    });
  }
}
