import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { HandoverRecordDto } from "./dto";
import { HandoverRecord, handoverRecordStatusMap } from "./entity";
import { buildApprovalViewModel } from "src/modulesBusi/workflow/approval-view.helper";

@Injectable()
export class HandoverRecordsService extends BaseService<
  HandoverRecord,
  HandoverRecordDto
> {
  constructor(
    @InjectRepository(HandoverRecord)
    repository: Repository<HandoverRecord>,
  ) {
    super(HandoverRecord, repository);
  }

  async list(query: QueryListDto): Promise<ResponseListDto<HandoverRecord>> {
    const { title, projectId, status } = query;
    const queryOrm: FindManyOptions = {
      where: {
        title: this.sqlLike(title),
        projectId,
        status,
      },
      relations: ["project"],
      order: { createTime: "DESC" },
    };
    const result = await this.listBy(queryOrm, query);
    for (const row of result.list || []) {
      Object.assign(row, {
        approvalView: buildApprovalViewModel(row),
      });
    }
    return result;
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

  getStatuses() {
    return handoverRecordStatusMap;
  }
}
