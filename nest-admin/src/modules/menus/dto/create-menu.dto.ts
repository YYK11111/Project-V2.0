import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { BoolNum } from 'src/common/type/base'
import { MenuType } from '../menu.entity'

export class CreateMenuDto {
  @IsOptional()
  @IsString()
  id?: string

  @IsString()
  @MaxLength(30)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  desc?: string

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string

  @IsOptional()
  @IsString()
  order?: string | number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  path?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  component?: string

  @IsOptional()
  @IsEnum(MenuType)
  type?: MenuType

  @IsOptional()
  @IsString()
  @MaxLength(100)
  permissionKey?: string

  @IsOptional()
  @IsEnum(BoolNum)
  isHidden?: BoolNum

  @IsOptional()
  @IsEnum(BoolNum)
  isActive?: BoolNum
}
