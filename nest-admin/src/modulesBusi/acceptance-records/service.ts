import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { AcceptanceRecordDto } from "./dto";
import { AcceptanceRecord, acceptanceRecordResultMap } from "./entity";
import { buildApprovalViewModel } from "src/modulesBusi/workflow/approval-view.helper";

@Injectable()
export class AcceptanceRecordsService extends BaseService<
  AcceptanceRecord,
  AcceptanceRecordDto
> {
  constructor(
    @InjectRepository(AcceptanceRecord)
    repository: Repository<AcceptanceRecord>,
  ) {
    super(AcceptanceRecord, repository);
  }

  async list(query: QueryListDto): Promise<ResponseListDto<AcceptanceRecord>> {
    const { title, projectId, result } = query;
    const queryOrm: FindManyOptions = {
      where: {
        title: this.sqlLike(title),
        projectId,
        result,
      },
      relations: ["project"],
      order: { createTime: "DESC" },
    };
    const listResult = await this.listBy(queryOrm, query);
    for (const row of listResult.list || []) {
      Object.assign(row, {
        approvalView: buildApprovalViewModel(row),
      });
    }
    return listResult;
  }

  async getOne(query, isError = true): Promise<any | null> {
    const record = await super.getOne(
      { where: query, relations: ["project"] },
      isError,
    );
    if (!record) return record;
    return {
      ...record,
      approvalView: buildApprovalViewModel(record),
    };
  }

  getResults() {
    return acceptanceRecordResultMap;
  }
}
