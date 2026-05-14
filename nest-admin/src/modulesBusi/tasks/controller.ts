import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Req,
  Put,
} from "@nestjs/common";
import { TasksService } from "./service";
import { QueryListDto } from "src/common/dto";
import { Task, taskStatusMap, priorityMap } from "./entity";
import { BaseController } from "src/common/BaseController";
import { dependencyTypeMap } from "./entities/task-dependency.entity";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

@Controller("business/tasks")
export class TasksController extends BaseController<Task, TasksService> {
  constructor(
    readonly service: TasksService,
    private readonly workflowService: WorkflowIntegrationService,
  ) {
    super(service);
  }

  @Get("getStatus")
  getStatus() {
    return taskStatusMap;
  }

  @Get("getPriority")
  getPriority() {
    return priorityMap;
  }

  @Post(":id/submit-approval")
  async submitApproval(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || "1";
    const instanceId = await this.workflowService.startTaskApproval(id, userId);
    return { success: true, instanceId };
  }

  @Post(":id/start")
  startTask(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name;
    return this.service.startTask(id, userId, req.user?.permissions || []);
  }

  @Post(":id/pause")
  pauseTask(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name;
    return this.service.pauseTask(id, userId, req.user?.permissions || []);
  }

  @Post(":id/resume")
  resumeTask(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name;
    return this.service.resumeTask(id, userId, req.user?.permissions || []);
  }

  @Post(":id/delay")
  delayTask(
    @Param("id") id: string,
    @Body() body: { afterEndDate?: string; reason?: string },
    @Req() req: any,
  ) {
    return this.service.delayTask(id, body, {
      id: req.user?.id || req.user?.name,
      name: req.user?.name,
      permissions: req.user?.permissions || [],
    });
  }

  @Get(":id/delay-records")
  getDelayRecords(@Param("id") id: string) {
    return this.service.getDelayRecords(id);
  }

  @Post(":id/submit-completion-approval")
  submitCompletionApproval(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name;
    return this.service.submitCompletionApproval(
      id,
      userId,
      req.user?.permissions || [],
    );
  }

  @Post("progress/:id")
  updateProgress(
    @Param("id") id: string,
    @Body("progress") progress: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.name;
    return this.service.updateProgress(
      id,
      progress,
      userId,
      req.user?.permissions || [],
    );
  }

  @Get("list")
  async list(@Query() query: QueryListDto, @Req() req: any) {
    query.pageNum ??= 1;
    query.pageSize ??= 10;
    return this.service.list({
      ...query,
      _operatorId: req.user?.id,
      _operatorPermissions: req.user?.permissions || [],
    } as any);
  }

  @Get("getOne/:id")
  async getOne(@Param("id") id: string, @Req() req?: any) {
    return this.service.getOne({
      id,
      _operatorId: req.user?.id,
      _operatorPermissions: req.user?.permissions || [],
    } as any);
  }

  @Get("kanban/:projectId")
  getKanbanData(@Param("projectId") projectId: string) {
    return this.service.getKanbanData(projectId);
  }

  // ==================== P0 任务依赖API ====================

  @Get("getDependencyType")
  getDependencyType() {
    return dependencyTypeMap;
  }

  @Post(":taskId/dependencies")
  addDependency(
    @Param("taskId") taskId: string,
    @Body()
    body: { dependencyId: number; dependencyType?: string; lagDays?: number },
  ) {
    return this.service.addDependency(
      Number(taskId),
      body.dependencyId,
      body.dependencyType || "1",
      body.lagDays || 0,
    );
  }

  @Delete(":taskId/dependencies/:dependencyId")
  removeDependency(
    @Param("taskId") taskId: string,
    @Param("dependencyId") dependencyId: string,
  ) {
    return this.service.removeDependency(Number(taskId), Number(dependencyId));
  }

  @Get(":taskId/dependencies")
  getDependencies(@Param("taskId") taskId: string) {
    return this.service.getDependencies(Number(taskId));
  }

  @Get(":taskId/dependents")
  getDependents(@Param("taskId") taskId: string) {
    return this.service.getDependents(Number(taskId));
  }

  @Post(":taskId/check-circular")
  checkCircularDependency(
    @Param("taskId") taskId: string,
    @Body() body: { dependencyId: number },
  ) {
    return this.service.checkCircularDependency(
      Number(taskId),
      body.dependencyId,
    );
  }

  // ==================== P0 工时记录API ====================

  @Post(":taskId/timelogs")
  addTimeLog(
    @Param("taskId") taskId: string,
    @Body()
    body: {
      hours: number;
      description: string;
      workDate: string;
      attachments?: string[];
      progress?: number;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.name;
    return this.service.addTimeLog(
      Number(taskId),
      body.hours,
      body.description,
      body.workDate,
      userId,
      body.attachments,
      body.progress,
    );
  }

  @Get("timelogs")
  getTimeLogList(@Query() query: QueryListDto) {
    return this.service.getTimeLogList(query);
  }

  @Get(":taskId/timelogs")
  getTimeLogs(@Param("taskId") taskId: string) {
    return this.service.getTimeLogs(Number(taskId));
  }

  @Delete("timelogs/:id")
  deleteTimeLog(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name;
    return this.service.deleteTimeLog(Number(id), userId);
  }

  @Put("timelogs/:id")
  updateTimeLog(
    @Param("id") id: string,
    @Body()
    body: {
      hours: number;
      description: string;
      workDate: string;
      attachments?: string[];
      progress?: number;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.name;
    return this.service.updateTimeLog(
      Number(id),
      body.hours,
      body.description,
      body.workDate,
      userId,
      body.attachments,
      body.progress,
    );
  }
}
