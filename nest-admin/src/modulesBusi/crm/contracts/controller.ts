import { Controller, Get, Param, Query } from '@nestjs/common'
import { ContractsService } from './service'
import { Contract, contractStatusMap } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('business/crm/contracts')
export class ContractsController extends BaseController<Contract, ContractsService> {
  constructor(readonly service: ContractsService) {
    super(service)
  }

  @Get('stats')
  getContractStats(@Query('ownerId') ownerId?: string) {
    return this.service.getContractStats(ownerId)
  }

  @Get('getStatuses')
  getStatuses() {
    return contractStatusMap
  }
}
