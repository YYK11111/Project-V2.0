import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, In, Repository } from "typeorm";
import { Sprint, SprintStatus } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { SaveDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { CreateSprintDto } from "./dto";
import { Task, TaskStatus } from "../tasks/entity";
import { User } from "src/modules/users/entities/user.entity";
import { ProjectExecutionPermissionService } from "../projects/project-execution-permission.service";
import { appendProjectOperationPermissions } from "src/common/utils/project-operation-permission";

@Injectable()
export class SprintsService extends BaseService<Sprint, CreateSprintDto> {
  constructor(
    @InjectRepository(Sprint) repository: Repository<Sprint>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    private readonly projectExecutionPermissionService: ProjectExecutionPermissionService,
  ) {
    super(Sprint, repository);
  }

  private async assertSprintProjectPermissionById(
    sprintId: string,
    operatorId?: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) return null;
    const sprint = await this.repository.findOne({
      where: { id: sprintId, isDelete: null as any } as any,
      select: ["id", "projectId"] as any,
    });
    if (!sprint) throw new Error("数据不存在");
    if (sprint.projectId) {
      await this.projectExecutionPermissionService.assertReadableProject(
        sprint.projectId,
        operatorId,
        permissions,
        "business/sprints/manageAll",
      );
    }
    return sprint;
  }

  private async assertSprintProjectPermissionForDto(
    dto: SaveDto<CreateSprintDto>,
  ) {
    const operatorId = String(dto._operatorId || "");
    const operatorPermissions = Array.isArray((dto as any)._operatorPermissions)
      ? (dto as any)._operatorPermissions
      : [];
    if (!operatorId) return;
    let oldProjectId = "";
    if (dto.id) {
      const sprint = await this.repository.findOne({
        where: { id: String(dto.id), isDelete: null as any } as any,
        select: ["id", "projectId"] as any,
      });
      if (!sprint) throw new Error("数据不存在");
      oldProjectId = String(sprint.projectId || "");
      if (oldProjectId) {
        await this.projectExecutionPermissionService.assertWritableProject(
          oldProjectId,
          operatorId,
          operatorPermissions,
          "business/sprints/manageAll",
        );
      }
    }
    const nextProjectId = String(dto.projectId || "");
    if (nextProjectId && nextProjectId !== oldProjectId) {
      await this.projectExecutionPermissionService.assertWritableProject(
        nextProjectId,
        operatorId,
        operatorPermissions,
        "business/sprints/manageAll",
      );
    }
  }

  private isPersonalReadableSprint(sprint: Sprint, operatorId: string) {
    if (!operatorId) return false;
    const normalizedOperatorId = String(operatorId);
    return (
      String(sprint.ownerId || "") === normalizedOperatorId ||
      String(sprint.scrumMasterId || "") === normalizedOperatorId
    );
  }

  private async assertSprintReadPermission(
    sprint: Sprint,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!operatorId || !sprint.projectId) return;
    try {
      await this.projectExecutionPermissionService.assertReadableProject(
        sprint.projectId,
        operatorId,
        permissions,
        "business/sprints/manageAll",
      );
    } catch (error) {
      if (this.isPersonalReadableSprint(sprint, operatorId)) return;
      throw error;
    }
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Sprint>> {
    let {
      projectId,
      status,
      name,
      ownerId,
      changeImpactFlag,
      _operatorId,
      _operatorPermissions,
    } = query as QueryListDto & {
      ownerId?: string;
      changeImpactFlag?: string;
      _operatorId?: string;
      _operatorPermissions?: string[];
    };
    const visibleProjectIds =
      await this.projectExecutionPermissionService.getVisibleProjectIds(
        String(_operatorId || ""),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
        "business/sprints/manageAll",
      );
    const shouldUsePersonalSprintScope =
      Boolean(_operatorId) &&
      Array.isArray(visibleProjectIds) &&
      !visibleProjectIds.length;
    if (
      visibleProjectIds &&
      !visibleProjectIds.length &&
      !shouldUsePersonalSprintScope
    ) {
      return { data: [], total: 0, _flag: true } as any;
    }
    const explicitProjectId = String(projectId || "");
    if (
      explicitProjectId &&
      visibleProjectIds &&
      !visibleProjectIds.includes(explicitProjectId) &&
      !shouldUsePersonalSprintScope
    ) {
      return { data: [], total: 0, _flag: true } as any;
    }
    const projectIdFilter =
      explicitProjectId ||
      (visibleProjectIds ? In(visibleProjectIds) : undefined);
    let queryOrm: FindManyOptions = {
      where: shouldUsePersonalSprintScope
        ? [
            {
              name: this.sqlLike(name),
              projectId: explicitProjectId || undefined,
              status: status || undefined,
              ownerId: ownerId || String(_operatorId),
              changeImpactFlag:
                changeImpactFlag !== undefined && changeImpactFlag !== ""
                  ? changeImpactFlag
                  : undefined,
            },
            {
              name: this.sqlLike(name),
              projectId: explicitProjectId || undefined,
              status: status || undefined,
              ownerId: ownerId || undefined,
              scrumMasterId: String(_operatorId),
              changeImpactFlag:
                changeImpactFlag !== undefined && changeImpactFlag !== ""
                  ? changeImpactFlag
                  : undefined,
            },
          ]
        : {
            name: this.sqlLike(name),
            projectId: projectIdFilter,
            status: status || undefined,
            ownerId: ownerId || undefined,
            changeImpactFlag:
              changeImpactFlag !== undefined && changeImpactFlag !== ""
                ? changeImpactFlag
                : undefined,
          },
      relations: ["project", "scrumMaster", "owner"],
      order: { sort: "ASC", startDate: "DESC" },
    };
    const result = await this.listBy(queryOrm, query);
    if (_operatorId) {
      await appendProjectOperationPermissions(
        result,
        this.projectExecutionPermissionService,
        String(_operatorId),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
        "business/sprints/manageAll",
      );
    }
    return result;
  }

  async getBurndown(sprintId: string): Promise<any> {
    const sprint = await this.getOne({ id: sprintId });
    if (!sprint) {
      throw new Error("Sprint不存在");
    }

    const tasks = await this.taskRepository.find({
      where: { sprintId },
      select: ["id", "storyPoints", "status", "startDate", "endDate"],
    });

    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();

    const days: string[] = [];
    const idealLine: number[] = [];
    const actualLine: number[] = [];

    let currentDate = new Date(startDate);
    let remainingPoints = totalPoints;
    const dailyCompleted: Map<string, number> = new Map();

    for (const task of tasks) {
      if (task.status === "3" && task.endDate) {
        const end = new Date(task.endDate);
        const key = end.toISOString().split("T")[0];
        dailyCompleted.set(
          key,
          (dailyCompleted.get(key) || 0) + (task.storyPoints || 0),
        );
      }
    }

    const totalDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) || 1;
    const pointsPerDay = totalPoints / totalDays;

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      days.push(dateKey);

      const dayIndex = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      idealLine.push(
        Math.max(0, Math.round(totalPoints - pointsPerDay * dayIndex)),
      );

      if (currentDate <= today) {
        const completed = dailyCompleted.get(dateKey) || 0;
        remainingPoints -= completed;
        actualLine.push(Math.max(0, remainingPoints));
      } else {
        actualLine.push(-1);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      sprintName: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      totalPoints,
      days,
      idealLine,
      actualLine: actualLine.map((v) => (v === -1 ? null : v)),
    };
  }

  async getVelocity(projectId: string): Promise<any> {
    const sprints = await this.repository.find({
      where: { projectId, status: SprintStatus.completed },
      order: { endDate: "ASC" },
      select: ["id", "name", "endDate", "completedPoints", "committedPoints"],
    });

    return sprints.map((sprint) => ({
      sprintId: sprint.id,
      sprintName: sprint.name,
      endDate: sprint.endDate,
      committedPoints: sprint.committedPoints,
      completedPoints: sprint.completedPoints,
      velocity: sprint.completedPoints,
    }));
  }

  async startSprint(
    sprintId: string,
    operatorId?: string,
    permissions: string[] = [],
  ): Promise<any> {
    const sprint = await this.getOne({ id: sprintId });
    if (!sprint) {
      throw new Error("Sprint不存在");
    }
    if (operatorId) {
      if (sprint.projectId) {
        await this.projectExecutionPermissionService.assertReadableProject(
          sprint.projectId,
          operatorId,
          permissions,
          "business/sprints/manageAll",
        );
      }
    }

    const tasks = await this.taskRepository.find({
      where: { sprintId },
      select: ["id", "storyPoints"],
    });

    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    await this.repository.update(sprintId, {
      status: SprintStatus.active,
      committedPoints: totalPoints,
    });

    return { success: true, committedPoints: totalPoints };
  }

  async completeSprint(
    sprintId: string,
    options?: { carryOverMode?: "backlog" },
    operatorId?: string,
    permissions: string[] = [],
  ): Promise<any> {
    const sprint = await this.getOne({ id: sprintId });
    if (!sprint) {
      throw new Error("Sprint不存在");
    }
    if (operatorId) {
      if (sprint.projectId) {
        await this.projectExecutionPermissionService.assertReadableProject(
          sprint.projectId,
          operatorId,
          permissions,
          "business/sprints/manageAll",
        );
      }
    }

    const tasks = await this.taskRepository.find({
      where: { sprintId },
      select: ["id", "storyPoints", "status"],
    });

    const completedPoints = tasks
      .filter((t) => t.status === TaskStatus.completed)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const unfinishedTaskCount = tasks.filter(
      (t) => t.status !== TaskStatus.completed,
    ).length;
    if (unfinishedTaskCount > 0 && options?.carryOverMode !== "backlog") {
      throw new BadRequestException(
        `Sprint 下仍有 ${unfinishedTaskCount} 个未完成任务，不能直接完成`,
      );
    }

    if (unfinishedTaskCount > 0 && options?.carryOverMode === "backlog") {
      const unfinishedTasks = tasks.filter(
        (t) => t.status !== TaskStatus.completed,
      );
      for (const task of unfinishedTasks) {
        await this.taskRepository.update(task.id, { sprintId: null } as any);
      }
    }

    await this.repository.update(sprintId, {
      status: SprintStatus.completed,
      completedPoints,
    });

    return {
      success: true,
      completedPoints,
      unfinishedTaskCount,
      carryOverCount:
        options?.carryOverMode === "backlog" ? unfinishedTaskCount : 0,
    };
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

  private normalizeNullableUserFields(dto: SaveDto<CreateSprintDto>) {
    const normalizedDto = dto as any;
    for (const key of ["ownerId", "scrumMasterId"]) {
      if (normalizedDto[key] === "") {
        normalizedDto[key] = null;
      }
    }
    return normalizedDto;
  }

  async getOne(query, isError = true): Promise<any | null> {
    const { _operatorId, _operatorPermissions, ...where } = query as any;
    const sprint = await super.getOne(
      {
        where,
        relations: ["project", "scrumMaster", "owner"],
      },
      isError,
    );
    if (!sprint) return sprint;
    if (_operatorId) {
      await this.assertSprintReadPermission(
        sprint,
        String(_operatorId),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
      );
    }

    return {
      ...sprint,
      project: this.mapProjectSummary(sprint.project),
      scrumMaster: this.mapUserSummary(sprint.scrumMaster),
      owner: this.mapUserSummary((sprint as any).owner),
    };
  }

  async save(dto: SaveDto<CreateSprintDto>) {
    this.normalizeNullableUserFields(dto);
    await this.assertSprintProjectPermissionForDto(dto);
    return super.save(dto as any);
  }

  async add(dto: SaveDto<CreateSprintDto>) {
    this.normalizeNullableUserFields(dto);
    await this.assertSprintProjectPermissionForDto(dto);
    return super.add(dto as any);
  }

  async update(dto: SaveDto<CreateSprintDto>) {
    this.normalizeNullableUserFields(dto);
    await this.assertSprintProjectPermissionForDto(dto);
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
          await this.assertSprintProjectPermissionById(
            id,
            operatorId,
            permissions,
          );
          successIds.push(id);
        } catch (error) {
          failed.push({
            id,
            reason: error?.message || "当前无删除该 Sprint 的权限",
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
