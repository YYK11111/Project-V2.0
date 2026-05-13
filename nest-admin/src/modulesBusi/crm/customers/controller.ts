import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Post,
  Req,
} from "@nestjs/common";
import { CustomersService } from "./service";
import { QueryListDto } from "src/common/dto";
import {
  Customer,
  customerTypeMap,
  customerLevelMap,
  customerStatusMap,
} from "./entity";
import { BaseController } from "src/common/BaseController";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

@Controller("business/crm/customers")
export class CustomersController extends BaseController<
  Customer,
  CustomersService
> {
  constructor(
    readonly service: CustomersService,
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
      _operatorId: req?.user?.id,
      _operatorName: req?.user?.name,
      _operatorPermissions: req?.user?.permissions || [],
    } as any);
  }

  @Get("getOne/:id")
  async getOne(@Param("id") id: string, @Req() req?: any) {
    return this.service.getOne({
      id,
      _operatorId: req?.user?.id,
      _operatorName: req?.user?.name,
      _operatorPermissions: req?.user?.permissions || [],
    });
  }

  @Get("detail/:id")
  getCustomerDetail(@Param("id") id: string, @Req() req: any) {
    return this.service.getCustomerDetail({
      id,
      _operatorId: req?.user?.id,
      _operatorName: req?.user?.name,
      _operatorPermissions: req?.user?.permissions || [],
    });
  }

  @Get("stats")
  getCustomerStats(@Query("salesId") salesId?: string) {
    return this.service.getCustomerStats(salesId);
  }

  @Get("getTypes")
  getTypes() {
    return customerTypeMap;
  }

  @Get("getLevels")
  getLevels() {
    return customerLevelMap;
  }

  @Get("getStatuses")
  getStatuses() {
    return customerStatusMap;
  }

  @Post(":id/submit-approval")
  async submitApproval(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.name || "1";
    const instanceId = await this.workflowService.startCustomerApproval(
      id,
      userId,
    );
    return { success: true, instanceId };
  }

  @Post(":id/auth")
  async grantViewAccess(
    @Param("id") id: string,
    @Body() body: { userIds?: string[]; userId?: string },
    @Req() req: any,
  ) {
    const userIds = Array.isArray(body.userIds)
      ? body.userIds
      : [body.userId].filter(Boolean);
    return this.service.grantCustomerViewAccess(
      id,
      userIds,
      req.user?.id,
      req.user?.name,
      req.user?.permissions || [],
    );
  }

  @Delete(":id/auth/:userId")
  async revokeViewAccess(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Req() req: any,
  ) {
    return this.service.revokeCustomerViewAccess(
      id,
      userId,
      req.user?.id,
      req.user?.name,
      req.user?.permissions || [],
    );
  }

  @Get(":id/auth-users")
  async getAuthUsers(@Param("id") id: string, @Req() req: any) {
    return this.service.getCustomerAuthUsers(
      id,
      req.user?.id,
      req.user?.name,
      req.user?.permissions || [],
    );
  }
}
