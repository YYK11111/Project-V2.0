import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, In, Repository } from "typeorm";
import {
  ProjectChange,
  ChangeStatus,
  changeImpactMap,
  changeTypeMap,
} from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { CreateChangeDto } from "./dto";
import { SysFileService } from "src/modules/sys/file/service";
import { SaveDto } from "src/common/dto";
import { User } from "src/modules/users/entities/user.entity";
import { Article, Status as ArticleStatus } from "../articles/entity";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { KnowledgeType, VisibilityType } from "../articles/constants";
import { ProjectsService } from "../projects/service";
import { ChangeImpactConfirmHistory } from "./entities/change-impact-confirm-history.entity";
import { Task } from "../tasks/entity";
import { Milestone } from "../milestones/entity";
import { Sprint } from "../sprints/entity";
import { getProjectScopedPermissions } from "src/common/utils/business-list-permission";

@Injectable()
export class ChangesService extends BaseService<
  ProjectChange,
  CreateChangeDto
> {
  constructor(
    @InjectRepository(ProjectChange) repository: Repository<ProjectChange>,
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    @InjectRepository(ChangeImpactConfirmHistory)
    private historyRepository: Repository<ChangeImpactConfirmHistory>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Milestone)
    private milestoneRepository: Repository<Milestone>,
    @InjectRepository(Sprint)
    private sprintRepository: Repository<Sprint>,
    private readonly sysFileService: SysFileService,
    private readonly projectsService: ProjectsService,
  ) {
    super(ProjectChange, repository);
  }

  private async getChangePermissions(
    change: ProjectChange,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) return { canEdit: false, canDelete: false };
    const operatorPermissions = getProjectScopedPermissions(
      permissions,
      "business/changes/manageAll",
    );
    const context = await this.projectsService.getProjectPermissionContext(
      change.projectId,
      operatorId,
      operatorPermissions,
    );
    const canEdit =
      Boolean(context?.isManager) ||
      Boolean(context?.isDeliveryManager) ||
      Boolean(context?.isFunctionalLead) ||
      String(change.requesterId || "") === String(operatorId) ||
      String(change.createUser || "") === String(operatorId);
    return {
      canEdit,
      canDelete:
        Boolean(context?.isManager) ||
        Boolean(context?.isDeliveryManager) ||
        String(change.requesterId || "") === String(operatorId) ||
        String(change.createUser || "") === String(operatorId),
    };
  }

  private async assertChangeEditPermission(
    changeId: string,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!changeId || !operatorId) return;
    const operatorPermissions = getProjectScopedPermissions(
      permissions,
      "business/changes/manageAll",
    );
    const change = await this.repository.findOne({
      where: { id: changeId, isDelete: null as any } as any,
      select: ["id", "projectId", "requesterId", "createUser"] as any,
    });
    if (!change) throw new NotFoundException("变更不存在");
    const context = await this.projectsService.assertProjectPermission(
      change.projectId,
      operatorId,
      "view",
      operatorPermissions,
    );
    const canEdit =
      context.isManager ||
      context.isDeliveryManager ||
      context.isFunctionalLead ||
      String(change.requesterId || "") === String(operatorId) ||
      String(change.createUser || "") === String(operatorId);
    if (!canEdit) {
      throw new ForbiddenException("当前无编辑该变更的权限");
    }
  }

  private isPersonalReadableChange(change: ProjectChange, operatorId: string) {
    if (!operatorId) return false;
    const normalizedOperatorId = String(operatorId);
    return (
      String(change.requesterId || "") === normalizedOperatorId ||
      String(change.createUser || "") === normalizedOperatorId
    );
  }

  private async assertChangeReadPermission(
    change: ProjectChange,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) return;
    try {
      await this.projectsService.assertExecutionObjectPermission(
        change.projectId,
        operatorId,
        permissions,
      );
    } catch (error) {
      if (this.isPersonalReadableChange(change, operatorId)) return;
      throw error;
    }
  }

  private normalizeChangePayload(
    dto: SaveDto<CreateChangeDto> & { attachments?: string[] },
  ) {
    if (typeof dto.attachments === "string" && !dto.attachments) {
      dto.attachments = [] as any;
    }
    if (dto.attachments != null && !Array.isArray(dto.attachments)) {
      dto.attachments = [dto.attachments].filter(Boolean) as any;
    }
    return dto;
  }

  async list(query: QueryListDto): Promise<ResponseListDto<ProjectChange>> {
    let {
      projectId,
      status,
      type,
      name,
      knowledgeLinked,
      _operatorId,
      _operatorPermissions,
    } = query as any;
    const operatorPermissions = getProjectScopedPermissions(
      Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
      "business/changes/manageAll",
    );
    const visibleProjectIds =
      await this.projectsService.getVisibleProjectIdsForUser(
        String(_operatorId || ""),
        operatorPermissions,
      );
    const shouldUsePersonalChangeScope =
      Boolean(_operatorId) &&
      Array.isArray(visibleProjectIds) &&
      !visibleProjectIds.length;
    if (
      visibleProjectIds &&
      !visibleProjectIds.length &&
      !shouldUsePersonalChangeScope
    ) {
      return { list: [], total: 0 } as any;
    }
    let executionVisibleProjectIds = visibleProjectIds;
    if (_operatorId && visibleProjectIds && !shouldUsePersonalChangeScope) {
      executionVisibleProjectIds = [];
      for (const id of visibleProjectIds) {
        try {
          await this.projectsService.assertExecutionObjectPermission(
            id,
            String(_operatorId),
            operatorPermissions,
          );
          executionVisibleProjectIds.push(id);
        } catch {}
      }
      if (!executionVisibleProjectIds.length) {
        return { list: [], total: 0 } as any;
      }
    }
    let queryOrm: FindManyOptions = {
      where: shouldUsePersonalChangeScope
        ? [
            {
              title: this.sqlLike(name),
              projectId: projectId || undefined,
              status: status || undefined,
              type: type || undefined,
              knowledgeLinked:
                knowledgeLinked !== undefined && knowledgeLinked !== ""
                  ? knowledgeLinked
                  : undefined,
              requesterId: String(_operatorId),
            },
            {
              title: this.sqlLike(name),
              projectId: projectId || undefined,
              status: status || undefined,
              type: type || undefined,
              knowledgeLinked:
                knowledgeLinked !== undefined && knowledgeLinked !== ""
                  ? knowledgeLinked
                  : undefined,
              createUser: String(_operatorId),
            },
          ]
        : {
            title: this.sqlLike(name),
            projectId:
              projectId ||
              (executionVisibleProjectIds
                ? In(executionVisibleProjectIds)
                : undefined),
            status: status || undefined,
            type: type || undefined,
            knowledgeLinked:
              knowledgeLinked !== undefined && knowledgeLinked !== ""
                ? knowledgeLinked
                : undefined,
          },
      relations: ["project", "requester", "approver"],
      order: { sort: "ASC", createTime: "DESC" },
    };
    const res = await this.listBy(queryOrm, query);
    for (const row of res.list || []) {
      if (_operatorId) {
        Object.assign(
          row,
          await this.getChangePermissions(
            row,
            String(_operatorId),
            operatorPermissions,
          ),
        );
      }
    }
    return res;
  }

  async approve(
    id: string,
    approverId: string,
    comment: string,
    permissions: string[] = [],
  ): Promise<any> {
    await this.assertChangeApprovalPermission(id, approverId, permissions);
    return this.repository.update(id, {
      status: ChangeStatus.approved,
      approverId,
      approvalComment: comment,
      approvalDate: new Date().toISOString().split("T")[0],
    });
  }

  async reject(
    id: string,
    approverId: string,
    comment: string,
    permissions: string[] = [],
  ): Promise<any> {
    await this.assertChangeApprovalPermission(id, approverId, permissions);
    return this.repository.update(id, {
      status: ChangeStatus.rejected,
      approverId,
      approvalComment: comment,
      approvalDate: new Date().toISOString().split("T")[0],
    });
  }

  private async assertChangeApprovalPermission(
    changeId: string,
    approverId: string,
    permissions: string[] = [],
  ) {
    const change = await this.repository.findOne({
      where: { id: changeId, isDelete: null as any } as any,
      select: ["id", "projectId", "status"] as any,
    });
    if (!change) throw new NotFoundException("变更不存在");
    if (change.status !== ChangeStatus.pending) {
      throw new BadRequestException("只有待审批状态的变更才能审批");
    }
    const context = await this.projectsService.assertProjectPermission(
      change.projectId,
      approverId,
      "view",
      permissions,
    );
    const canApprove =
      context.isManager || context.isDeliveryManager || context.canManageAll;
    if (!canApprove) {
      throw new ForbiddenException("当前无审批该变更的权限");
    }
    return change;
  }

  async confirmPlanImpact(
    id: string,
    userId: string,
    remark?: string,
    operatorName?: string,
  ): Promise<any> {
    await this.repository.update(id, {
      planImpactConfirmed: "1",
      planImpactConfirmedAt: new Date().toISOString().split("T")[0],
      planImpactConfirmedBy: userId,
      planImpactConfirmRemark: remark || null,
    });
    await this.historyRepository.save(
      new ChangeImpactConfirmHistory({
        changeId: id,
        scope: "overall",
        action: "confirm",
        operatorId: userId,
        operatorName,
        remark: remark || null,
        confirmedAt: new Date().toISOString().split("T")[0],
      }),
    );
    return true;
  }

  async confirmPlanImpactScope(
    id: string,
    scope: "milestone" | "sprint" | "task",
    userId: string,
    remark?: string,
    operatorName?: string,
  ): Promise<any> {
    const fieldMap = {
      milestone: {
        flag: "milestoneImpactConfirmed",
        at: "milestoneImpactConfirmedAt",
        by: "milestoneImpactConfirmedBy",
        remark: "milestoneImpactConfirmRemark",
      },
      sprint: {
        flag: "sprintImpactConfirmed",
        at: "sprintImpactConfirmedAt",
        by: "sprintImpactConfirmedBy",
        remark: "sprintImpactConfirmRemark",
      },
      task: {
        flag: "taskImpactConfirmed",
        at: "taskImpactConfirmedAt",
        by: "taskImpactConfirmedBy",
        remark: "taskImpactConfirmRemark",
      },
    };
    const field = fieldMap[scope];
    if (!field) throw new Error("不支持的确认范围");
    await this.repository.update(id, {
      [field.flag]: "1",
      [field.at]: new Date().toISOString().split("T")[0],
      [field.by]: userId,
      [field.remark]: remark || null,
    } as any);
    await this.historyRepository.save(
      new ChangeImpactConfirmHistory({
        changeId: id,
        scope,
        action: "confirm",
        operatorId: userId,
        operatorName,
        targetId: null,
        targetName: null,
        remark: remark || null,
        confirmedAt: new Date().toISOString().split("T")[0],
      }),
    );
    return true;
  }

  async confirmPlanImpactTarget(
    id: string,
    scope: "milestone" | "sprint" | "task",
    targetId: string,
    targetName: string,
    userId: string,
    remark?: string,
    operatorName?: string,
  ) {
    await this.historyRepository.save(
      new ChangeImpactConfirmHistory({
        changeId: id,
        scope,
        action: "confirm",
        operatorId: userId,
        operatorName,
        targetId,
        targetName,
        remark: remark || null,
        confirmedAt: new Date().toISOString().split("T")[0],
      }),
    );
    return true;
  }

  async applyPlanImpactTarget(
    id: string,
    scope: "task" | "milestone" | "sprint",
    targetId: string,
    payload: {
      plannedStartDate?: string;
      plannedEndDate?: string;
      dueDate?: string;
      endDate?: string;
    },
    userId: string,
    remark?: string,
    operatorName?: string,
  ) {
    if (!targetId) {
      throw new BadRequestException("请选择要应用的任务");
    }
    if (scope === "task") {
      await this.taskRepository.update(targetId, {
        plannedStartDate: payload.plannedStartDate || null,
        plannedEndDate: payload.plannedEndDate || null,
      } as any);
    } else if (scope === "milestone") {
      await this.milestoneRepository.update(targetId, {
        dueDate: payload.dueDate || null,
        changeImpactFlag: "1",
      } as any);
    } else if (scope === "sprint") {
      await this.sprintRepository.update(targetId, {
        endDate: payload.endDate || null,
        changeImpactFlag: "1",
      } as any);
    } else {
      throw new BadRequestException("不支持的计划应用范围");
    }
    await this.historyRepository.save(
      new ChangeImpactConfirmHistory({
        changeId: id,
        scope,
        action: "apply",
        operatorId: userId,
        operatorName,
        targetId,
        targetName: targetId,
        remark: remark || null,
        confirmedAt: new Date().toISOString().split("T")[0],
      }),
    );
    return true;
  }

  async save(dto: SaveDto<CreateChangeDto> & { attachments?: string[] }) {
    await this.projectsService.assertProjectNotArchived(
      String(dto.projectId || ""),
    );
    if (dto.id && dto._operatorId) {
      await this.assertChangeEditPermission(
        String(dto.id),
        String(dto._operatorId),
        Array.isArray((dto as any)._operatorPermissions)
          ? (dto as any)._operatorPermissions
          : [],
      );
    }
    this.normalizeChangePayload(dto);
    const attachments = dto.attachments;
    delete dto.attachments;

    const result = await super.save(dto as any);

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result;
      const fileIds = await this.getFileIdsByPaths(attachments);
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: "change",
          businessId: saved.id,
          fileIds,
        });
      } else if (attachments.length === 0 && saved.id) {
        await this.sysFileService.associateFiles({
          businessType: "change",
          businessId: saved.id,
          fileIds: [],
        });
      }
    }

    return result;
  }

  async add(dto: SaveDto<CreateChangeDto> & { attachments?: string[] }) {
    await this.projectsService.assertProjectNotArchived(
      String(dto.projectId || ""),
    );
    this.normalizeChangePayload(dto);
    const attachments = dto.attachments;
    delete dto.attachments;

    const result = await super.add(dto as any);

    if (attachments !== undefined && attachments.length > 0) {
      const saved = Array.isArray(result) ? result[0] : result;
      const fileIds = await this.getFileIdsByPaths(attachments);
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: "change",
          businessId: saved.id,
          fileIds,
        });
      }
    }

    return result;
  }

  async update(dto: SaveDto<CreateChangeDto> & { attachments?: string[] }) {
    await this.projectsService.assertProjectNotArchived(
      String(dto.projectId || ""),
    );
    if (dto.id && dto._operatorId) {
      await this.assertChangeEditPermission(
        String(dto.id),
        String(dto._operatorId),
        Array.isArray((dto as any)._operatorPermissions)
          ? (dto as any)._operatorPermissions
          : [],
      );
    }
    this.normalizeChangePayload(dto);
    const attachments = dto.attachments;
    delete dto.attachments;

    const result = await super.update(dto as any);

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result;
      const fileIds = await this.getFileIdsByPaths(attachments);
      await this.sysFileService.associateFiles({
        businessType: "change",
        businessId: saved.id,
        fileIds,
      });
    }

    return result;
  }

  private async getFileIdsByPaths(paths: string[]): Promise<string[]> {
    if (!paths || paths.length === 0) return [];
    const files = await this.sysFileService["repository"].find({
      where: { storedPath: In(paths) },
      select: ["id"],
    });
    return files.map((f) => f.id);
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

  private buildChangeDetail(change: ProjectChange) {
    return {
      ...change,
      project: this.mapProjectSummary(change.project),
      requester: this.mapUserSummary(change.requester),
      approver: this.mapUserSummary(change.approver),
      planImpactConfirmInfo:
        String(change.planImpactConfirmed || "0") === "1"
          ? {
              confirmed: true,
              confirmedAt: change.planImpactConfirmedAt,
              confirmedBy: change.planImpactConfirmedBy,
              remark: change.planImpactConfirmRemark,
            }
          : null,
      planImpactScopes: {
        milestone: {
          confirmed: String(change.milestoneImpactConfirmed || "0") === "1",
          confirmedAt: change.milestoneImpactConfirmedAt,
          confirmedBy: change.milestoneImpactConfirmedBy,
          remark: change.milestoneImpactConfirmRemark,
        },
        sprint: {
          confirmed: String(change.sprintImpactConfirmed || "0") === "1",
          confirmedAt: change.sprintImpactConfirmedAt,
          confirmedBy: change.sprintImpactConfirmedBy,
          remark: change.sprintImpactConfirmRemark,
        },
        task: {
          confirmed: String(change.taskImpactConfirmed || "0") === "1",
          confirmedAt: change.taskImpactConfirmedAt,
          confirmedBy: change.taskImpactConfirmedBy,
          remark: change.taskImpactConfirmRemark,
        },
      },
    };
  }

  async getOne(query, isError = true): Promise<any | null> {
    const change = await super.getOne(
      {
        where: query,
        relations: ["project", "requester", "approver"],
      },
      isError,
    );
    if (!change) return change;
    const operatorPermissions = getProjectScopedPermissions(
      Array.isArray((query as any)._operatorPermissions)
        ? (query as any)._operatorPermissions
        : [],
      "business/changes/manageAll",
    );
    if ((query as any)._operatorId) {
      await this.assertChangeReadPermission(
        change,
        String((query as any)._operatorId),
        operatorPermissions,
      );
    }
    const history = await this.historyRepository.find({
      where: { changeId: change.id, isDelete: null as any } as any,
      order: { createTime: "DESC" },
      take: 20,
    });
    const detail = {
      ...this.buildChangeDetail(change),
      confirmHistory: history,
    };
    if ((query as any)._operatorId) {
      Object.assign(
        detail,
        await this.getChangePermissions(
          change,
          String((query as any)._operatorId),
          operatorPermissions,
        ),
      );
    }
    return detail;
  }

  async publishToKnowledge(
    id: string,
    currentUser: { id?: string; name?: string } = {},
  ) {
    const change = await this.getOne({ id });
    if (!change) throw new Error("变更不存在");
    if (!change.projectId) {
      throw new Error("仅支持将已关联项目的变更沉淀到知识中心");
    }

    const reviewCatalog = await this.projectsService.getKnowledgeChildCatalog(
      change.projectId,
      "项目复盘",
    );
    if (!reviewCatalog) {
      throw new Error("当前项目尚未生成“项目复盘”知识分类");
    }

    const title = `${change.title}-变更结论`;
    const existing = await this.articleRepository.findOne({
      where: {
        catalogId: reviewCatalog.id,
        title,
        isDelete: null as any,
      } as any,
      order: { createTime: "DESC" },
    });

    const content = [
      "## 变更背景",
      change.description || "暂无",
      "",
      "## 变更原因",
      change.reason || "暂无",
      "",
      "## 变更类型与影响",
      `${changeTypeMap[change.type] || "-"} / ${changeImpactMap[change.impact] || "-"}`,
      `\n成本影响：${change.costImpact || 0}`,
      `\n进度影响：${change.scheduleImpact || 0} 天`,
      "",
      "## 影响分析",
      change.impactAnalysis || "暂无",
      "",
      "## 审批结论",
      `审批状态：${change.status || "-"}\n审批意见：${change.approvalComment || "暂无"}\n审批日期：${change.approvalDate || "-"}`,
    ].join("\n");

    const operatorId = String(currentUser.id || change.requesterId || "");
    const operatorName = String(currentUser.name || "系统");
    const article = await this.articleRepository.save(
      new Article({
        id: existing?.id,
        title,
        desc:
          change.description ||
          change.impactAnalysis ||
          change.approvalComment ||
          "",
        summary: String(
          change.description ||
            change.impactAnalysis ||
            change.approvalComment ||
            "",
        ).slice(0, 200),
        catalogId: reviewCatalog.id,
        catalog: Object.assign(new ArticleCatalog(), { id: reviewCatalog.id }),
        thumb: existing?.thumb || "",
        content,
        contentText: content,
        knowledgeType: KnowledgeType.experience,
        sourceType: "change",
        sourceId: String(change.id || ""),
        sourceProjectId: String(change.projectId || ""),
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

    await this.repository.update(change.id, {
      knowledgeLinked: "1",
      knowledgeArticleId: String(article.id),
    } as any);

    return {
      articleId: article.id,
      catalogId: reviewCatalog.id,
      title: article.title,
    };
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
          await this.assertChangeEditPermission(id, operatorId, permissions);
          successIds.push(id);
        } catch (error) {
          failed.push({
            id,
            reason: error?.message || "当前无删除该变更的权限",
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
}
