import { Controller, Get, Param, Query } from "@nestjs/common";
import { BusinessApprovalContextService } from "./service";

@Controller("business/approval-contexts")
export class BusinessApprovalContextController {
  constructor(private readonly service: BusinessApprovalContextService) {}

  @Get()
  list(@Query() query: any) {
    if (query.rootBusinessType && query.rootBusinessId) {
      return this.service.findByRootBusiness(
        query.rootBusinessType,
        query.rootBusinessId,
      );
    }
    return this.service.findByBusiness(query.businessType, query.businessId);
  }

  @Get("by-instance/:instanceId")
  getByInstance(@Param("instanceId") instanceId: string) {
    return this.service.findByWorkflowInstance(instanceId);
  }
}
