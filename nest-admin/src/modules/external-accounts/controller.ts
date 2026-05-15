import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Permission } from "../auth/permission.decorator";
import { UserExternalAccountsService } from "./service";

@Controller("system/external-accounts")
export class UserExternalAccountsController {
  constructor(private readonly service: UserExternalAccountsService) {}

  @Get("user/:userId")
  @Permission("system/users/getOne")
  getUserAccount(
    @Param("userId") userId: string,
    @Query("platform") platform = "feishu",
  ) {
    return this.service.getActiveAccount(userId, platform);
  }

  @Post("save")
  @Permission("system/users/update")
  save(@Body() body: any) {
    return this.service.upsertManualAccount(body);
  }
}
