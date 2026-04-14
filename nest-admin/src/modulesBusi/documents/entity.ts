import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { User } from 'src/modules/users/entities/user.entity'
import { Project } from '../projects/entity'

// 文档类型枚举
export enum DocumentType {
  richText = '1',
  file = '2',
}

export const documentTypeMap = {
  [DocumentType.richText]: '富文本',
  [DocumentType.file]: '文件',
}

@MyEntity('document')
export class Document extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @BaseColumn({ length: 100 })
  @IsNotEmpty({ message: '文档名称不能为空' })
  @MaxLength(100)
  name: string

  @BaseColumn({ type: 'char', length: 1, default: DocumentType.richText, name: 'type', comment: '文档类型' })
  type: DocumentType

  @BaseColumn({ type: 'text', nullable: true, comment: '富文本内容' })
  content: string

  @BaseColumn({ length: 255, nullable: true, name: 'file_url', comment: '文件路径' })
  fileUrl: string

  @BaseColumn({ type: 'int', nullable: true, name: 'file_size', comment: '文件大小（KB）' })
  fileSize: number

  @BaseColumn({ length: 20, default: '1.0.0', comment: '版本号' })
  version: string

  @BaseColumn({ nullable: true, name: 'uploader_id', comment: '上传人ID' })
  uploaderId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploader_id' })
  uploader: User
}
