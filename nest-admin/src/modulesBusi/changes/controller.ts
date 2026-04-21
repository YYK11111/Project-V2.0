import { Controller, Get, Post, Body, Param, Req, Query } from "@nestjs/common";
import { ChangesService } from "./service";
import { QueryChangeDto } from "./dto";
import { QueryListDto } from "src/common/dto";
import {
  ProjectChange,
  changeStatusMap,
  changeTypeMap,
  changeImpactMap,
} from "./entity";
import { BaseController } from "src/common/BaseController";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

@Controller("business/changes")
export class ChangesController extends BaseController<
  ProjectChange,
  ChangesService
> {
  constructor(
    readonly service: ChangesService,
    private readonly workflowService: WorkflowIntegrationService,
  ) {
    super(service);
  }

  @Get("getStatus")
  getStatus() {
    return changeStatusMap;
  }

  @Get("getType")
  getType() {
    return changeTypeMap;
  }

  @Get("getImpact")
  getImpact() {
    return changeImpactMap;
  }

  @Get("list")
  async listWithProjectScope(@Query() query: QueryListDto, @Req() req: any) {
    query.pageNum ??= 1;
    query.pageSize ??= 10;
    return this.service.list({
      ...query,
      _operatorId: req.user?.id,
      _operatorPermissions: req.user?.permissions || [],
    } as any);
  }

  @Get("getOne/:id")
  async getOneWithProjectScope(@Param("id") id: string, @Req() req: any) {
    return this.service.getOne({
      id,
      _operatorId: req.user?.id,
    } as any);
  }

  @Post(":id/submit-approval")
  async submitApproval(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || "1";
    const instanceId = await this.workflowService.startChangeApproval(
      id,
      userId,
    );
    return { success: true, instanceId };
  }

  @Post(":id/publish-knowledge")
  async publishKnowledge(@Param("id") id: string, @Req() req: any) {
    return this.service.publishToKnowledge(id, {
      id: req.user?.id,
      name: req.user?.name,
    });
  }

  @Post(":id/confirm-plan-impact")
  confirmPlanImpact(
    @Param("id") id: string,
    @Req() req: any,
    @Body() body: { remark?: string },
  ) {
    const userId = req.user?.id || req.user?.name;
    return this.service.confirmPlanImpact(
      id,
      userId,
      body?.remark,
      req.user?.name,
    );
  }

  @Post(":id/confirm-plan-impact-scope")
  confirmPlanImpactScope(
    @Param("id") id: string,
    @Req() req: any,
    @Body() body: { scope: "milestone" | "sprint" | "task"; remark?: string },
  ) {
    const userId = req.user?.id || req.user?.name;
    return this.service.confirmPlanImpactScope(
      id,
      body?.scope,
      userId,
      body?.remark,
      req.user?.name,
    );
  }

  @Post(":id/confirm-plan-impact-target")
  confirmPlanImpactTarget(
    @Param("id") id: string,
    @Req() req: any,
    @Body()
    body: {
      scope: "milestone" | "sprint" | "task";
      targetId: string;
      targetName: string;
      remark?: string;
    },
  ) {
    const userId = req.user?.id || req.user?.name;
    return this.service.confirmPlanImpactTarget(
      id,
      body?.scope,
      body?.targetId,
      body?.targetName,
      userId,
      body?.remark,
      req.user?.name,
    );
  }

  @Post(":id/apply-plan-impact-target")
  applyPlanImpactTarget(
    @Param("id") id: string,
    @Req() req: any,
    @Body()
    body: {
      scope: "milestone" | "sprint" | "task";
      targetId: string;
      targetName: string;
      plannedStartDate?: string;
      plannedEndDate?: string;
      dueDate?: string;
      endDate?: string;
      remark?: string;
    },
  ) {
    const userId = req.user?.id || req.user?.name;
    return this.service.applyPlanImpactTarget(
      id,
      body?.scope,
      body?.targetId,
      {
        plannedStartDate: body?.plannedStartDate,
        plannedEndDate: body?.plannedEndDate,
        dueDate: body?.dueDate,
        endDate: body?.endDate,
      },
      userId,
      body?.remark,
      req.user?.name,
    );
  }

  @Post("approve/:id")
  approve(
    @Param("id") id: string,
    @Body() body: { approverId: string; comment: string },
  ) {
    return this.service.approve(id, body.approverId, body.comment);
  }

  @Post("reject/:id")
  reject(
    @Param("id") id: string,
    @Body() body: { approverId: string; comment: string },
  ) {
    return this.service.reject(id, body.approverId, body.comment);
  }
}
