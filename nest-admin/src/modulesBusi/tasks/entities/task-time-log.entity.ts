import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import { Task } from '../entity'
import { User } from 'src/modules/users/entities/user.entity'

@Entity('task_time_log')
export class TaskTimeLog extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @Column({ name: 'task_id', comment: '任务ID' })
  taskId: number

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '工时（小时）' })
  hours: number

  @Column({ type: 'text', nullable: true, comment: '工作内容描述' })
  description: string

  @Column({ type: 'json', nullable: true, comment: '汇报附件' })
  attachments: string[]

  @Column({ type: 'date', name: 'work_date', comment: '工作日期' })
  workDate: string

  @Column({ name: 'user_id', comment: '用户ID' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
