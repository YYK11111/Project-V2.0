import { Controller, Get, Post, Query, Param, Req } from "@nestjs/common";
import { BaseController } from "src/common/BaseController";
import { QueryListDto } from "src/common/dto";
import { GoLiveRecord } from "./entity";
import { GoLiveRecordsService } from "./service";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

@Controller("business/go-live-records")
export class GoLiveRecordsController extends BaseController<GoLiveRecord, GoLiveRecordsService> {
  constructor(
    readonly service: GoLiveRecordsService,
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
    const instanceId = await this.workflowService.startGoLiveApproval(id, userId);
    return { success: true, instanceId };
  }
}
