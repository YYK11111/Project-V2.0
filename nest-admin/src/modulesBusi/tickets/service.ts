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
import { Article, Status as ArticleStatus } from "../articles/entity";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { KnowledgeType, VisibilityType } from "../articles/constants";

@Injectable()
export class TicketsService extends BaseService<Ticket, TicketDto> {
  constructor(
    @InjectRepository(Ticket) repository: Repository<Ticket>,
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    private readonly sysFileService: SysFileService,
    private readonly projectsService: ProjectsService,
  ) {
    super(Ticket, repository);
  }

  private async getTicketPermissions(ticket: Ticket, operatorId: string) {
    if (!operatorId) return { canEdit: false, canDelete: false };
    const context = await this.projectsService.getProjectPermissionContext(
      ticket.projectId,
      operatorId,
    );
    const canEdit =
      Boolean(context?.isManager) ||
      Boolean(context?.isDeliveryManager) ||
      Boolean(context?.isFunctionalLead) ||
      String(ticket.handlerId || "") === String(operatorId) ||
      String(ticket.submitterId || "") === String(operatorId) ||
      String(ticket.createUser || "") === String(operatorId);
    return {
      canEdit,
      canDelete:
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
  ) {
    if (!ticketId || !operatorId) return;
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
    );
    const canEdit =
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
    for (const row of res.list || []) {
      if (_operatorId) {
        Object.assign(
          row,
          await this.getTicketPermissions(row, String(_operatorId)),
        );
      }
    }
    return res;
  }

  async save(dto: SaveDto<TicketDto> & { attachments?: string[] }) {
    await this.projectsService.assertProjectNotArchived(String(dto.projectId || ""));
    if (dto.id && dto._operatorId) {
      await this.assertTicketEditPermission(
        String(dto.id),
        String(dto._operatorId),
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
    await this.projectsService.assertProjectNotArchived(String(dto.projectId || ""));
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
    await this.projectsService.assertProjectNotArchived(String(dto.projectId || ""));
    if (dto.id && dto._operatorId) {
      await this.assertTicketEditPermission(
        String(dto.id),
        String(dto._operatorId),
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
    if ((query as any)._operatorId) {
      await this.projectsService.assertExecutionObjectPermission(
        ticket.projectId,
        String((query as any)._operatorId),
      );
    }
    const detail = this.buildTicketDetail(ticket);
    if ((query as any)._operatorId) {
      Object.assign(
        detail,
        await this.getTicketPermissions(
          ticket,
          String((query as any)._operatorId),
        ),
      );
    }
    return detail;
  }

  async publishToKnowledge(
    id: string,
    currentUser: { id?: string; name?: string } = {},
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
          await this.assertTicketEditPermission(id, operatorId);
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
}
