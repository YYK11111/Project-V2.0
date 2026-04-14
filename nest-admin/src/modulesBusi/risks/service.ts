import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { Risk, RiskStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { CreateRiskDto } from './dto'

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
        projectId,
        status,
        level,
        category,
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
}
