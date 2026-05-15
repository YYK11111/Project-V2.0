import { Injectable } from "@nestjs/common";
import { UserExternalAccount } from "src/modules/external-accounts/entity";
import {
  ExternalNotifyConfig,
  ExternalNotifyProvider,
  NotifyMessage,
} from "../provider.interface";

@Injectable()
export class DingTalkNotifyProvider implements ExternalNotifyProvider {
  readonly platform = "dingtalk";

  isEnabled(_config?: ExternalNotifyConfig) {
    return false;
  }

  async sendText(
    _account: UserExternalAccount,
    _message: NotifyMessage,
    _config?: ExternalNotifyConfig,
  ) {
    throw new Error("钉钉通知暂未启用");
  }
}
