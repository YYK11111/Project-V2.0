import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BusinessDataLoader, BusinessData, FieldDefinition } from "./business-data-loader.interface";
import { AcceptanceRecord } from "src/modulesBusi/acceptance-records/entity";

@Injectable()
export class AcceptanceLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(AcceptanceRecord)
    private readonly repository: Repository<AcceptanceRecord>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = String(businessKey || "").replace("acceptance_", "");
    const row = await this.repository.findOne({ where: { id } as any });
    if (!row) throw new Error(`AcceptanceRecord not found: ${id}`);
    return {
      id,
      type: "acceptance",
      data: row,
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: "id", label: "验收单ID", type: "string" },
      { name: "title", label: "验收单标题", type: "string" },
      { name: "projectId", label: "所属项目ID", type: "string" },
      { name: "acceptanceDate", label: "验收日期", type: "date" },
      { name: "customerApprover", label: "客户验收人", type: "string" },
      { name: "result", label: "验收结果", type: "string" },
    ];
  }
}
