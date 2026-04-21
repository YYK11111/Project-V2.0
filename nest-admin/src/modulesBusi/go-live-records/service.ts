import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { GoLiveRecordDto } from "./dto";
import { GoLiveRecord, goLiveRecordStatusMap } from "./entity";

@Injectable()
export class GoLiveRecordsService extends BaseService<GoLiveRecord, GoLiveRecordDto> {
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
    return this.listBy(queryOrm, query);
  }

  getStatuses() {
    return goLiveRecordStatusMap;
  }
}
