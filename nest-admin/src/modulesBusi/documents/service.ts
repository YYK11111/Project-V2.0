import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Like, Repository } from 'typeorm'
import { Document, DocumentType } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { DocumentDto } from './dto'

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
}
