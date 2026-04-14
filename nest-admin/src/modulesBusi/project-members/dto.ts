import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator'
import { ProjectMemberRole } from './entity'

export class ProjectMemberDto {
  @IsNotEmpty({ message: '项目ID不能为空' })
  @IsString()
  projectId: string

  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsString()
  userId: string

  @IsOptional()
  @IsEnum(ProjectMemberRole, { message: '角色值无效' })
  role?: ProjectMemberRole

  @IsOptional()
  @IsString()
  isCore?: string

  @IsOptional()
  @IsString()
  remark?: string

  @IsOptional()
  sort?: number
}

export class UpdateProjectMemberDto {
  @IsOptional()
  @IsEnum(ProjectMemberRole, { message: '角色值无效' })
  role?: ProjectMemberRole

  @IsOptional()
  @IsString()
  isActive?: string

  @IsOptional()
  @IsString()
  isCore?: string

  @IsOptional()
  @IsString()
  remark?: string

  @IsOptional()
  sort?: number
}
