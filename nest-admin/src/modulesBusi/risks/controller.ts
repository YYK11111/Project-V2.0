import { Controller, Get, Post, Body, Param, Req, Query } from "@nestjs/common";
import { QueryListDto } from "src/common/dto";
import { RisksService } from "./service";
import { QueryRiskDto } from "./dto";
import { Risk, riskStatusMap, riskLevelMap, riskCategoryMap } from "./entity";
import { BaseController } from "src/common/BaseController";

@Controller("business/risks")
export class RisksController extends BaseController<Risk, RisksService> {
  constructor(readonly service: RisksService) {
    super(service);
  }

  @Get("getStatus")
  getStatus() {
    return riskStatusMap;
  }

  @Get("getLevel")
  getLevel() {
    return riskLevelMap;
  }

  @Get("getCategory")
  getCategory() {
    return riskCategoryMap;
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

  @Post("resolve/:id")
  resolve(@Param("id") id: string) {
    return this.service.resolve(id);
  }

  @Post(":id/publish-knowledge")
  publishKnowledge(@Param("id") id: string, @Req() req: any) {
    return this.service.publishToKnowledge(id, {
      id: req.user?.id,
      name: req.user?.name,
    });
  }

  @Post(":id/convert-to-task")
  convertToTask(@Param("id") id: string, @Req() req: any) {
    return this.service.convertToTask(id, {
      id: req.user?.id,
      name: req.user?.name,
    });
  }
}
