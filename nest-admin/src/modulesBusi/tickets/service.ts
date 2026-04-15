import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Like, Repository } from 'typeorm'
import { Ticket, TicketType, TicketStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { TicketDto } from './dto'
import { SysFileService } from 'src/modules/sys/file/service'
import { SaveDto } from 'src/common/dto'
import { User } from 'src/modules/users/entities/user.entity'

@Injectable()
export class TicketsService extends BaseService<Ticket, TicketDto> {
  constructor(
    @InjectRepository(Ticket) repository: Repository<Ticket>,
    private readonly sysFileService: SysFileService,
  ) {
    super(Ticket, repository)
  }

  private normalizeTicketPayload(dto: SaveDto<TicketDto> & { attachments?: string[] }) {
    if (typeof dto.attachments === 'string' && !dto.attachments) {
      dto.attachments = [] as any
    }
    if (dto.attachments != null && !Array.isArray(dto.attachments)) {
      dto.attachments = [dto.attachments].filter(Boolean) as any
    }
    return dto
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
    this.normalizeTicketPayload(dto)
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
    this.normalizeTicketPayload(dto)
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
    this.normalizeTicketPayload(dto)
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

  private mapUserSummary(user?: User | null) {
    if (!user) return null
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
    }
  }

  private mapProjectSummary(project?: any) {
    if (!project) return null
    return {
      id: project.id,
      code: project.code,
      name: project.name,
    }
  }

  private mapTaskSummary(task?: any) {
    if (!task) return null
    return {
      id: task.id,
      code: task.code,
      name: task.name,
    }
  }

  private buildTicketDetail(ticket: Ticket) {
    return {
      ...ticket,
      project: this.mapProjectSummary(ticket.project),
      task: this.mapTaskSummary(ticket.task),
      submitter: this.mapUserSummary(ticket.submitter),
      handler: this.mapUserSummary(ticket.handler),
    }
  }

  async getOne(query, isError = true): Promise<any | null> {
    const ticket = await super.getOne(
      {
        where: query,
        relations: ['project', 'task', 'submitter', 'handler'],
      },
      isError,
    )
    if (!ticket) return ticket
    return this.buildTicketDetail(ticket)
  }
}
