import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { Contract } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { ContractDto } from './dto'
import { Customer } from '../customers/entity'
import { User } from 'src/modules/users/entities/user.entity'

@Injectable()
export class ContractsService extends BaseService<Contract, ContractDto> {
  constructor(
    @InjectRepository(Contract) repository: Repository<Contract>,
  ) {
    super(Contract, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Contract>> {
    const { name, customerId, status, ownerId } = query

    let whereConditions: any = {}

    if (name) {
      whereConditions.name = this.sqlLike(name)
    }
    if (customerId) {
      whereConditions.customerId = customerId
    }
    if (status) {
      whereConditions.status = status
    }
    if (ownerId) {
      whereConditions.ownerId = ownerId
    }

    const queryOrm: FindManyOptions = {
      where: whereConditions,
      relations: ['customer', 'owner'],
    }

    return this.listBy(queryOrm, query)
  }

  async getContractStats(ownerId?: string) {
    const where = ownerId ? { ownerId } : {}
    const [total, executing, expired, terminated, archived] = await Promise.all([
      this.repository.count({ where }),
      this.repository.count({ where: { ...where, status: '1' } }),
      this.repository.count({ where: { ...where, status: '2' } }),
      this.repository.count({ where: { ...where, status: '3' } }),
      this.repository.count({ where: { ...where, status: '4' } }),
    ])
    return { total, executing, expired, terminated, archived }
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
    const contract = await super.getOne(
      {
        where: query,
        relations: ['customer', 'owner'],
      },
      isError,
    )
    if (!contract) return contract

    return {
      ...contract,
      customer: this.mapCustomerSummary(contract.customer),
      owner: this.mapUserSummary(contract.owner),
    }
  }
}
