import { Controller, Get, Param, Query } from '@nestjs/common'
import { OpportunitiesService } from './service'
import { SalesOpportunity, opportunityStageMap } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('business/crm/opportunities')
export class OpportunitiesController extends BaseController<SalesOpportunity, OpportunitiesService> {
  constructor(readonly service: OpportunitiesService) {
    super(service)
  }

  @Get('stats')
  getOpportunityStats(@Query('salesId') salesId?: string) {
    return this.service.getOpportunityStats(salesId)
  }

  @Get('getStages')
  getStages() {
    return opportunityStageMap
  }
}
