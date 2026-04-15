import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { CustomerInteraction } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { CustomerInteractionDto } from './dto'
import { Customer } from '../customers/entity'

@Injectable()
export class CustomerInteractionService extends BaseService<CustomerInteraction, CustomerInteractionDto> {
  constructor(
    @InjectRepository(CustomerInteraction) repository: Repository<CustomerInteraction>,
  ) {
    super(CustomerInteraction, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<CustomerInteraction>> {
    const { customerId, interactionType } = query

    let whereConditions: any = {}

    if (customerId) {
      whereConditions.customerId = customerId
    }
    if (interactionType) {
      whereConditions.interactionType = interactionType
    }

    const queryOrm: FindManyOptions = {
      where: whereConditions,
      relations: ['customer'],
    }

    return this.listBy(queryOrm, query)
  }

  async findByCustomerId(customerId: string): Promise<CustomerInteraction[]> {
    return this.repository.find({
      where: { customerId },
      relations: ['customer'],
    })
  }

  private mapCustomerSummary(customer?: Customer | null) {
    if (!customer) return null
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
    }
  }

  async getOne(query, isError = true): Promise<any | null> {
    const interaction = await super.getOne(
      {
        where: query,
        relations: ['customer'],
      },
      isError,
    )
    if (!interaction) return interaction

    return {
      ...interaction,
      customer: this.mapCustomerSummary(interaction.customer),
    }
  }
}
