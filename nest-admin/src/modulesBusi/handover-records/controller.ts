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
  async listWithDefaults(@Query() query: QueryListDto) {
    query.pageNum ??= 1;
    query.pageSize ??= 10;
    return this.service.list(query);
  }

  @Get("getStatuses")
  getStatuses() {
    return this.service.getStatuses();
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
