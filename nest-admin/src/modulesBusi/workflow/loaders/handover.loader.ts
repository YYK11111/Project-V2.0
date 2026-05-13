import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  BusinessDataLoader,
  BusinessData,
  FieldDefinition,
} from "./business-data-loader.interface";
import { HandoverRecord } from "src/modulesBusi/handover-records/entity";

@Injectable()
export class HandoverLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(HandoverRecord)
    private readonly repository: Repository<HandoverRecord>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = String(businessKey || "").replace("handover_", "");
    const row = await this.repository.findOne({ where: { id } as any });
    if (!row) throw new Error(`HandoverRecord not found: ${id}`);
    return {
      id,
      type: "handover",
      data: row,
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: "id", label: "交接单ID", type: "string" },
      { name: "title", label: "交接单标题", type: "string" },
      { name: "projectId", label: "所属项目ID", type: "string" },
      { name: "handoverTo", label: "接维对象", type: "string" },
      { name: "handoverDate", label: "交接日期", type: "date" },
      { name: "knowledgeReady", label: "知识准备完成", type: "string" },
      { name: "status", label: "状态", type: "string" },
    ];
  }
}
