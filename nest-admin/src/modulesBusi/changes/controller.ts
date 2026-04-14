import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common'
import { ChangesService } from './service'
import { QueryChangeDto } from './dto'
import { ProjectChange, changeStatusMap, changeTypeMap, changeImpactMap } from './entity'
import { BaseController } from 'src/common/BaseController'
import { WorkflowIntegrationService } from 'src/common/services/workflow-integration.service'

@Controller('business/changes')
export class ChangesController extends BaseController<ProjectChange, ChangesService> {
  constructor(readonly service: ChangesService, private readonly workflowService: WorkflowIntegrationService) {
    super(service)
  }

  @Get('getStatus')
  getStatus() {
    return changeStatusMap
  }

  @Get('getType')
  getType() {
    return changeTypeMap
  }

  @Get('getImpact')
  getImpact() {
    return changeImpactMap
  }

  @Post(':id/submit-approval')
  async submitApproval(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || '1'
    const instanceId = await this.workflowService.startChangeApproval(id, userId)
    return { success: true, instanceId }
  }

  @Post('approve/:id')
  approve(@Param('id') id: string, @Body() body: { approverId: string; comment: string }) {
    return this.service.approve(id, body.approverId, body.comment)
  }

  @Post('reject/:id')
  reject(@Param('id') id: string, @Body() body: { approverId: string; comment: string }) {
    return this.service.reject(id, body.approverId, body.comment)
  }
}
