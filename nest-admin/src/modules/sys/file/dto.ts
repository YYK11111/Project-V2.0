import { IsNotEmpty, IsOptional, MaxLength, IsNumberString, IsArray } from 'class-validator'
import { QueryListDto } from 'src/common/dto'

export class CreateFileDto {
  @IsNotEmpty({ message: '原始文件名不能为空' })
  @MaxLength(255)
  originalName: string

  @IsNotEmpty({ message: '存储文件名不能为空' })
  @MaxLength(255)
  storedName: string

  @IsNotEmpty({ message: '存储路径不能为空' })
  @MaxLength(500)
  storedPath: string

  @IsOptional()
  fileSize?: number

  @IsOptional()
  @MaxLength(100)
  mimeType?: string

  @IsOptional()
  @MaxLength(50)
  businessType?: string

  @IsOptional()
  @MaxLength(36)
  businessId?: string

  @IsOptional()
  @MaxLength(36)
  uploaderId?: string

  @IsOptional()
  status?: string
}

export type QueryFileDto = {
  businessType?: string
  businessId?: string
  status?: string
} & QueryListDto

export class AssociateFileDto {
  @IsNotEmpty({ message: '业务类型不能为空' })
  businessType: string

  @IsNotEmpty({ message: '业务ID不能为空' })
  businessId: string

  @IsArray()
  @IsNotEmpty({ message: '文件ID列表不能为空' })
  fileIds: string[]
}

export type CleanupResultDto = {
  deletedCount: number
  totalSize: number
  details: string[]
}