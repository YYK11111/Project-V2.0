import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { Customer } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { CustomerDto } from './dto'

@Injectable()
export class CustomersService extends BaseService<Customer, CustomerDto> {
  constructor(
    @InjectRepository(Customer) repository: Repository<Customer>,
  ) {
    super(Customer, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Customer>> {
    const { name, code, shortName, level, status, industry, salesId } = query

    // Build where conditions dynamically to avoid empty In([]) issues
    let whereConditions: any = {}

    if (name) {
      whereConditions.name = this.sqlLike(name)
    }
    if (code) {
      whereConditions.code = this.sqlLike(code)
    }
    if (shortName) {
      whereConditions.shortName = this.sqlLike(shortName)
    }
    if (level) {
      whereConditions.level = level
    }
    if (status) {
      whereConditions.status = status
    }
    if (industry) {
      whereConditions.industry = industry
    }
    if (salesId) {
      whereConditions.salesId = salesId
    }

    const queryOrm: FindManyOptions = {
      where: whereConditions,
      relations: ['sales'],
    }

    return this.listBy(queryOrm, query)
  }

  async getCustomerDetail(id: string) {
    const customer = await this.getOne({ id })
    // Query interactions directly to avoid circular dependency
    const interactions = await this.repository.manager.query(
      'SELECT * FROM crm_interaction WHERE customer_id = ? AND is_delete IS NULL ORDER BY create_time DESC',
      [id]
    )
    return { ...customer, interactions }
  }

  async getCustomerStats(salesId?: string) {
    const where = salesId ? { salesId } : {}
    const [total, vip, important, regular, active] = await Promise.all([
      this.count({ where }),
      this.count({ where: { ...where, level: '1' } }),
      this.count({ where: { ...where, level: '2' } }),
      this.count({ where: { ...where, level: '3' } }),
      this.count({ where: { ...where, status: '3' } }),
    ])
    return { total, vip, important, regular, active }
  }

  // Count method for stats
  async count(options: any): Promise<number> {
    return this.repository.count(options)
  }
}
