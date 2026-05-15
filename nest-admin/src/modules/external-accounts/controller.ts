import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Permission } from "../auth/permission.decorator";
import { UserExternalAccountsService } from "./service";

@Controller("system/external-accounts")
export class UserExternalAccountsController {
  constructor(private readonly service: UserExternalAccountsService) {}

  @Get("list")
  @Permission("system/externalAccounts/list")
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get("user/:userId")
  @Permission("system/users/getOne")
  getUserAccount(
    @Param("userId") userId: string,
    @Query("platform") platform = "feishu",
  ) {
    return this.service.getActiveAccount(userId, platform);
  }

  @Post("save")
  @Permission("system/externalAccounts/update")
  save(@Body() body: any) {
    return this.service.upsertManualAccount(body);
  }
}
