import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common'
import { ProjectsService } from './service'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { Project, projectStatusMap, priorityMap, projectTypeMap } from './entity'
import { BaseController } from 'src/common/BaseController'
import { WorkflowIntegrationService } from 'src/common/services/workflow-integration.service'

@Controller('business/projects')
export class ProjectsController extends BaseController<Project, ProjectsService> {
  constructor(
    readonly service: ProjectsService,
    private readonly workflowService: WorkflowIntegrationService,
  ) {
    super(service)
  }

  @Get('getStatus')
  getStatus() {
    return projectStatusMap
  }

  @Get('getPriority')
  getPriority() {
    return priorityMap
  }

  @Get('getProjectType')
  getProjectType() {
    return projectTypeMap
  }

  @Post('archive/:id')
  archive(@Param('id') id: string) {
    return this.service.archive(id)
  }

  @Get('statistics/:id')
  getStatistics(@Param('id') id: string) {
    return this.service.getStatistics(id)
  }

  @Get('dashboard/:id')
  getDashboard(@Param('id') id: string) {
    return this.service.getDashboard(id)
  }

  @Get('cockpit')
  getCockpit(@Query() query: QueryListDto) {
    return this.service.getCockpit(query)
  }

  @Post('recalculate-progress')
  recalculateProgress(@Body() body: { projectIds?: string[] }) {
    return this.service.recalculateProjectProgressBatch(body?.projectIds)
  }

  @Post(':id/recalculate-progress')
  async recalculateSingleProgress(@Param('id') id: string) {
    const progress = await this.service.recalculateProjectProgress(id)
    return { projectId: id, progress }
  }

  @Post(':id/submit-approval')
  async submitApproval(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.name || '1'
    const instanceId = await this.workflowService.startProjectApproval(id, userId)
    return { success: true, instanceId }
  }

  @Post(':id/submit-close')
  async submitClose(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.name || '1'
    const instanceId = await this.workflowService.startProjectCloseApproval(id, userId)
    return { success: true, instanceId }
  }
}
