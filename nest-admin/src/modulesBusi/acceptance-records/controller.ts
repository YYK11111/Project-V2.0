import { Controller, Get, Post, Query, Param, Req } from "@nestjs/common";
import { BaseController } from "src/common/BaseController";
import { QueryListDto } from "src/common/dto";
import { AcceptanceRecord } from "./entity";
import { AcceptanceRecordsService } from "./service";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

@Controller("business/acceptance-records")
export class AcceptanceRecordsController extends BaseController<
  AcceptanceRecord,
  AcceptanceRecordsService
> {
  constructor(
    readonly service: AcceptanceRecordsService,
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

  @Get("getResults")
  getResults() {
    return this.service.getResults();
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
    const instanceId = await this.workflowService.startAcceptanceApproval(
      id,
      userId,
    );
    return { success: true, instanceId };
  }
}
