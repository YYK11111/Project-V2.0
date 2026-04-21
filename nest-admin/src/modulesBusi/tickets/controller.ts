import { Controller, Get, Param, Query, Post, Req } from "@nestjs/common";
import { TicketsService } from "./service";
import { QueryListDto } from "src/common/dto";
import {
  Ticket,
  ticketTypeMap,
  ticketStatusMap,
  ticketSeverityMap,
  rootCauseCategoryMap,
} from "./entity";
import { BaseController } from "src/common/BaseController";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

@Controller("business/tickets")
export class TicketsController extends BaseController<Ticket, TicketsService> {
  constructor(
    readonly service: TicketsService,
    private readonly workflowService: WorkflowIntegrationService,
  ) {
    super(service);
  }

  @Get("getType")
  getType() {
    return ticketTypeMap;
  }

  @Get("getStatus")
  getStatus() {
    return ticketStatusMap;
  }

  @Get("getSeverity")
  getSeverity() {
    return ticketSeverityMap;
  }

  @Get("getRootCauseCategory")
  getRootCauseCategory() {
    return rootCauseCategoryMap;
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
    const instanceId = await this.workflowService.startTicketApproval(
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
}
