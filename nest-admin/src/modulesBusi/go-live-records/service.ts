import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { GoLiveRecordDto } from "./dto";
import { GoLiveRecord, goLiveRecordStatusMap } from "./entity";
import { buildApprovalViewModel } from "src/modulesBusi/workflow/approval-view.helper";

@Injectable()
export class GoLiveRecordsService extends BaseService<
  GoLiveRecord,
  GoLiveRecordDto
> {
  constructor(
    @InjectRepository(GoLiveRecord) repository: Repository<GoLiveRecord>,
  ) {
    super(GoLiveRecord, repository);
  }

  async list(query: QueryListDto): Promise<ResponseListDto<GoLiveRecord>> {
    const { title, projectId, status } = query;
    const queryOrm: FindManyOptions = {
      where: {
        title: this.sqlLike(title),
        projectId,
        status,
      },
      relations: ["project", "owner"],
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
      { where: query, relations: ["project", "owner"] },
      isError,
    );
    if (!record) return record;
    return {
      ...record,
      approvalView: buildApprovalViewModel(record),
    };
  }

  getStatuses() {
    return goLiveRecordStatusMap;
  }
}
