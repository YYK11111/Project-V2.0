import { Controller, Get, Query, Post, Param, Req } from "@nestjs/common";
import { BaseController } from "src/common/BaseController";
import { QueryListDto } from "src/common/dto";
import { HandoverRecord } from "./entity";
import { HandoverRecordsService } from "./service";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

@Controller("business/handover-records")
export class HandoverRecordsController extends BaseController<
  HandoverRecord,
  HandoverRecordsService
> {
  constructor(
    readonly service: HandoverRecordsService,
    private readonly workflowService: WorkflowIntegrationService,
  ) {
    super(service);
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

  @Get("getStatuses")
  getStatuses() {
    return this.service.getStatuses();
  }

  @Get("getOne/:id")
  async getOne(@Param("id") id: string, @Req() req?: any) {
    return this.service.getOne({
      id,
      _operatorId: req.user?.id,
      _operatorPermissions: req.user?.permissions || [],
    } as any);
  }

  @Post(":id/submit-approval")
  async submitApproval(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || "1";
    const instanceId = await this.workflowService.startHandoverApproval(
      id,
      userId,
    );
    return { success: true, instanceId };
  }
}
