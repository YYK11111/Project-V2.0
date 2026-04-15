import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { Milestone, MilestoneStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { CreateMilestoneDto } from './dto'
import { User } from 'src/modules/users/entities/user.entity'

@Injectable()
export class MilestonesService extends BaseService<Milestone, CreateMilestoneDto> {
  constructor(@InjectRepository(Milestone) repository: Repository<Milestone>) {
    super(Milestone, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Milestone>> {
    let { projectId, status, name } = query
    let queryOrm: FindManyOptions = {
      where: {
        name: this.sqlLike(name),
        projectId: projectId || undefined,
        status: status || undefined,
      },
      relations: ['project', 'creator'],
      order: { sort: 'ASC', createTime: 'DESC' },
    }
    return this.listBy(queryOrm, query)
  }

  async updateStatus(id: string, status: MilestoneStatus): Promise<any> {
    const updateData: any = { status }
    if (status === MilestoneStatus.completed) {
      updateData.completedDate = new Date().toISOString().split('T')[0]
    }
    return this.repository.update(id, updateData)
  }

  private mapUserSummary(user?: User | null) {
    if (!user) return null
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
    }
  }

  private mapProjectSummary(project?: any) {
    if (!project) return null
    return {
      id: project.id,
      code: project.code,
      name: project.name,
    }
  }

  async getOne(query, isError = true): Promise<any | null> {
    const milestone = await super.getOne(
      {
        where: query,
        relations: ['project', 'creator'],
      },
      isError,
    )
    if (!milestone) return milestone

    return {
      ...milestone,
      project: this.mapProjectSummary(milestone.project),
      creator: this.mapUserSummary(milestone.creator),
    }
  }
}
