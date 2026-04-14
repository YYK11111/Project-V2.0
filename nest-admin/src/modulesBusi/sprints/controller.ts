import { Controller, Get, Post, Param } from '@nestjs/common'
import { SprintsService } from './service'
import { Sprint, sprintStatusMap } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('business/sprints')
export class SprintsController extends BaseController<Sprint, SprintsService> {
  constructor(readonly service: SprintsService) {
    super(service)
  }

  @Get('getStatus')
  getStatus() {
    return sprintStatusMap
  }

  @Get(':id/burndown')
  async getBurndown(@Param('id') id: string) {
    return this.service.getBurndown(id)
  }

  @Get(':id/velocity')
  async getVelocity(@Param('id') id: string) {
    return this.service.getVelocity(id)
  }

  @Post(':id/start')
  async startSprint(@Param('id') id: string) {
    return this.service.startSprint(id)
  }

  @Post(':id/complete')
  async completeSprint(@Param('id') id: string) {
    return this.service.completeSprint(id)
  }
}