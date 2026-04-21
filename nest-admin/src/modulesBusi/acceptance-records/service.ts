import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { AcceptanceRecordDto } from "./dto";
import { AcceptanceRecord, acceptanceRecordResultMap } from "./entity";

@Injectable()
export class AcceptanceRecordsService extends BaseService<AcceptanceRecord, AcceptanceRecordDto> {
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
    return this.listBy(queryOrm, query);
  }

  getResults() {
    return acceptanceRecordResultMap;
  }
}
