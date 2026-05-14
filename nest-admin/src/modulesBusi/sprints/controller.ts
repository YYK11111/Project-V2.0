import { Body, Controller, Get, Post, Param, Query, Req } from "@nestjs/common";
import { SprintsService } from "./service";
import { Sprint, sprintStatusMap } from "./entity";
import { BaseController } from "src/common/BaseController";
import { QueryListDto } from "src/common/dto";

@Controller("business/sprints")
export class SprintsController extends BaseController<Sprint, SprintsService> {
  constructor(readonly service: SprintsService) {
    super(service);
  }

  @Get("getStatus")
  getStatus() {
    return sprintStatusMap;
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

  @Get(":id/burndown")
  async getBurndown(@Param("id") id: string) {
    return this.service.getBurndown(id);
  }

  @Get(":id/velocity")
  async getVelocity(@Param("id") id: string) {
    return this.service.getVelocity(id);
  }

  @Post(":id/start")
  async startSprint(@Param("id") id: string, @Req() req: any) {
    return this.service.startSprint(
      id,
      req.user?.id || req.user?.name,
      req.user?.permissions || [],
    );
  }

  @Post(":id/complete")
  async completeSprint(
    @Param("id") id: string,
    @Body() body?: { carryOverMode?: "backlog" },
    @Req() req?: any,
  ) {
    return this.service.completeSprint(
      id,
      body,
      req.user?.id || req.user?.name,
      req.user?.permissions || [],
    );
  }
}
