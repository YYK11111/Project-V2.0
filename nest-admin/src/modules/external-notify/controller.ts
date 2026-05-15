import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import { Permission } from "../auth/permission.decorator";
import { ExternalNotifyService } from "./service";

@Controller("system/external-notify")
export class ExternalNotifyController {
  constructor(private readonly service: ExternalNotifyService) {}

  @Post("feishu/test")
  @Permission("system/configs/update")
  testFeishu(@Req() req: any, @Body() body: any) {
    return this.service.sendFeishuTestMessage(
      String(body?.userId || req.user?.id || ""),
    );
  }

  @Post("feishu/sync-user/:userId")
  @Permission("system/users/update")
  syncFeishuUser(@Param("userId") userId: string) {
    return this.service.syncFeishuAccount(userId);
  }

  @Post("feishu/sync-users")
  @Permission("system/users/update")
  syncFeishuUsers(@Body() body: any) {
    return this.service.syncFeishuAccounts({ limit: body?.limit });
  }
}
