import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { HandoverRecordDto } from "./dto";
import { HandoverRecord, handoverRecordStatusMap } from "./entity";

@Injectable()
export class HandoverRecordsService extends BaseService<HandoverRecord, HandoverRecordDto> {
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
    return this.listBy(queryOrm, query);
  }

  getStatuses() {
    return handoverRecordStatusMap;
  }
}
