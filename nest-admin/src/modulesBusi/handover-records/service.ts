import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { HandoverRecordDto } from "./dto";
import { HandoverRecord, handoverRecordStatusMap } from "./entity";

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

  buildApprovalViewModel(entity?: {
    approvalStatus?: string | null;
    currentNodeName?: string | null;
  }) {
    const approvalStatus = String(entity?.approvalStatus || "0");
    const currentNodeName = String(entity?.currentNodeName || "");
    const isReturned =
      approvalStatus === "3" && currentNodeName.includes("退回发起人");

    if (isReturned) {
      return {
        status: "returned",
        label: "已退回发起人",
        currentNodeName,
        canSubmit: false,
        canResubmit: true,
      };
    }

    const statusMap = {
      "0": {
        status: "none",
        label: "无需审批",
        canSubmit: true,
        canResubmit: false,
      },
      "1": {
        status: "pending",
        label: "审批中",
        canSubmit: false,
        canResubmit: false,
      },
      "2": {
        status: "approved",
        label: "已通过",
        canSubmit: false,
        canResubmit: false,
      },
      "3": {
        status: "rejected",
        label: "已驳回",
        canSubmit: false,
        canResubmit: true,
      },
    } as const;

    return {
      ...(statusMap[approvalStatus as keyof typeof statusMap] || {
        status: "none",
        label: "无需审批",
        canSubmit: true,
        canResubmit: false,
      }),
      currentNodeName,
    };
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
        approvalView: this.buildApprovalViewModel(row),
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
      approvalView: this.buildApprovalViewModel(record),
    };
  }

  getStatuses() {
    return handoverRecordStatusMap;
  }
}
