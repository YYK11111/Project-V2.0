import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { Milestone, MilestoneStatus } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { CreateMilestoneDto } from "./dto";
import { User } from "src/modules/users/entities/user.entity";
import { Task, TaskStatus } from "../tasks/entity";

@Injectable()
export class MilestonesService extends BaseService<
  Milestone,
  CreateMilestoneDto
> {
  constructor(
    @InjectRepository(Milestone) repository: Repository<Milestone>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
  ) {
    super(Milestone, repository);
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
    } = query as QueryListDto & {
      ownerId?: string;
      phase?: string;
      changeImpactFlag?: string;
      riskImpactFlag?: string;
    };
    let queryOrm: FindManyOptions = {
      where: {
        name: this.sqlLike(name),
        projectId: projectId || undefined,
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
    return this.listBy(queryOrm, query);
  }

  async updateStatus(id: string, status: MilestoneStatus): Promise<any> {
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
    const milestone = await super.getOne(
      {
        where: query,
        relations: ["project", "creator", "owner"],
      },
      isError,
    );
    if (!milestone) return milestone;

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
}
