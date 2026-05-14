import { Controller, Get, Post, Body, Param, Query, Req } from "@nestjs/common";
import { ProjectsService } from "./service";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import {
  Project,
  projectStatusMap,
  priorityMap,
  projectTypeMap,
} from "./entity";
import { BaseController } from "src/common/BaseController";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";
import { ProjectFieldPermissionService } from "./project-field-permission.service";

@Controller("business/projects")
export class ProjectsController extends BaseController<
  Project,
  ProjectsService
> {
  constructor(
    readonly service: ProjectsService,
    private readonly workflowService: WorkflowIntegrationService,
    private readonly projectFieldPermissionService: ProjectFieldPermissionService,
  ) {
    super(service);
  }

  @Get("getStatus")
  getStatus() {
    return projectStatusMap;
  }

  @Get("getPriority")
  getPriority() {
    return priorityMap;
  }

  @Get("getProjectType")
  getProjectType() {
    return projectTypeMap;
  }

  @Get("list")
  async list(@Query() query: QueryListDto, @Req() req: any) {
    query.pageNum ??= 1;
    query.pageSize ??= 10;
    return this.service.list({
      ...query,
      _operatorId: req.user?.id,
      _operatorName: req.user?.name,
      _operatorDeptId: req.user?.deptId || req.user?.dept?.id,
      _operatorPermissions: req.user?.permissions || [],
      _operatorRoles: req.user?.roles || [],
    } as any);
  }

  @Post("archive/:id")
  async archive(@Param("id") id: string, @Req() req: any) {
    await this.service.assertProjectPermission(
      id,
      req.user?.id,
      "archive",
      req.user?.permissions || [],
    );
    return this.service.archive(id);
  }

  @Get("statistics/:id")
  async getStatistics(@Param("id") id: string, @Req() req: any) {
    await this.service.assertProjectPermission(
      id,
      req.user?.id,
      "view",
      req.user?.permissions || [],
    );
    return this.service.getStatistics(id);
  }

  @Get("dashboard/:id")
  async getDashboard(@Param("id") id: string, @Req() req: any) {
    const permissionContext = await this.service.assertProjectPermission(
      id,
      req.user?.id,
      "view",
      req.user?.permissions || [],
    );
    const dashboard = await this.service.getDashboard(id);
    return {
      ...dashboard,
      permissionContext: {
        role: permissionContext.role,
        isManager: permissionContext.isManager,
        isDeliveryManager: permissionContext.isDeliveryManager,
        canEdit: permissionContext.canEdit,
        canSubmitApproval: permissionContext.canSubmitApproval,
        canSubmitClose: permissionContext.canSubmitClose,
        canArchive: permissionContext.canArchive,
      },
    };
  }

  @Get("field-permissions/:id")
  async getFieldPermissions(@Param("id") id: string, @Req() req: any) {
    const permissionContext = await this.service.assertProjectPermission(
      id,
      req.user?.id,
      "view",
      req.user?.permissions || [],
    );
    const project = await this.service.getOne({ id });
    return this.projectFieldPermissionService.getProjectFieldPermissions({
      project,
      rawRole: permissionContext.role,
      canVisit: true,
    });
  }

  @Post(":id/sync-alerts")
  syncAlerts(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name;
    return this.service.syncProjectAlertsToMessages(id, userId);
  }

  @Get("cockpit/overview")
  getCockpitOverview(@Query() query: QueryListDto, @Req() req: any) {
    return this.service.getCockpitOverview({
      ...query,
      _operatorId: req.user?.id,
      _operatorName: req.user?.name,
      _operatorDeptId: req.user?.deptId || req.user?.dept?.id,
      _operatorPermissions: req.user?.permissions || [],
      _operatorRoles: req.user?.roles || [],
    } as any);
  }

  @Get("cockpit/project/:id")
  async getProjectCockpit(@Param("id") id: string, @Req() req: any) {
    await this.service.assertProjectPermission(
      id,
      req.user?.id,
      "view",
      req.user?.permissions || [],
    );
    return this.service.getProjectCockpit(id);
  }

  @Get("cockpit")
  getCockpit(@Query() query: QueryListDto, @Req() req: any) {
    return this.service.getCockpit({
      ...query,
      _operatorId: req.user?.id,
      _operatorPermissions: req.user?.permissions || [],
    } as any);
  }

  @Post("recalculate-progress")
  recalculateProgress(@Body() body: { projectIds?: string[] }) {
    return this.service.recalculateProjectProgressBatch(body?.projectIds);
  }

  @Post("generate-cockpit-snapshots")
  generateCockpitSnapshots(@Body() body: { projectIds?: string[] }) {
    return this.service.generateCockpitSnapshots(body?.projectIds);
  }

  @Post(":id/recalculate-progress")
  async recalculateSingleProgress(@Param("id") id: string) {
    const progress = await this.service.recalculateProjectProgress(id);
    return { projectId: id, progress };
  }

  @Post(":id/submit-approval")
  async submitApproval(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || "1";
    await this.service.assertProjectPermission(
      id,
      req.user?.id,
      "submitApproval",
      req.user?.permissions || [],
    );
    await this.service.validateBaselinePlan(id);
    await this.service.ensureProjectApprovalReady(id);
    const instanceId = await this.workflowService.startProjectApproval(
      id,
      userId,
    );
    return { success: true, instanceId };
  }

  @Post(":id/submit-close")
  async submitClose(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || "1";
    await this.service.assertProjectPermission(
      id,
      req.user?.id,
      "submitClose",
      req.user?.permissions || [],
    );
    await this.service.validateClosePlan(id);
    const instanceId = await this.workflowService.startProjectCloseApproval(
      id,
      userId,
    );
    return { success: true, instanceId };
  }

  @Post(":id/publish-close-review")
  async publishCloseReview(@Param("id") id: string, @Req() req: any) {
    await this.service.assertProjectPermission(
      id,
      req.user?.id,
      "edit",
      req.user?.permissions || [],
    );
    return this.service.publishCloseReviewToKnowledge(id, {
      id: req.user?.id,
      name: req.user?.name,
    });
  }
}
