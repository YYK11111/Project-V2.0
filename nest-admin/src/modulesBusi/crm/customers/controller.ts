import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Post,
  Put,
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
import {
  CustomerViewerGrantType,
  CustomerViewerStatus,
} from "./entities/customer-viewer.entity";
import { BaseController } from "src/common/BaseController";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

export class GrantCustomerViewAccessDto {
  customerId: string;
  userIds: string[];
  permissions?: string[];
  grantType?: CustomerViewerGrantType;
  startTime?: string;
  endTime?: string;
  canEdit?: string;
  grantReason?: string;
}

export class RevokeCustomerViewAccessDto {
  customerId: string;
  userId: string;
  reason?: string;
}

export class UpdateViewerStatusDto {
  customerId: string;
  viewerIds: string[];
  status: CustomerViewerStatus;
}

export class SelectCustomerViewersDto {
  userIds: string[];
  grantType?: CustomerViewerGrantType;
  startTime?: string;
  endTime?: string;
  canEdit?: string;
  grantReason?: string;
}

export class CancelCustomerViewerDto {
  userId: string;
  reason?: string;
}

export class CancelCustomerViewersDto {
  userIds: string[] | string;
  reason?: string;
}

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

  @Get(":id/viewers/allocatedList")
  async getAllocatedViewerList(
    @Param("id") id: string,
    @Query() query: QueryListDto,
    @Req() req: any,
  ) {
    return this.service.allocatedViewerList(id, query, {
      id: req.user?.id,
      name: req.user?.name,
      permissions: req.user?.permissions || [],
    });
  }

  @Get(":id/viewers/unallocatedList")
  async getUnallocatedViewerList(
    @Param("id") id: string,
    @Query() query: QueryListDto,
    @Req() req: any,
  ) {
    return this.service.unallocatedViewerList(id, query, {
      id: req.user?.id,
      name: req.user?.name,
      permissions: req.user?.permissions || [],
    });
  }

  @Post(":id/viewers/selectAll")
  async selectCustomerViewers(
    @Param("id") id: string,
    @Body() dto: SelectCustomerViewersDto,
    @Req() req: any,
  ) {
    return this.service.selectCustomerViewers(
      id,
      {
        userIds: dto.userIds,
        grantType: dto.grantType,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        canEdit: dto.canEdit,
        grantReason: dto.grantReason,
      },
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
    );
  }

  @Put(":id/viewers/cancel")
  async cancelCustomerViewer(
    @Param("id") id: string,
    @Body() dto: CancelCustomerViewerDto,
    @Req() req: any,
  ) {
    return this.service.cancelCustomerViewer(id, dto, {
      id: req.user?.id,
      name: req.user?.name,
      permissions: req.user?.permissions || [],
    });
  }

  @Put(":id/viewers/cancelAll")
  async cancelCustomerViewers(
    @Param("id") id: string,
    @Body() dto: CancelCustomerViewersDto,
    @Req() req: any,
  ) {
    const userIds = Array.isArray(dto.userIds)
      ? dto.userIds
      : String(dto.userIds || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    return this.service.cancelCustomerViewers(
      id,
      { userIds, reason: dto.reason },
      {
        id: req.user?.id,
        name: req.user?.name,
        permissions: req.user?.permissions || [],
      },
    );
  }

  @Get(":id/viewers/records")
  async getCustomerViewerRecords(
    @Param("id") id: string,
    @Query() query: QueryListDto,
    @Req() req: any,
  ) {
    return this.service.viewerRecords(id, query, {
      id: req.user?.id,
      name: req.user?.name,
      permissions: req.user?.permissions || [],
    });
  }

  @Post("grantViewAccess")
  async grantCustomerViewAccess(
    @Body() dto: GrantCustomerViewAccessDto,
    @Req() req: any,
  ) {
    const operatorId = req?.user?.id || "system";
    const operatorName = req?.user?.name || "system";
    return this.service.grantCustomerViewAccess(
      dto.customerId,
      dto.userIds,
      operatorId,
      operatorName,
      dto.permissions || [],
      {
        grantType: dto.grantType,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        canEdit: dto.canEdit,
        grantReason: dto.grantReason,
      },
    );
  }

  @Post("revokeViewAccess")
  async revokeCustomerViewAccess(
    @Body() dto: RevokeCustomerViewAccessDto,
    @Req() req: any,
  ) {
    const operatorId = req?.user?.id || "system";
    const operatorName = req?.user?.name || "system";
    return this.service.revokeCustomerViewAccess(
      dto.customerId,
      dto.userId,
      operatorId,
      operatorName,
      req.user?.permissions || [],
      { reason: dto.reason },
    );
  }

  @Post("updateViewerStatus")
  async updateViewerStatus(
    @Body() dto: UpdateViewerStatusDto,
    @Req() req: any,
  ) {
    const operatorId = req?.user?.id || "system";
    return this.service.updateViewerStatus(
      dto.customerId,
      dto.viewerIds,
      dto.status,
      operatorId,
    );
  }
}
