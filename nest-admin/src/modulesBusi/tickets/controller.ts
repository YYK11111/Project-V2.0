import { Controller, Get, Param, Query, Post, Req } from '@nestjs/common'
import { TicketsService } from './service'
import { QueryListDto } from 'src/common/dto'
import { Ticket, ticketTypeMap, ticketStatusMap, ticketSeverityMap, rootCauseCategoryMap } from './entity'
import { BaseController } from 'src/common/BaseController'
import { WorkflowIntegrationService } from 'src/common/services/workflow-integration.service'

@Controller('business/tickets')
export class TicketsController extends BaseController<Ticket, TicketsService> {
  constructor(readonly service: TicketsService, private readonly workflowService: WorkflowIntegrationService) {
    super(service)
  }

  @Get('getType')
  getType() {
    return ticketTypeMap
  }

  @Get('getStatus')
  getStatus() {
    return ticketStatusMap
  }

  @Get('getSeverity')
  getSeverity() {
    return ticketSeverityMap
  }

  @Get('getRootCauseCategory')
  getRootCauseCategory() {
    return rootCauseCategoryMap
  }

  @Post(':id/submit-approval')
  async submitApproval(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || '1'
    const instanceId = await this.workflowService.startTicketApproval(id, userId)
    return { success: true, instanceId }
  }
}
