import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Like, Repository } from 'typeorm'
import { Ticket, TicketType, TicketStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { TicketDto } from './dto'
import { SysFileService } from 'src/modules/sys/file/service'
import { SaveDto } from 'src/common/dto'

@Injectable()
export class TicketsService extends BaseService<Ticket, TicketDto> {
  constructor(
    @InjectRepository(Ticket) repository: Repository<Ticket>,
    private readonly sysFileService: SysFileService,
  ) {
    super(Ticket, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Ticket>> {
    let { title, type, status, projectId, taskId } = query
    let queryOrm: FindManyOptions = {
      where: {
        title: this.sqlLike(title),
        type,
        status,
        projectId,
        taskId,
      },
      relations: ['submitter', 'handler', 'project', 'task'],
    }
    return this.listBy(queryOrm, query)
  }

  async save(dto: SaveDto<TicketDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.save(dto)

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: 'ticket',
          businessId: saved.id,
          fileIds,
        })
      } else if (attachments.length === 0 && saved.id) {
        await this.sysFileService.associateFiles({
          businessType: 'ticket',
          businessId: saved.id,
          fileIds: [],
        })
      }
    }

    return result
  }

  async add(dto: SaveDto<TicketDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.add(dto)

    if (attachments !== undefined && attachments.length > 0) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: 'ticket',
          businessId: saved.id,
          fileIds,
        })
      }
    }

    return result
  }

  async update(dto: SaveDto<TicketDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.update(dto)

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      await this.sysFileService.associateFiles({
        businessType: 'ticket',
        businessId: saved.id,
        fileIds,
      })
    }

    return result
  }

  private async getFileIdsByPaths(paths: string[]): Promise<string[]> {
    if (!paths || paths.length === 0) return []
    const files = await this.sysFileService['repository'].find({
      where: { storedPath: In(paths) },
      select: ['id'],
    })
    return files.map((f) => f.id)
  }
}
