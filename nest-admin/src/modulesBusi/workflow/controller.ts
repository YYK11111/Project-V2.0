import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { WorkflowService } from './service';
import { BusinessFieldService } from '../../common/services/business-field.service';
import { CreateWorkflowDefinitionDto, UpdateWorkflowDefinitionDto, StartWorkflowDto, CompleteTaskDto, TransferTaskDto, AddSignTaskDto, WithdrawWorkflowDto, CancelWorkflowDto, CloseReturnedWorkflowDto, ResubmitReturnedWorkflowDto } from './dto';

@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly businessFieldService: BusinessFieldService,
  ) {}

  private getCurrentUserId(req: Record<string, any>): string {
    const userId = req.user?.id || req.user?.sub
    if (!userId) {
      throw new Error('当前用户不存在')
    }
    return String(userId)
  }

  // ==================== 流程定义接口 ====================

  @Post('definitions/save')
  async saveDefinition(@Body() body, @Req() req) {
    console.log('>>> saveDefinition req.body:', JSON.stringify(req.body))
    console.log('>>> saveDefinition body param:', JSON.stringify(body))
    console.log('>>> saveDefinition raw body:', req.rawBody)
    if (body.id) {
      delete body.createUser
      body.updateUser = req.user?.name
    } else {
      delete body.updateUser
      body.createUser = req.user?.name
    }
    return this.workflowService.saveDefinition(body);
  }

  @Get('definitions')
  async listDefinitions() {
    return this.workflowService.listDefinitions();
  }

  @Get('definitions/:id')
  async getDefinition(@Param('id') id: string) {
    return this.workflowService.getDefinition(id);
  }

  @Put('definitions/:id')
  async updateDefinition(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDefinitionDto,
  ) {
    return this.workflowService.updateDefinition(id, dto);
  }

  @Post('definitions/:id/publish')
  async publishDefinition(@Param('id') id: string) {
    return this.workflowService.publishDefinition(id);
  }

  @Post('definitions/:id/unpublish')
  async unpublishDefinition(@Param('id') id: string) {
    return this.workflowService.unpublishDefinition(id);
  }

  @Delete('definitions/:id')
  async deleteDefinition(@Param('id') id: string) {
    await this.workflowService.deleteDefinition(id);
    return { success: true };
  }

  @Post('definitions/:id/copy')
  async copyDefinition(@Param('id') id: string) {
    return this.workflowService.copyDefinition(id);
  }

  // ==================== 流程实例接口 ====================

  @Post('instances/start')
  async startWorkflow(
    @Body() dto: StartWorkflowDto,
    @Req() req,
  ) {
    return this.workflowService.startWorkflow(dto, this.getCurrentUserId(req));
  }

  @Get('instances/:id')
  async getInstance(@Param('id') id: string) {
    return this.workflowService.getInstance(id);
  }

  @Get('instances')
  async listInstances(
    @Query('status') status?: string,
    @Query('mode') mode?: 'starter' | 'participant',
    @Req() req?,
  ) {
    return this.workflowService.listInstances(this.getCurrentUserId(req), status, mode || 'starter');
  }

  // ==================== 任务接口 ====================

  @Get('tasks/my')
  async getMyTasks(@Req() req) {
    return this.workflowService.getPendingTasks(this.getCurrentUserId(req));
  }

  @Post('tasks/:id/complete')
  async completeTask(
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
    @Req() req,
  ) {
    return this.workflowService.completeTask(id, this.getCurrentUserId(req), dto);
  }

  @Post('tasks/:id/transfer')
  async transferTask(
    @Param('id') id: string,
    @Body() dto: TransferTaskDto,
    @Req() req,
  ) {
    return this.workflowService.transferTask(id, this.getCurrentUserId(req), dto);
  }

  @Post('tasks/:id/add-sign')
  async addSignTask(
    @Param('id') id: string,
    @Body() dto: AddSignTaskDto,
    @Req() req,
  ) {
    return this.workflowService.addSignTask(id, this.getCurrentUserId(req), dto);
  }

  // ==================== 流程实例操作接口 ====================

  @Post('instances/:id/withdraw')
  async withdrawWorkflow(
    @Param('id') id: string,
    @Body() dto: WithdrawWorkflowDto,
    @Req() req,
  ) {
    return this.workflowService.withdrawWorkflow(id, this.getCurrentUserId(req), dto);
  }

  @Post('instances/:id/cancel')
  async cancelInstance(
    @Param('id') id: string,
    @Body() dto: CancelWorkflowDto,
    @Req() req,
  ) {
    return this.workflowService.cancelInstance(id, this.getCurrentUserId(req), dto);
  }

  @Post('instances/:id/close-returned')
  async closeReturnedInstance(
    @Param('id') id: string,
    @Body() dto: CloseReturnedWorkflowDto,
    @Req() req,
  ) {
    return this.workflowService.closeReturnedInstance(id, this.getCurrentUserId(req), dto);
  }

  @Post('instances/:id/resubmit-returned')
  async resubmitReturnedInstance(
    @Param('id') id: string,
    @Body() dto: ResubmitReturnedWorkflowDto,
    @Req() req,
  ) {
    return this.workflowService.resubmitReturnedInstance(id, this.getCurrentUserId(req), dto);
  }

  @Get('instances/:id/history')
  async getInstanceHistory(@Param('id') id: string) {
    return this.workflowService.getInstanceHistory(id);
  }

  @Get('instances/:id/tasks')
  async getInstanceTasks(@Param('id') id: string) {
    return this.workflowService.getInstanceTasks(id);
  }

  @Get('history/my-handled')
  async getHandledHistory(@Req() req, @Query() query) {
    return this.workflowService.getHandledHistory(this.getCurrentUserId(req), query)
  }

  // ==================== 业务对象配置接口 ====================

  @Get('business-configs')
  async listBusinessConfigs(@Query('businessType') businessType?: string) {
    return this.workflowService.listBusinessConfigs(businessType);
  }

  @Get('business-configs/:businessType')
  async getBusinessConfig(@Param('businessType') businessType: string) {
    return this.workflowService.getBusinessConfig(businessType);
  }

  @Post('business-configs/save')
  async saveBusinessConfig(@Body() body, @Req() req) {
    if (body.id) {
      delete body.createUser
      body.updateUser = req.user?.name
    } else {
      delete body.updateUser
      body.createUser = req.user?.name
    }
    return this.workflowService.saveBusinessConfig(body);
  }

  @Put('business-configs/:businessType')
  async updateBusinessConfig(
    @Param('businessType') businessType: string,
    @Body() dto: any,
  ) {
    return this.workflowService.updateBusinessConfig(businessType, dto);
  }

  @Delete('business-configs/:businessType')
  async deleteBusinessConfig(@Param('businessType') businessType: string) {
    await this.workflowService.deleteBusinessConfig(businessType);
    return { success: true };
  }

  // ==================== 业务字段配置接口 ====================

  @Get('business-fields')
  async getAllFieldMappings() {
    return this.businessFieldService.getAllFieldMappings();
  }

  @Get('business-fields/:businessType')
  async getFieldMappings(@Param('businessType') businessType: string, @Query('scope') scope?: string) {
    if (scope === 'all') {
      return this.businessFieldService.getAllFieldOptionsForBusinessType(businessType)
    }
    return this.businessFieldService.getFieldMappingsForBusinessType(businessType);
  }

  @Post('business-fields/generate')
  async generateFieldMappings(@Body() body: { businessTypes?: string[] }) {
    const businessTypes = body.businessTypes || ['project', 'ticket', 'customer', 'change']
    const results = []
    for (const businessType of businessTypes) {
      const count = await this.businessFieldService.generateAndSaveFieldMappings(businessType)
      results.push({ businessType, count })
    }
    return { success: true, results }
  }

  @Put('business-fields/:id')
  async updateFieldMapping(
    @Param('id') id: string,
    @Body() body: { fieldLabel?: string; description?: string; enabled?: boolean },
  ) {
    await this.businessFieldService.updateFieldMapping(+id, body)
    return { success: true }
  }

  @Delete('business-fields/:id')
  async deleteFieldMapping(@Param('id') id: string) {
    await this.businessFieldService.deleteFieldMapping(+id)
    return { success: true }
  }
}
