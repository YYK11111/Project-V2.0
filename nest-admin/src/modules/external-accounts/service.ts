import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QueryListDto } from "src/common/dto";
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

  async findActiveAccountByExternalIdentity(
    platform: ExternalAccountPlatform | string,
    identity: {
      externalUserId?: string;
      openId?: string;
      unionId?: string;
    },
  ) {
    if (!platform) return null;
    const baseWhere = {
      platform: String(platform) as ExternalAccountPlatform,
      bindStatus: ExternalAccountBindStatus.bound,
      isDelete: null as any,
    };
    const where = [
      identity.externalUserId
        ? {
            ...baseWhere,
            externalUserId: String(identity.externalUserId),
          }
        : null,
      identity.openId
        ? {
            ...baseWhere,
            openId: String(identity.openId),
          }
        : null,
      identity.unionId
        ? {
            ...baseWhere,
            unionId: String(identity.unionId),
          }
        : null,
    ].filter(Boolean);
    if (!where.length) return null;
    return this.repository.findOne({ where: where as any });
  }

  async list(query: QueryListDto) {
    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const qb = this.repository
      .createQueryBuilder("account")
      .where("account.isDelete IS NULL");

    if (query.platform) {
      qb.andWhere("account.platform = :platform", {
        platform: String(query.platform),
      });
    }
    if (query.userId) {
      qb.andWhere("account.userId = :userId", {
        userId: String(query.userId),
      });
    }
    if (query.bindStatus) {
      qb.andWhere("account.bindStatus = :bindStatus", {
        bindStatus: String(query.bindStatus),
      });
    }
    if (query.keyword) {
      qb.andWhere(
        "(account.externalUserId LIKE :keyword OR account.openId LIKE :keyword OR account.unionId LIKE :keyword OR account.name LIKE :keyword OR account.email LIKE :keyword OR account.mobile LIKE :keyword)",
        { keyword: `%${String(query.keyword)}%` },
      );
    }

    qb.orderBy("account.updateTime", "DESC").addOrderBy(
      "account.createTime",
      "DESC",
    );
    qb.skip((pageNum - 1) * pageSize).take(pageSize);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, _flag: true };
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
