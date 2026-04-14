import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { Contract } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { ContractDto } from './dto'

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
      relations: ['customer'],
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
}
