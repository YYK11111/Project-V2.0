import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Repository } from 'typeorm'
import { ProjectChange, ChangeStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { CreateChangeDto } from './dto'
import { SysFileService } from 'src/modules/sys/file/service'
import { SaveDto } from 'src/common/dto'

@Injectable()
export class ChangesService extends BaseService<ProjectChange, CreateChangeDto> {
  constructor(
    @InjectRepository(ProjectChange) repository: Repository<ProjectChange>,
    private readonly sysFileService: SysFileService,
  ) {
    super(ProjectChange, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<ProjectChange>> {
    let { projectId, status, type, name } = query
    let queryOrm: FindManyOptions = {
      where: {
        title: this.sqlLike(name),
        projectId,
        status,
        type,
      },
      relations: ['project', 'requester', 'approver'],
      order: { sort: 'ASC', createTime: 'DESC' },
    }
    return this.listBy(queryOrm, query)
  }

  async approve(id: string, approverId: string, comment: string): Promise<any> {
    return this.repository.update(id, {
      status: ChangeStatus.approved,
      approverId,
      approvalComment: comment,
      approvalDate: new Date().toISOString().split('T')[0],
    })
  }

  async reject(id: string, approverId: string, comment: string): Promise<any> {
    return this.repository.update(id, {
      status: ChangeStatus.rejected,
      approverId,
      approvalComment: comment,
      approvalDate: new Date().toISOString().split('T')[0],
    })
  }

  async save(dto: SaveDto<CreateChangeDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.save(dto as any)

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: 'change',
          businessId: saved.id,
          fileIds,
        })
      } else if (attachments.length === 0 && saved.id) {
        await this.sysFileService.associateFiles({
          businessType: 'change',
          businessId: saved.id,
          fileIds: [],
        })
      }
    }

    return result
  }

  async add(dto: SaveDto<CreateChangeDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.add(dto as any)

    if (attachments !== undefined && attachments.length > 0) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: 'change',
          businessId: saved.id,
          fileIds,
        })
      }
    }

    return result
  }

  async update(dto: SaveDto<CreateChangeDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.update(dto as any)

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      await this.sysFileService.associateFiles({
        businessType: 'change',
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