import { Controller, Get, Param, Query, Post, Req } from '@nestjs/common'
import { CustomersService } from './service'
import { Customer, customerTypeMap, customerLevelMap, customerStatusMap } from './entity'
import { BaseController } from 'src/common/BaseController'
import { WorkflowIntegrationService } from 'src/common/services/workflow-integration.service'

@Controller('business/crm/customers')
export class CustomersController extends BaseController<Customer, CustomersService> {
  constructor(readonly service: CustomersService, private readonly workflowService: WorkflowIntegrationService) {
    super(service)
  }

  @Get('detail/:id')
  getCustomerDetail(@Param('id') id: string) {
    return this.service.getCustomerDetail(id)
  }

  @Get('stats')
  getCustomerStats(@Query('salesId') salesId?: string) {
    return this.service.getCustomerStats(salesId)
  }

  @Get('getTypes')
  getTypes() {
    return customerTypeMap
  }

  @Get('getLevels')
  getLevels() {
    return customerLevelMap
  }

  @Get('getStatuses')
  getStatuses() {
    return customerStatusMap
  }

  @Post(':id/submit-approval')
  async submitApproval(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || '1'
    const instanceId = await this.workflowService.startCustomerApproval(id, userId)
    return { success: true, instanceId }
  }
}
