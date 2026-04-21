import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BusinessDataLoader, BusinessData } from "./business-data-loader.interface";
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
      type: "acceptance",
      id,
      title: row.title,
      code: row.id,
      data: row,
    };
  }
}
