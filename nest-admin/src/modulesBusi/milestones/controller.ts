import { Controller, Get, Post, Body, Param, Query, Req } from "@nestjs/common";
import { MilestonesService } from "./service";
import { QueryMilestoneDto } from "./dto";
import { Milestone, milestoneStatusMap } from "./entity";
import { BaseController } from "src/common/BaseController";

@Controller("business/milestones")
export class MilestonesController extends BaseController<
  Milestone,
  MilestonesService
> {
  constructor(readonly service: MilestonesService) {
    super(service);
  }

  @Get("getStatus")
  getStatus() {
    return milestoneStatusMap;
  }

  @Get("list")
  async list(@Query() query: QueryMilestoneDto, @Req() req: any) {
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

  @Post("status/:id")
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Req() req: any,
  ) {
    return this.service.updateStatus(
      id,
      status as any,
      req.user?.id || req.user?.name,
    );
  }
}
