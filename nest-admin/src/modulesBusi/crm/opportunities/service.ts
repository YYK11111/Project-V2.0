import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { SalesOpportunity } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { SalesOpportunityDto } from './dto'

@Injectable()
export class OpportunitiesService extends BaseService<SalesOpportunity, SalesOpportunityDto> {
  constructor(
    @InjectRepository(SalesOpportunity) repository: Repository<SalesOpportunity>,
  ) {
    super(SalesOpportunity, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<SalesOpportunity>> {
    const { name, customerId, stage, salesId } = query

    let whereConditions: any = {}

    if (name) {
      whereConditions.name = this.sqlLike(name)
    }
    if (customerId) {
      whereConditions.customerId = customerId
    }
    if (stage) {
      whereConditions.stage = stage
    }
    if (salesId) {
      whereConditions.salesId = salesId
    }

    const queryOrm: FindManyOptions = {
      where: whereConditions,
      relations: ['customer', 'sales'],
    }

    return this.listBy(queryOrm, query)
  }

  async getOpportunityStats(salesId?: string) {
    const where = salesId ? { salesId } : {}
    const [total, contacting, analyzing, negotiating, won, lost] = await Promise.all([
      this.repository.count({ where }),
      this.repository.count({ where: { ...where, stage: '1' } }),
      this.repository.count({ where: { ...where, stage: '2' } }),
      this.repository.count({ where: { ...where, stage: '4' } }),
      this.repository.count({ where: { ...where, stage: '5' } }),
      this.repository.count({ where: { ...where, stage: '6' } }),
    ])
    return { total, contacting, analyzing, negotiating, won, lost }
  }
}
