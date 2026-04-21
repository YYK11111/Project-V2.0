import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import dayjs from "dayjs";
import { ArticleSearchRecord } from "./entity";

@Injectable()
export class ArticleSearchRecordsService {
  constructor(
    @InjectRepository(ArticleSearchRecord)
    private repository: Repository<ArticleSearchRecord>,
  ) {}

  async recordKeyword(keyword: string, currentUser?: Record<string, any>) {
    const normalizedKeyword = String(keyword || "").trim();
    if (!normalizedKeyword) return null;

    const existing = await this.repository.findOne({
      where: { keyword: normalizedKeyword },
    });
    const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
    if (existing) {
      existing.count = Number(existing.count || 0) + 1;
      existing.lastSearchTime = now;
      existing.userId = currentUser?.id
        ? String(currentUser.id)
        : existing.userId;
      return this.repository.save(existing);
    }

    return this.repository.save(
      new ArticleSearchRecord({
        keyword: normalizedKeyword,
        count: 1,
        userId: currentUser?.id ? String(currentUser.id) : "",
        lastSearchTime: now,
      }),
    );
  }

  async getHotKeywords(limit = 10) {
    const list = await this.repository.find({
      order: {
        count: "DESC",
        lastSearchTime: "DESC",
        updateTime: "DESC",
      },
      take: limit,
    });
    return list.map((item) => item.keyword).filter(Boolean);
  }
}
