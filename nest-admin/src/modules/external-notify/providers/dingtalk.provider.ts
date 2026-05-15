import { Injectable } from "@nestjs/common";
import { UserExternalAccount } from "src/modules/external-accounts/entity";
import { ExternalNotifyProvider, NotifyMessage } from "../provider.interface";

@Injectable()
export class DingTalkNotifyProvider implements ExternalNotifyProvider {
  readonly platform = "dingtalk";

  isEnabled() {
    return process.env.DINGTALK_ENABLED === "true";
  }

  async sendText(_account: UserExternalAccount, _message: NotifyMessage) {
    throw new Error("钉钉通知暂未启用");
  }
}
