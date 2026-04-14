import { IsArray, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator'
import { BoolNum } from 'src/common/type/base'

export class SaveRoleDto {
  @IsOptional()
  @IsString()
  id?: string

  @IsString()
  name: string

  @IsString()
  permissionKey: string

  @IsOptional()
  @IsArray()
  menuIds?: Array<string>

  @IsOptional()
  @IsEnum(BoolNum)
  isActive?: BoolNum

  @IsOptional()
  @IsString()
  order?: string

  @IsOptional()
  @IsString()
  remark?: string
}

export class ListRoleDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  permissionKey?: string

  @IsOptional()
  @IsEnum(BoolNum)
  isActive?: BoolNum

  @IsOptional()
  @IsString()
  id?: string

  pageNum?: number
  pageSize?: number
}

export class AuthUserCancelDto {
  @IsString()
  roleId: string

  @IsString()
  userId: string

  @IsOptional()
  permissions?: string[]
}

export class AuthUserCancelAllDto {
  @IsString()
  roleId: string

  @IsString()
  userIds: string

  @IsOptional()
  permissions?: string[]
}

export class AuthUserSelectAllDto {
  @IsString()
  roleId: string

  @IsString()
  userIds: string

  @IsOptional()
  permissions?: string[]
}
