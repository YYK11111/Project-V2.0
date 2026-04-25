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
    dto.contentChunks = this.buildContentChunks(dto.contentText);
    dto.contentVersion = DOCUMENT_SCHEMA_VERSION;
    dto.contentStatus = DOCUMENT_READY_STATUS;
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

    let res = await super.save(dto);

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
    if (query.catalogId) {
      qb.andWhere("article.catalogId = :catalogId", {
        catalogId: query.catalogId,
      });
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

      if (
        typeof documentNode.text === "string" &&
        documentNode.text.length
      ) {
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

  private buildContentChunks(contentText = "") {
    const paragraphs = String(contentText || "")
      .split(/(?<=[。！？\.!?])\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return paragraphs.slice(0, 50).map((text, index) => ({
      order: index + 1,
      title: `片段 ${index + 1}`,
      text,
      summary: text.slice(0, 120),
    }));
  }

  private buildAiRetrieveItems(article: any, keyword: string) {
    const chunks = Array.isArray(article.contentChunks)
      ? article.contentChunks
      : [];
    if (!chunks.length) {
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
          chunkOrder: 0,
          chunkTitle: "全文",
          chunkText: article.contentText || "",
          chunkSummary: (article.contentText || "").slice(0, 120),
          score: this.calculateChunkScore(
            article.title +
              " " +
              (article.summary || "") +
              " " +
              (article.contentText || ""),
            keyword,
          ),
          retrievalWeight: article.retrievalWeight,
          embeddingStatus: article.embeddingStatus,
          embeddingVersion: article.embeddingVersion,
          visibilityType: article.visibilityType,
          updateTime: article.updateTime,
        },
      ];
    }

    return chunks.map((chunk) => ({
      articleId: article.id,
      articleTitle: article.title,
      articleSummary: article.summary || article.desc || "",
      catalog: article.catalog
        ? { id: article.catalog.id, name: article.catalog.name }
        : null,
      knowledgeType: article.knowledgeType,
      tags: (article.tags || []).map((tag) => ({ id: tag.id, name: tag.name })),
      chunkOrder: chunk.order,
      chunkTitle: chunk.title,
      chunkText: chunk.text,
      chunkSummary: chunk.summary,
      score: this.calculateChunkScore(
        `${article.title} ${article.summary || ""} ${chunk.title || ""} ${chunk.text || ""}`,
        keyword,
      ),
      retrievalWeight: article.retrievalWeight,
      aiPreferred: article.aiPreferred,
      authorityLevel: article.authorityLevel,
      embeddingStatus: article.embeddingStatus,
      embeddingVersion: article.embeddingVersion,
      visibilityType: article.visibilityType,
      updateTime: article.updateTime,
    }));
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
    article.contentChunks = this.buildContentChunks(article.contentText);
    article.embeddingStatus = "pending";
    article.embeddingVersion = Number(article.embeddingVersion || 1) + 1;
    article.updateUser = currentUser?.name || article.updateUser;
    return this.repository.save(article);
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
    const terms = keyword
      .toLowerCase()
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    return terms.reduce(
      (score, term) => (normalizedText.includes(term) ? score + 1 : score),
      0,
    );
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
