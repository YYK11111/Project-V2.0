import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { SalesOpportunity } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { SalesOpportunityDto } from './dto'
import { Customer } from '../customers/entity'
import { User } from 'src/modules/users/entities/user.entity'

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

  private mapCustomerSummary(customer?: Customer | null) {
    if (!customer) return null
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
    }
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

  async getOne(query, isError = true): Promise<any | null> {
    const opportunity = await super.getOne(
      {
        where: query,
        relations: ['customer', 'sales'],
      },
      isError,
    )
    if (!opportunity) return opportunity

    return {
      ...opportunity,
      customer: this.mapCustomerSummary(opportunity.customer),
      sales: this.mapUserSummary(opportunity.sales),
    }
  }
}
