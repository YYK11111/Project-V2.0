import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, In, Like, Repository } from "typeorm";
import { Ticket, TicketType, TicketStatus } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { TicketDto } from "./dto";
import { SysFileService } from "src/modules/sys/file/service";
import { SaveDto } from "src/common/dto";
import { User } from "src/modules/users/entities/user.entity";
import { ProjectsService } from "../projects/service";
import { TasksService } from "../tasks/service";
import { Article, Status as ArticleStatus } from "../articles/entity";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { KnowledgeType, VisibilityType } from "../articles/constants";
import { Task } from "../tasks/entity";
import { getProjectScopedPermissions } from "src/common/utils/business-list-permission";
import { getListRows } from "src/common/utils/project-operation-permission";

@Injectable()
export class TicketsService extends BaseService<Ticket, TicketDto> {
  constructor(
    @InjectRepository(Ticket) repository: Repository<Ticket>,
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    private readonly sysFileService: SysFileService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {
    super(Ticket, repository);
  }

  private async getTicketPermissions(
    ticket: Ticket,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) return { canEdit: false, canDelete: false };
    const operatorPermissions = getProjectScopedPermissions(
      permissions,
      "business/tickets/manageAll",
    );
    const context = await this.projectsService.getProjectPermissionContext(
      ticket.projectId,
      operatorId,
      operatorPermissions,
    );
    const canEdit =
      Boolean(context?.canManageTasks) ||
      Boolean(context?.isManager) ||
      Boolean(context?.isDeliveryManager) ||
      Boolean(context?.isFunctionalLead) ||
      String(ticket.handlerId || "") === String(operatorId) ||
      String(ticket.submitterId || "") === String(operatorId) ||
      String(ticket.createUser || "") === String(operatorId);
    return {
      canEdit,
      canDelete:
        Boolean(context?.canManageTasks) ||
        Boolean(context?.isManager) ||
        Boolean(context?.isDeliveryManager) ||
        String(ticket.handlerId || "") === String(operatorId) ||
        String(ticket.submitterId || "") === String(operatorId) ||
        String(ticket.createUser || "") === String(operatorId),
    };
  }

  private async assertTicketEditPermission(
    ticketId: string,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!ticketId || !operatorId) return;
    const operatorPermissions = getProjectScopedPermissions(
      permissions,
      "business/tickets/manageAll",
    );
    const ticket = await this.repository.findOne({
      where: { id: ticketId, isDelete: null as any } as any,
      select: [
        "id",
        "projectId",
        "submitterId",
        "handlerId",
        "createUser",
      ] as any,
    });
    if (!ticket) throw new NotFoundException("工单不存在");
    const context = await this.projectsService.assertProjectPermission(
      ticket.projectId,
      operatorId,
      "view",
      operatorPermissions,
    );
    const canEdit =
      context.canManageTasks ||
      context.isManager ||
      context.isDeliveryManager ||
      context.isFunctionalLead ||
      String(ticket.handlerId || "") === String(operatorId) ||
      String(ticket.submitterId || "") === String(operatorId) ||
      String(ticket.createUser || "") === String(operatorId);
    if (!canEdit) {
      throw new ForbiddenException("当前无编辑该工单的权限");
    }
  }

  private isPersonalReadableTicket(ticket: Ticket, operatorId: string) {
    if (!operatorId) return false;
    const normalizedOperatorId = String(operatorId);
    return (
      String(ticket.handlerId || "") === normalizedOperatorId ||
      String(ticket.submitterId || "") === normalizedOperatorId ||
      String(ticket.createUser || "") === normalizedOperatorId
    );
  }

  private async assertTicketReadPermission(
    ticket: Ticket,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) return;
    try {
      await this.projectsService.assertExecutionObjectPermission(
        ticket.projectId,
        operatorId,
        permissions,
      );
    } catch (error) {
      if (this.isPersonalReadableTicket(ticket, operatorId)) return;
      throw error;
    }
  }

  private normalizeTicketPayload(
    dto: SaveDto<TicketDto> & { attachments?: string[] },
  ) {
    if (typeof dto.attachments === "string" && !dto.attachments) {
      dto.attachments = [] as any;
    }
    if (dto.attachments != null && !Array.isArray(dto.attachments)) {
      dto.attachments = [dto.attachments].filter(Boolean) as any;
    }
    return dto;
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Ticket>> {
    let {
      title,
      type,
      status,
      projectId,
      taskId,
      knowledgeLinked,
      _operatorId,
      _operatorPermissions,
    } = query as any;
    const operatorPermissions = getProjectScopedPermissions(
      Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
      "business/tickets/manageAll",
    );
    const visibleProjectIds =
      await this.projectsService.getVisibleProjectIdsForUser(
        String(_operatorId || ""),
        operatorPermissions,
      );
    const shouldUsePersonalTicketScope =
      Boolean(_operatorId) &&
      Array.isArray(visibleProjectIds) &&
      !visibleProjectIds.length;
    if (
      visibleProjectIds &&
      !visibleProjectIds.length &&
      !shouldUsePersonalTicketScope
    ) {
      return { list: [], total: 0 } as any;
    }
    let executionVisibleProjectIds = visibleProjectIds;
    if (_operatorId && visibleProjectIds && !shouldUsePersonalTicketScope) {
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
      where: shouldUsePersonalTicketScope
        ? [
            {
              title: this.sqlLike(title),
              type,
              status,
              projectId: projectId || undefined,
              taskId,
              knowledgeLinked:
                knowledgeLinked !== undefined && knowledgeLinked !== ""
                  ? knowledgeLinked
                  : undefined,
              handlerId: String(_operatorId),
            },
            {
              title: this.sqlLike(title),
              type,
              status,
              projectId: projectId || undefined,
              taskId,
              knowledgeLinked:
                knowledgeLinked !== undefined && knowledgeLinked !== ""
                  ? knowledgeLinked
                  : undefined,
              submitterId: String(_operatorId),
            },
            {
              title: this.sqlLike(title),
              type,
              status,
              projectId: projectId || undefined,
              taskId,
              knowledgeLinked:
                knowledgeLinked !== undefined && knowledgeLinked !== ""
                  ? knowledgeLinked
                  : undefined,
              createUser: String(_operatorId),
            },
          ]
        : {
            title: this.sqlLike(title),
            type,
            status,
            projectId:
              projectId ||
              (executionVisibleProjectIds
                ? In(executionVisibleProjectIds)
                : undefined),
            taskId,
            knowledgeLinked:
              knowledgeLinked !== undefined && knowledgeLinked !== ""
                ? knowledgeLinked
                : undefined,
          },
      relations: ["submitter", "handler", "project", "task"],
    };
    const res = await this.listBy(queryOrm, query);
    for (const row of getListRows(res)) {
      if (_operatorId) {
        Object.assign(
          row,
          await this.getTicketPermissions(
            row,
            String(_operatorId),
            operatorPermissions,
          ),
        );
      }
    }
    return res;
  }

  async save(dto: SaveDto<TicketDto> & { attachments?: string[] }) {
    await this.projectsService.assertProjectNotArchived(
      String(dto.projectId || ""),
    );
    if (dto.id && dto._operatorId) {
      await this.assertTicketEditPermission(
        String(dto.id),
        String(dto._operatorId),
        Array.isArray((dto as any)._operatorPermissions)
          ? (dto as any)._operatorPermissions
          : [],
      );
    }
    this.normalizeTicketPayload(dto);
    const attachments = dto.attachments;
    delete dto.attachments;

    const result = await super.save(dto);

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result;
      const fileIds = await this.getFileIdsByPaths(attachments);
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: "ticket",
          businessId: saved.id,
          fileIds,
        });
      } else if (attachments.length === 0 && saved.id) {
        await this.sysFileService.associateFiles({
          businessType: "ticket",
          businessId: saved.id,
          fileIds: [],
        });
      }
    }

    return result;
  }

  async add(dto: SaveDto<TicketDto> & { attachments?: string[] }) {
    await this.projectsService.assertProjectNotArchived(
      String(dto.projectId || ""),
    );
    this.normalizeTicketPayload(dto);
    const attachments = dto.attachments;
    delete dto.attachments;

    const result = await super.add(dto);

    if (attachments !== undefined && attachments.length > 0) {
      const saved = Array.isArray(result) ? result[0] : result;
      const fileIds = await this.getFileIdsByPaths(attachments);
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: "ticket",
          businessId: saved.id,
          fileIds,
        });
      }
    }

    return result;
  }

  async update(dto: SaveDto<TicketDto> & { attachments?: string[] }) {
    await this.projectsService.assertProjectNotArchived(
      String(dto.projectId || ""),
    );
    if (dto.id && dto._operatorId) {
      await this.assertTicketEditPermission(
        String(dto.id),
        String(dto._operatorId),
        Array.isArray((dto as any)._operatorPermissions)
          ? (dto as any)._operatorPermissions
          : [],
      );
    }
    this.normalizeTicketPayload(dto);
    const attachments = dto.attachments;
    delete dto.attachments;

    const result = await super.update(dto);

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result;
      const fileIds = await this.getFileIdsByPaths(attachments);
      await this.sysFileService.associateFiles({
        businessType: "ticket",
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

  private mapTaskSummary(task?: any) {
    if (!task) return null;
    return {
      id: task.id,
      code: task.code,
      name: task.name,
    };
  }

  private buildTicketDetail(ticket: Ticket) {
    return {
      ...ticket,
      project: this.mapProjectSummary(ticket.project),
      task: this.mapTaskSummary(ticket.task),
      submitter: this.mapUserSummary(ticket.submitter),
      handler: this.mapUserSummary(ticket.handler),
    };
  }

  async getOne(query, isError = true): Promise<any | null> {
    const ticket = await super.getOne(
      {
        where: query,
        relations: ["project", "task", "submitter", "handler"],
      },
      isError,
    );
    if (!ticket) return ticket;
    const operatorPermissions = getProjectScopedPermissions(
      Array.isArray((query as any)._operatorPermissions)
        ? (query as any)._operatorPermissions
        : [],
      "business/tickets/manageAll",
    );
    if ((query as any)._operatorId) {
      await this.assertTicketReadPermission(
        ticket,
        String((query as any)._operatorId),
        operatorPermissions,
      );
    }
    const detail: any = this.buildTicketDetail(ticket);
    if (ticket.linkedTaskId) {
      detail.linkedTask = await this.repository.manager.findOne(Task as any, {
        where: { id: ticket.linkedTaskId } as any,
        select: ["id", "code", "name"] as any,
      });
    }
    if ((query as any)._operatorId) {
      Object.assign(
        detail,
        await this.getTicketPermissions(
          ticket,
          String((query as any)._operatorId),
          operatorPermissions,
        ),
      );
    }
    return detail;
  }

  async publishToKnowledge(
    id: string,
    currentUser: { id?: string; name?: string; permissions?: string[] } = {},
  ) {
    const ticket = await this.getOne({ id });
    if (!ticket) throw new Error("工单不存在");
    if (!ticket.projectId) {
      throw new Error("仅支持将已关联项目的工单沉淀到知识中心");
    }

    await this.projectsService.ensureKnowledgeSpaceWhenProjectExecuting(
      ticket.projectId,
    );
    const project = await this.projectsService.getOne({ id: ticket.projectId });
    if (!project?.knowledgeCatalogId) {
      throw new Error("当前工单所属项目尚未生成项目知识空间");
    }

    const faqCatalog = await this.projectsService.getKnowledgeChildCatalog(
      ticket.projectId,
      "运维支持",
    );
    if (!faqCatalog) {
      throw new Error("当前项目尚未生成“运维支持”知识分类");
    }

    const title = `${ticket.title}-工单沉淀`;
    const existing = await this.articleRepository.findOne({
      where: {
        catalogId: faqCatalog.id,
        title,
        isDelete: null as any,
      } as any,
      order: { createTime: "DESC" },
    });

    const content = [
      "## 工单背景",
      ticket.content || "暂无",
      "",
      "## 重现步骤",
      ticket.stepsToReproduce || "暂无",
      "",
      "## 期望结果",
      ticket.expectedResult || "暂无",
      "",
      "## 实际结果",
      ticket.actualResult || "暂无",
      "",
      "## 根因分析",
      ticket.rootCause || "暂无",
      "",
      "## 解决方案",
      ticket.solution || ticket.resolution || "暂无",
    ].join("\n");

    const operatorId = String(
      currentUser.id || ticket.handlerId || ticket.submitterId || "",
    );
    const operatorName = String(currentUser.name || "系统");
    const article = await this.articleRepository.save(
      new Article({
        id: existing?.id,
        title,
        desc: ticket.content || ticket.solution || ticket.resolution || "",
        summary: String(
          ticket.content || ticket.solution || ticket.resolution || "",
        ).slice(0, 200),
        catalogId: faqCatalog.id,
        catalog: Object.assign(new ArticleCatalog(), { id: faqCatalog.id }),
        thumb: existing?.thumb || "",
        content,
        contentText: content,
        knowledgeType: KnowledgeType.faq,
        sourceType: "ticket",
        sourceId: String(ticket.id || ""),
        sourceProjectId: String(ticket.projectId || ""),
        templateType: "faq",
        authorId: operatorId || null,
        maintainerId: operatorId || null,
        visibilityType: VisibilityType.specified,
        visibleRoleIds: [],
        visibleUserIds: faqCatalog.defaultVisibleUserIds || [],
        order: existing?.order || "1",
        status: ArticleStatus.published,
        createUser: operatorName,
        updateUser: operatorName,
      }),
    );

    await this.repository.update(ticket.id, {
      knowledgeLinked: "1",
      knowledgeArticleId: String(article.id),
    } as any);

    return {
      articleId: article.id,
      catalogId: faqCatalog.id,
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
          await this.assertTicketEditPermission(id, operatorId, permissions);
          successIds.push(id);
        } catch (error) {
          failed.push({
            id,
            reason: error?.message || "当前无删除该工单的权限",
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

  async convertToTask(
    id: string,
    currentUser: { id?: string; name?: string; permissions?: string[] } = {},
  ) {
    const ticket = await this.getOne({ id });
    if (!ticket) throw new Error("工单不存在");
    if (!ticket.projectId) throw new Error("未关联项目的工单不能转任务");

    const result = await this.tasksService.add({
      projectId: ticket.projectId,
      name: `工单处理：${ticket.title}`,
      description: [
        ticket.content || "",
        ticket.stepsToReproduce || "",
        ticket.solution || ticket.resolution || "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      leaderId: ticket.handlerId || ticket.submitterId || "",
      sourceType: "ticket",
      sourceId: String(ticket.id || ""),
      createUser: currentUser.name || "system",
      _operatorId: currentUser.id,
      _operatorName: currentUser.name,
      _operatorPermissions: Array.isArray(currentUser.permissions)
        ? currentUser.permissions
        : [],
    } as any);
    const task = Array.isArray(result) ? result[0] : result;
    await this.repository.update(id, {
      linkedTaskId: String(task?.id || ""),
    } as any);
    return {
      taskId: task?.id,
      taskName: task?.name,
    };
  }
}
