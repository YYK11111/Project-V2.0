import { Injectable } from '@nestjs/common'
import { SystenConfigDto } from './dto'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Like, Repository, UpdateResult } from 'typeorm'
import { SystenConfig } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'

@Injectable()
export class SystenConfigsService extends BaseService<SystenConfig, SystenConfigDto> {
  constructor(@InjectRepository(SystenConfig) repository: Repository<SystenConfig>) {
    super(SystenConfig, repository)
  }

  async getSessionExpireMinutes() {
    const config = await this.repository.findOne({ where: { isDelete: null as any } as any, order: { createTime: 'DESC' as any } })
    const value = Number(config?.sessionExpireMinutes || 0)
    return Number.isFinite(value) && value > 0 ? value : 30
  }
}
