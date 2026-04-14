import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator'

export class TaskCommentDto {
  @IsNotEmpty({ message: '任务ID不能为空' })
  @IsString()
  taskId: string

  @IsNotEmpty({ message: '评论内容不能为空' })
  @IsString()
  content: string

  @IsOptional()
  @IsArray()
  attachments?: string[]
}

export class UpdateTaskCommentDto {
  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsArray()
  attachments?: string[]
}