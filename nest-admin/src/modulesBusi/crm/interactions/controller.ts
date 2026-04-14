import { Controller, Get, Param, Query } from '@nestjs/common'
import { CustomerInteractionService } from './service'
import { CustomerInteraction, interactionTypeMap } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('business/crm/interactions')
export class CustomerInteractionsController extends BaseController<CustomerInteraction, CustomerInteractionService> {
  constructor(readonly service: CustomerInteractionService) {
    super(service)
  }

  @Get('customer/:customerId')
  getByCustomerId(@Param('customerId') customerId: string) {
    return this.service.findByCustomerId(customerId)
  }

  @Get('getTypes')
  getTypes() {
    return interactionTypeMap
  }
}
