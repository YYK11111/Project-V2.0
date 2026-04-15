import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { Risk, RiskStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { CreateRiskDto } from './dto'
import { User } from 'src/modules/users/entities/user.entity'

@Injectable()
export class RisksService extends BaseService<Risk, CreateRiskDto> {
  constructor(@InjectRepository(Risk) repository: Repository<Risk>) {
    super(Risk, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Risk>> {
    let { projectId, status, level, category, name } = query
    let queryOrm: FindManyOptions = {
      where: {
        name: this.sqlLike(name),
        projectId: projectId || undefined,
        status: status || undefined,
        level: level || undefined,
        category: category || undefined,
      },
      relations: ['project', 'riskOwner'],
      order: { sort: 'ASC', createTime: 'DESC' },
    }
    return this.listBy(queryOrm, query)
  }

  async resolve(id: string): Promise<any> {
    return this.repository.update(id, {
      status: RiskStatus.resolved,
      resolvedDate: new Date().toISOString().split('T')[0],
    })
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
    const risk = await super.getOne(
      {
        where: query,
        relations: ['project', 'riskOwner'],
      },
      isError,
    )
    if (!risk) return risk

    return {
      ...risk,
      project: this.mapProjectSummary(risk.project),
      riskOwner: this.mapUserSummary(risk.riskOwner),
    }
  }
}
