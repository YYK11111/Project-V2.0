import { IsNotEmpty, IsOptional, MaxLength, IsNumberString } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm'
import { User } from 'src/modules/users/entities/user.entity'

export enum FileStatus {
  Pending = '0',
  Associated = '1',
  Deleted = '2',
}

export const fileStatusMap = {
  [FileStatus.Pending]: '待关联',
  [FileStatus.Associated]: '已关联',
  [FileStatus.Deleted]: '已删除',
}

export enum BusinessType {
  Avatar = 'avatar',
  Project = 'project',
  Task = 'task',
  Ticket = 'ticket',
  Change = 'change',
  Document = 'document',
}

export const businessTypeMap = {
  [BusinessType.Avatar]: '用户头像',
  [BusinessType.Project]: '项目附件',
  [BusinessType.Task]: '任务附件',
  [BusinessType.Ticket]: '工单附件',
  [BusinessType.Change]: '变更附件',
  [BusinessType.Document]: '文档附件',
}

@MyEntity('sys_file')
@Index(['businessType', 'businessId'])
@Index(['status'])
export class SysFile extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ length: 255, name: 'original_name', comment: '原始文件名' })
  @IsNotEmpty({ message: '原始文件名不能为空' })
  originalName: string

  @BaseColumn({ length: 255, name: 'stored_name', comment: '存储文件名' })
  @IsNotEmpty({ message: '存储文件名不能为空' })
  storedName: string

  @BaseColumn({ length: 500, name: 'stored_path', comment: '存储路径' })
  @IsNotEmpty({ message: '存储路径不能为空' })
  storedPath: string

  @BaseColumn({ type: 'bigint', nullable: true, name: 'file_size', comment: '文件大小(字节)' })
  @IsOptional()
  fileSize: number

  @BaseColumn({ length: 100, nullable: true, name: 'mime_type', comment: 'MIME类型' })
  @IsOptional()
  mimeType: string

  @BaseColumn({ length: 50, nullable: true, name: 'business_type', comment: '业务类型' })
  @IsOptional()
  businessType: string

  @BaseColumn({ length: 36, nullable: true, name: 'business_id', comment: '关联业务ID' })
  @IsOptional()
  businessId: string

  @BaseColumn({ nullable: true, name: 'uploader_id', comment: '上传人ID' })
  @IsOptional()
  uploaderId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploader_id' })
  uploader: User

  @BaseColumn({ type: 'datetime', nullable: true, name: 'upload_time', comment: '上传时间' })
  @IsOptional()
  uploadTime: Date

  @BaseColumn({ type: 'tinyint', default: FileStatus.Pending, name: 'status', comment: '状态: 0-待关联, 1-已关联, 2-已删除' })
  @IsOptional()
  status: FileStatus

  @BaseColumn({ type: 'datetime', nullable: true, name: 'deleted_at', comment: '删除时间' })
  @IsOptional()
  deletedAt: Date
}