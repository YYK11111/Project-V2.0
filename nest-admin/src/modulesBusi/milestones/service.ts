import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, In, Repository } from "typeorm";
import { Milestone, MilestoneStatus } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { SaveDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { CreateMilestoneDto } from "./dto";
import { User } from "src/modules/users/entities/user.entity";
import { Task, TaskStatus } from "../tasks/entity";
import { ProjectExecutionPermissionService } from "../projects/project-execution-permission.service";
import { appendProjectOperationPermissions } from "src/common/utils/project-operation-permission";

@Injectable()
export class MilestonesService extends BaseService<
  Milestone,
  CreateMilestoneDto
> {
  constructor(
    @InjectRepository(Milestone) repository: Repository<Milestone>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    private readonly projectExecutionPermissionService: ProjectExecutionPermissionService,
  ) {
    super(Milestone, repository);
  }

  private async assertMilestoneProjectPermissionById(
    milestoneId: string,
    operatorId?: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) return null;
    const milestone = await this.repository.findOne({
      where: { id: milestoneId, isDelete: null as any } as any,
      select: ["id", "projectId"] as any,
    });
    if (!milestone) throw new Error("数据不存在");
    if (milestone.projectId) {
      await this.projectExecutionPermissionService.assertReadableProject(
        milestone.projectId,
        operatorId,
        permissions,
        "business/milestones/manageAll",
      );
    }
    return milestone;
  }

  private async assertMilestoneProjectPermissionForDto(
    dto: SaveDto<CreateMilestoneDto>,
  ) {
    const operatorId = String(dto._operatorId || "");
    const operatorPermissions = Array.isArray((dto as any)._operatorPermissions)
      ? (dto as any)._operatorPermissions
      : [];
    if (!operatorId) return;
    let oldProjectId = "";
    if (dto.id) {
      const milestone = await this.repository.findOne({
        where: { id: String(dto.id), isDelete: null as any } as any,
        select: ["id", "projectId"] as any,
      });
      if (!milestone) throw new Error("数据不存在");
      oldProjectId = String(milestone.projectId || "");
      if (oldProjectId) {
        await this.projectExecutionPermissionService.assertWritableProject(
          oldProjectId,
          operatorId,
          operatorPermissions,
          "business/milestones/manageAll",
        );
      }
    }
    const nextProjectId = String(dto.projectId || "");
    if (nextProjectId && nextProjectId !== oldProjectId) {
      await this.projectExecutionPermissionService.assertWritableProject(
        nextProjectId,
        operatorId,
        operatorPermissions,
        "business/milestones/manageAll",
      );
    }
  }

  private isPersonalReadableMilestone(
    milestone: Milestone,
    operatorId: string,
  ) {
    if (!operatorId) return false;
    const normalizedOperatorId = String(operatorId);
    return (
      String(milestone.ownerId || "") === normalizedOperatorId ||
      String(milestone.creatorId || "") === normalizedOperatorId ||
      String(milestone.createUser || "") === normalizedOperatorId
    );
  }

  private async assertMilestoneReadPermission(
    milestone: Milestone,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!operatorId || !milestone.projectId) return;
    try {
      await this.projectExecutionPermissionService.assertReadableProject(
        milestone.projectId,
        operatorId,
        permissions,
        "business/milestones/manageAll",
      );
    } catch (error) {
      if (this.isPersonalReadableMilestone(milestone, operatorId)) return;
      throw error;
    }
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Milestone>> {
    let {
      projectId,
      status,
      name,
      ownerId,
      phase,
      changeImpactFlag,
      riskImpactFlag,
      _operatorId,
      _operatorPermissions,
    } = query as QueryListDto & {
      ownerId?: string;
      phase?: string;
      changeImpactFlag?: string;
      riskImpactFlag?: string;
      _operatorId?: string;
      _operatorPermissions?: string[];
    };
    const visibleProjectIds =
      await this.projectExecutionPermissionService.getVisibleProjectIds(
        String(_operatorId || ""),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
        "business/milestones/manageAll",
      );
    const shouldUsePersonalMilestoneScope =
      Boolean(_operatorId) &&
      Array.isArray(visibleProjectIds) &&
      !visibleProjectIds.length;
    if (
      visibleProjectIds &&
      !visibleProjectIds.length &&
      !shouldUsePersonalMilestoneScope
    ) {
      return { data: [], total: 0, _flag: true } as any;
    }
    const explicitProjectId = String(projectId || "");
    if (
      explicitProjectId &&
      visibleProjectIds &&
      !visibleProjectIds.includes(explicitProjectId) &&
      !shouldUsePersonalMilestoneScope
    ) {
      return { data: [], total: 0, _flag: true } as any;
    }
    const projectIdFilter =
      explicitProjectId ||
      (visibleProjectIds ? In(visibleProjectIds) : undefined);
    let queryOrm: FindManyOptions = {
      where: shouldUsePersonalMilestoneScope
        ? [
            {
              name: this.sqlLike(name),
              projectId: explicitProjectId || undefined,
              status: status || undefined,
              ownerId: ownerId || String(_operatorId),
              phase: phase || undefined,
              changeImpactFlag:
                changeImpactFlag !== undefined && changeImpactFlag !== ""
                  ? changeImpactFlag
                  : undefined,
              riskImpactFlag:
                riskImpactFlag !== undefined && riskImpactFlag !== ""
                  ? riskImpactFlag
                  : undefined,
            },
            {
              name: this.sqlLike(name),
              projectId: explicitProjectId || undefined,
              status: status || undefined,
              ownerId: ownerId || undefined,
              creatorId: String(_operatorId),
              phase: phase || undefined,
              changeImpactFlag:
                changeImpactFlag !== undefined && changeImpactFlag !== ""
                  ? changeImpactFlag
                  : undefined,
              riskImpactFlag:
                riskImpactFlag !== undefined && riskImpactFlag !== ""
                  ? riskImpactFlag
                  : undefined,
            },
            {
              name: this.sqlLike(name),
              projectId: explicitProjectId || undefined,
              status: status || undefined,
              ownerId: ownerId || undefined,
              createUser: String(_operatorId),
              phase: phase || undefined,
              changeImpactFlag:
                changeImpactFlag !== undefined && changeImpactFlag !== ""
                  ? changeImpactFlag
                  : undefined,
              riskImpactFlag:
                riskImpactFlag !== undefined && riskImpactFlag !== ""
                  ? riskImpactFlag
                  : undefined,
            },
          ]
        : {
            name: this.sqlLike(name),
            projectId: projectIdFilter,
            status: status || undefined,
            ownerId: ownerId || undefined,
            phase: phase || undefined,
            changeImpactFlag:
              changeImpactFlag !== undefined && changeImpactFlag !== ""
                ? changeImpactFlag
                : undefined,
            riskImpactFlag:
              riskImpactFlag !== undefined && riskImpactFlag !== ""
                ? riskImpactFlag
                : undefined,
          },
      relations: ["project", "creator", "owner"],
      order: { sort: "ASC", createTime: "DESC" },
    };
    const result = await this.listBy(queryOrm, query);
    if (_operatorId) {
      await appendProjectOperationPermissions(
        result,
        this.projectExecutionPermissionService,
        String(_operatorId),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
        "business/milestones/manageAll",
      );
    }
    return result;
  }

  async updateStatus(
    id: string,
    status: MilestoneStatus,
    operatorId?: string,
    permissions: string[] = [],
  ): Promise<any> {
    if (operatorId) {
      const milestone = await this.repository.findOne({
        where: { id, isDelete: null as any } as any,
        select: ["id", "projectId"] as any,
      });
      if (!milestone) throw new Error("数据不存在");
      if (milestone.projectId) {
        await this.projectExecutionPermissionService.assertReadableProject(
          milestone.projectId,
          operatorId,
          permissions,
          "business/milestones/manageAll",
        );
      }
    }
    const updateData: any = { status };
    if (status === MilestoneStatus.completed) {
      updateData.completedDate = new Date().toISOString().split("T")[0];
    }
    return this.repository.update(id, updateData);
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
    const { _operatorId, _operatorPermissions, ...where } = query as any;
    const milestone = await super.getOne(
      {
        where,
        relations: ["project", "creator", "owner"],
      },
      isError,
    );
    if (!milestone) return milestone;
    if (_operatorId) {
      await this.assertMilestoneReadPermission(
        milestone,
        String(_operatorId),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
      );
    }

    const tasks = await this.taskRepository.find({
      where: { milestoneId: milestone.id, isDelete: null as any } as any,
      relations: ["leader"],
      order: { endDate: "ASC", createTime: "ASC" },
    });

    return {
      ...milestone,
      project: this.mapProjectSummary(milestone.project),
      creator: this.mapUserSummary(milestone.creator),
      owner: this.mapUserSummary((milestone as any).owner),
      tasks: tasks.map((task) => ({
        id: task.id,
        name: task.name,
        code: task.code,
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        startDate: task.startDate,
        endDate: task.endDate,
        leader: task.leader
          ? {
              id: task.leader.id,
              name: task.leader.name,
              nickname: task.leader.nickname,
              avatar: task.leader.avatar,
            }
          : null,
      })),
      taskSummary: {
        total: tasks.length,
        completed: tasks.filter((task) => task.status === TaskStatus.completed)
          .length,
        inProgress: tasks.filter(
          (task) => task.status === TaskStatus.inProgress,
        ).length,
        pending: tasks.filter((task) => task.status === TaskStatus.pending)
          .length,
        completionRate:
          tasks.length > 0
            ? Math.round(
                (tasks.filter((task) => task.status === TaskStatus.completed)
                  .length /
                  tasks.length) *
                  100,
              )
            : 0,
      },
    };
  }

  async save(dto: SaveDto<CreateMilestoneDto>) {
    await this.assertMilestoneProjectPermissionForDto(dto);
    return super.save(dto as any);
  }

  async add(dto: SaveDto<CreateMilestoneDto>) {
    await this.assertMilestoneProjectPermissionForDto(dto);
    return super.add(dto as any);
  }

  async update(dto: SaveDto<CreateMilestoneDto>) {
    await this.assertMilestoneProjectPermissionForDto(dto);
    return super.update(dto as any);
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
          await this.assertMilestoneProjectPermissionById(
            id,
            operatorId,
            permissions,
          );
          successIds.push(id);
        } catch (error) {
          failed.push({
            id,
            reason: error?.message || "当前无删除该里程碑的权限",
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
