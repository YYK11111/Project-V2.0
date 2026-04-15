import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Like, Repository } from 'typeorm'
import { Document, DocumentType } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { DocumentDto } from './dto'
import { User } from 'src/modules/users/entities/user.entity'

@Injectable()
export class DocumentsService extends BaseService<Document, DocumentDto> {
  constructor(@InjectRepository(Document) repository: Repository<Document>) {
    super(Document, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Document>> {
    let { name, type, projectId } = query
    let queryOrm: FindManyOptions = {
      where: {
        name: this.sqlLike(name),
        type,
        projectId,
      },
      relations: ['uploader', 'project'],
    }
    return this.listBy(queryOrm, query)
  }

  /**
   * 升级文档版本
   */
  async upgradeVersion(id: string): Promise<any> {
    const document = await this.getOne({ id })
    const parts = document.version.split('.').map(Number)
    parts[parts.length - 1] += 1
    const newVersion = parts.join('.')
    return this.repository.update(id, { version: newVersion })
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

  async getOne(query, isError = true): Promise<any | null> {
    const document = await super.getOne(
      {
        where: query,
        relations: ['uploader', 'project'],
      },
      isError,
    )
    if (!document) return document

    return {
      ...document,
      project: this.mapProjectSummary(document.project),
      uploader: this.mapUserSummary(document.uploader),
    }
  }
}
