import { Injectable } from "@nestjs/common";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, In, Repository } from "typeorm";
import { Risk, RiskStatus, riskCategoryMap, riskLevelMap } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { CreateRiskDto } from "./dto";
import { User } from "src/modules/users/entities/user.entity";
import { Article, Status as ArticleStatus } from "../articles/entity";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { KnowledgeType, VisibilityType } from "../articles/constants";
import { ProjectsService } from "../projects/service";

@Injectable()
export class RisksService extends BaseService<Risk, CreateRiskDto> {
  constructor(
    @InjectRepository(Risk) repository: Repository<Risk>,
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    private readonly projectsService: ProjectsService,
  ) {
    super(Risk, repository);
  }

  private async assertRiskEditPermission(riskId: string, operatorId: string) {
    if (!riskId || !operatorId) return;
    const risk = await this.repository.findOne({
      where: { id: riskId, isDelete: null as any } as any,
      select: ["id", "projectId", "riskOwnerId", "createUser"] as any,
    });
    if (!risk) throw new NotFoundException("风险不存在");
    const context = await this.projectsService.assertProjectPermission(
      risk.projectId,
      operatorId,
      "view",
    );
    const canEdit =
      context.isManager ||
      context.isDeliveryManager ||
      context.isFunctionalLead ||
      String(risk.riskOwnerId || "") === String(operatorId) ||
      String(risk.createUser || "") === String(operatorId);
    if (!canEdit) {
      throw new ForbiddenException("当前无编辑该风险的权限");
    }
  }

  private async getRiskPermissions(risk: Risk, operatorId: string) {
    if (!operatorId) return { canEdit: false, canDelete: false };
    const context = await this.projectsService.getProjectPermissionContext(
      risk.projectId,
      operatorId,
    );
    const canEdit =
      Boolean(context?.isManager) ||
      Boolean(context?.isDeliveryManager) ||
      Boolean(context?.isFunctionalLead) ||
      String(risk.riskOwnerId || "") === String(operatorId) ||
      String(risk.createUser || "") === String(operatorId);
    return {
      canEdit,
      canDelete:
        Boolean(context?.isManager) ||
        Boolean(context?.isDeliveryManager) ||
        String(risk.riskOwnerId || "") === String(operatorId) ||
        String(risk.createUser || "") === String(operatorId),
    };
  }

  async resolve(id: string): Promise<any> {
    return this.repository.update(id, {
      status: RiskStatus.resolved,
      resolvedDate: new Date().toISOString().split("T")[0],
    });
  }

  async save(dto: any) {
    await this.projectsService.assertProjectNotArchived(String(dto.projectId || ""));
    if (dto.id && dto._operatorId) {
      await this.assertRiskEditPermission(
        String(dto.id),
        String(dto._operatorId),
      );
    }
    return super.save(dto);
  }

  async update(dto: any) {
    await this.projectsService.assertProjectNotArchived(String(dto.projectId || ""));
    if (dto.id && dto._operatorId) {
      await this.assertRiskEditPermission(
        String(dto.id),
        String(dto._operatorId),
      );
    }
    return super.update(dto);
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
    const successIds: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];
    if (operatorId) {
      for (const id of idList) {
        try {
          await this.assertRiskEditPermission(id, operatorId);
          successIds.push(id);
        } catch (error) {
          failed.push({
            id,
            reason: error?.message || "当前无删除该风险的权限",
          });
        }
      }
    } else {
      successIds.push(...idList);
    }
    if (!successIds.length) {
      return {
        successCount: 0,
        failedCount: failed.length,
        successIds: [],
        failed,
      } as any;
    }
    const result = await super.del(
      successIds,
      updateUser,
      permissions,
      operatorName,
      operatorId,
    );
    return {
      ...result,
      successCount: successIds.length,
      failedCount: failed.length,
      successIds,
      failed,
    } as any;
  }

  private mapUserSummary(user?: User | null) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }

  private mapProjectSummary(project?: any) {
    if (!project) return null;
    return {
      id: project.id,
      code: project.code,
      name: project.name,
    };
  }

  async getOne(query, isError = true): Promise<any | null> {
    const risk = await super.getOne(
      {
        where: query,
        relations: ["project", "riskOwner"],
      },
      isError,
    );
    if (!risk) return risk;
    if ((query as any)._operatorId) {
      await this.projectsService.assertExecutionObjectPermission(
        risk.projectId,
        String((query as any)._operatorId),
      );
    }

    const detail = {
      ...risk,
      project: this.mapProjectSummary(risk.project),
      riskOwner: this.mapUserSummary(risk.riskOwner),
    };
    if ((query as any)._operatorId) {
      Object.assign(
        detail,
        await this.getRiskPermissions(risk, String((query as any)._operatorId)),
      );
    }
    return detail;
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Risk>> {
    let {
      projectId,
      status,
      level,
      category,
      name,
      knowledgeLinked,
      _operatorId,
      _operatorPermissions,
    } = query as any;
    const visibleProjectIds =
      await this.projectsService.getVisibleProjectIdsForUser(
        String(_operatorId || ""),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
      );
    if (visibleProjectIds && !visibleProjectIds.length) {
      return { list: [], total: 0 } as any;
    }
    let executionVisibleProjectIds = visibleProjectIds;
    if (_operatorId && visibleProjectIds) {
      executionVisibleProjectIds = [];
      for (const id of visibleProjectIds) {
        try {
          await this.projectsService.assertExecutionObjectPermission(
            id,
            String(_operatorId),
          );
          executionVisibleProjectIds.push(id);
        } catch {}
      }
      if (!executionVisibleProjectIds.length) {
        return { list: [], total: 0 } as any;
      }
    }
    let queryOrm: FindManyOptions = {
      where: {
        name: this.sqlLike(name),
        projectId:
          projectId ||
          (executionVisibleProjectIds
            ? In(executionVisibleProjectIds)
            : undefined),
        status: status || undefined,
        level: level || undefined,
        category: category || undefined,
        knowledgeLinked:
          knowledgeLinked !== undefined && knowledgeLinked !== ""
            ? knowledgeLinked
            : undefined,
      },
      relations: ["project", "riskOwner"],
      order: { sort: "ASC", createTime: "DESC" },
    };
    const res = await this.listBy(queryOrm, query);
    for (const row of res.list || []) {
      if (_operatorId) {
        Object.assign(
          row,
          await this.getRiskPermissions(row, String(_operatorId)),
        );
      }
    }
    return res;
  }

  async publishToKnowledge(
    id: string,
    currentUser: { id?: string; name?: string } = {},
  ) {
    const risk = await this.getOne({ id });
    if (!risk) throw new Error("风险不存在");
    if (!risk.projectId) {
      throw new Error("仅支持将已关联项目的风险沉淀到知识中心");
    }

    const reviewCatalog = await this.projectsService.getKnowledgeChildCatalog(
      risk.projectId,
      "项目复盘",
    );
    if (!reviewCatalog) {
      throw new Error("当前项目尚未生成“项目复盘”知识分类");
    }

    const title = `${risk.name}-风险案例`;
    const existing = await this.articleRepository.findOne({
      where: {
        catalogId: reviewCatalog.id,
        title,
        isDelete: null as any,
      } as any,
      order: { createTime: "DESC" },
    });

    const content = [
      "## 风险背景",
      risk.description || "暂无",
      "",
      "## 风险分类",
      `${riskCategoryMap[risk.category] || "-"} / ${riskLevelMap[risk.level] || "-"}`,
      "",
      "## 风险状态",
      `${risk.status || "-"}`,
      "",
      "## 影响程度",
      `${risk.impactEstimate || 0}%`,
      "",
      "## 应对措施",
      risk.mitigation || "暂无",
      "",
      "## 责任人与时间",
      `责任人：${risk.riskOwner?.nickname || risk.riskOwner?.name || "-"}\n识别日期：${risk.identifiedDate || "-"}\n计划解决日期：${risk.dueDate || "-"}\n实际解决日期：${risk.resolvedDate || "-"}`,
    ].join("\n");

    const operatorId = String(currentUser.id || risk.riskOwnerId || "");
    const operatorName = String(currentUser.name || "系统");
    const article = await this.articleRepository.save(
      new Article({
        id: existing?.id,
        title,
        desc: risk.description || risk.mitigation || "",
        summary: String(risk.description || risk.mitigation || "").slice(
          0,
          200,
        ),
        catalogId: reviewCatalog.id,
        catalog: Object.assign(new ArticleCatalog(), { id: reviewCatalog.id }),
        thumb: existing?.thumb || "",
        content,
        contentText: content,
        knowledgeType: KnowledgeType.experience,
        sourceType: "risk",
        sourceId: String(risk.id || ""),
        sourceProjectId: String(risk.projectId || ""),
        templateType: "review",
        authorId: operatorId || null,
        maintainerId: operatorId || null,
        visibilityType: VisibilityType.specified,
        visibleRoleIds: [],
        visibleUserIds: reviewCatalog.defaultVisibleUserIds || [],
        order: existing?.order || "1",
        status: ArticleStatus.published,
        createUser: operatorName,
        updateUser: operatorName,
      }),
    );

    await this.repository.update(risk.id, {
      knowledgeLinked: "1",
      knowledgeArticleId: String(article.id),
    } as any);

    return {
      articleId: article.id,
      catalogId: reviewCatalog.id,
      title: article.title,
    };
  }
}
