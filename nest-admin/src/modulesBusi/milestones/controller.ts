import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common'
import { MilestonesService } from './service'
import { QueryMilestoneDto } from './dto'
import { Milestone, milestoneStatusMap } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('business/milestones')
export class MilestonesController extends BaseController<Milestone, MilestonesService> {
  constructor(readonly service: MilestonesService) {
    super(service)
  }

  @Get('getStatus')
  getStatus() {
    return milestoneStatusMap
  }

  @Post('status/:id')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.updateStatus(id, status as any)
  }
}