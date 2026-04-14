import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { User } from 'src/modules/users/entities/user.entity'
import { Task } from '../tasks/entity'

@MyEntity('task_comment')
export class TaskComment extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ nullable: true, name: 'task_id', comment: '任务ID' })
  taskId: string

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task

  @BaseColumn({ nullable: true, name: 'user_id', comment: '评论人ID' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @BaseColumn({ type: 'text', comment: '评论内容' })
  @IsNotEmpty({ message: '评论内容不能为空' })
  content: string

  @BaseColumn({ type: 'json', nullable: true, comment: '评论附件' })
  attachments: string[]

  @BaseColumn({ 
    type: 'char', 
    length: 1, 
    default: '0', 
    name: 'is_edited', 
    comment: '是否已编辑' 
  })
  isEdited: string
}