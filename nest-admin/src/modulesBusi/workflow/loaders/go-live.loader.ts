import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  BusinessDataLoader,
  BusinessData,
  FieldDefinition,
} from "./business-data-loader.interface";
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
      id,
      type: "goLive",
      data: row,
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: "id", label: "上线单ID", type: "string" },
      { name: "title", label: "上线单标题", type: "string" },
      { name: "projectId", label: "所属项目ID", type: "string" },
      { name: "plannedGoLiveTime", label: "计划上线日期", type: "date" },
      { name: "actualGoLiveTime", label: "实际上线日期", type: "date" },
      { name: "status", label: "状态", type: "string" },
    ];
  }
}
