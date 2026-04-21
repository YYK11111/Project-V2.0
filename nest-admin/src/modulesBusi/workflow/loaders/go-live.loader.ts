import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BusinessDataLoader, BusinessData } from "./business-data-loader.interface";
import { GoLiveRecord } from "src/modulesBusi/go-live-records/entity";

@Injectable()
export class GoLiveLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(GoLiveRecord)
    private readonly repository: Repository<GoLiveRecord>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = String(businessKey || "").replace("goLive_", "");
    const row = await this.repository.findOne({ where: { id } as any });
    if (!row) throw new Error(`GoLiveRecord not found: ${id}`);
    return {
      type: "goLive",
      id,
      title: row.title,
      code: row.id,
      data: row,
    };
  }
}
