import { Body, Controller, Get, Param, Query, Post, Req } from "@nestjs/common";
import { TicketsService } from "./service";
import { QueryListDto } from "src/common/dto";
import {
  Ticket,
  ticketPriorityMap,
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

  @Get("getPriority")
  getPriority() {
    return ticketPriorityMap;
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
      permissions: req.user?.permissions || [],
    });
  }

  @Post(":id/convert-to-task")
  async convertToTask(@Param("id") id: string, @Req() req: any) {
    return this.service.convertToTask(id, {
      id: req.user?.id,
      name: req.user?.name,
      permissions: req.user?.permissions || [],
    });
  }

  @Post(":id/dispatch")
  async dispatch(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    return this.service.dispatchTicket(
      id,
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
      body,
    );
  }

  @Post("batch-dispatch")
  async batchDispatch(@Body() body: any, @Req() req: any) {
    return this.service.batchDispatchTickets(
      body.ids || [],
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
      body,
    );
  }

  @Post(":id/transfer")
  async transfer(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    return this.service.transferTicket(
      id,
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
      body,
    );
  }

  @Post(":id/finish")
  async finish(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    return this.service.submitForVerification(
      id,
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
      body,
    );
  }

  @Post(":id/verify-pass")
  async verifyPass(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.service.verifyTicket(
      id,
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
      { ...body, passed: true },
    );
  }

  @Post(":id/verify-reject")
  async verifyReject(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.service.rejectVerification(
      id,
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
      body,
    );
  }

  @Post(":id/reopen")
  async reopen(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    return this.service.reopenTicket(
      id,
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
      body,
    );
  }

  @Get(":id/action-logs")
  async getActionLogs(@Param("id") id: string, @Req() req: any) {
    return this.service.getActionLogs(id, {
      id: req.user?.id,
      permissions: req.user?.permissions || [],
    });
  }

  @Get(":id/dispatch-history")
  async getDispatchHistory(@Param("id") id: string, @Req() req: any) {
    return this.service.getDispatchHistory(id, {
      id: req.user?.id,
      permissions: req.user?.permissions || [],
    });
  }
}
