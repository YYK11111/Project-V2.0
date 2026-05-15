import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "src/common/http/module";
import { SystenConfigsModule } from "src/modules/configs/module";
import { UserExternalAccountsModule } from "../external-accounts/module";
import { ExternalMessageLog } from "./entity/external-message-log.entity";
import { ExternalNotifyService } from "./service";
import { FeishuNotifyProvider } from "./providers/feishu.provider";
import { DingTalkNotifyProvider } from "./providers/dingtalk.provider";

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalMessageLog]),
    HttpModule,
    SystenConfigsModule,
    UserExternalAccountsModule,
  ],
  providers: [ExternalNotifyService, FeishuNotifyProvider, DingTalkNotifyProvider],
  exports: [ExternalNotifyService],
})
export class ExternalNotifyModule {}
