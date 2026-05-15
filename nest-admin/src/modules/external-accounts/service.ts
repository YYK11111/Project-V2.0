import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ExternalAccountBindStatus,
  ExternalAccountPlatform,
  UserExternalAccount,
} from "./entity";

@Injectable()
export class UserExternalAccountsService {
  constructor(
    @InjectRepository(UserExternalAccount)
    private readonly repository: Repository<UserExternalAccount>,
  ) {}

  async getActiveAccount(
    userId: string,
    platform: ExternalAccountPlatform | string,
  ) {
    if (!userId || !platform) return null;
    return this.repository.findOne({
      where: {
        userId: String(userId),
        platform: String(platform) as ExternalAccountPlatform,
        bindStatus: ExternalAccountBindStatus.bound,
        isDelete: null as any,
      } as any,
    });
  }

  async upsertManualAccount(data: Partial<UserExternalAccount>) {
    const userId = String(data.userId || "");
    const platform = String(data.platform || "");
    if (!userId || !platform) {
      throw new Error("用户ID和外部平台不能为空");
    }
    const existing = await this.repository.findOne({
      where: {
        userId,
        platform: platform as ExternalAccountPlatform,
        isDelete: null as any,
      } as any,
    });
    const payload = {
      ...(existing || {}),
      ...data,
      userId,
      platform: platform as ExternalAccountPlatform,
      bindStatus: data.bindStatus || ExternalAccountBindStatus.bound,
      bindSource: data.bindSource || "manual",
    } as UserExternalAccount;
    return this.repository.save(payload);
  }
}
