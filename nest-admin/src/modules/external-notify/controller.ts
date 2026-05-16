import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { Permission } from "../auth/permission.decorator";
import { ExternalNotifyService } from "./service";

@Controller("system/external-notify")
export class ExternalNotifyController {
  constructor(private readonly service: ExternalNotifyService) {}

  @Get("logs")
  @Permission("system/externalNotifyLogs/list")
  listLogs(@Query() query: any) {
    return this.service.listLogs(query);
  }

  @Get("logs/trace/:messageId")
  @Permission("system/externalNotifyLogs/list")
  traceLogs(@Param("messageId") messageId: string) {
    return this.service.getMessageTrace(messageId);
  }

  @Get("feishu/compensation-status")
  @Permission("system/externalNotifyLogs/list")
  feishuCompensationStatus() {
    return this.service.getFeishuCompensationStatus();
  }

  @Post("feishu/test")
  @Permission("system/configs/update")
  testFeishu(@Req() req: any, @Body() body: any) {
    return this.service.sendFeishuTestMessage(
      String(body?.userId || req.user?.id || ""),
    );
  }

  @Post("feishu/diagnose")
  @Permission("system/configs/update")
  diagnoseFeishu(@Req() req: any, @Body() body: any) {
    return this.service.diagnoseFeishuConfig(
      String(body?.userId || req.user?.id || ""),
    );
  }

  @Post("feishu/sync-user/:userId")
  @Permission("system/externalAccounts/update")
  syncFeishuUser(@Param("userId") userId: string) {
    return this.service.syncFeishuAccount(userId);
  }

  @Post("feishu/sync-users")
  @Permission("system/externalAccounts/update")
  syncFeishuUsers(@Body() body: any) {
    return this.service.syncFeishuAccounts({ limit: body?.limit });
  }
}
