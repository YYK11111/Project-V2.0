import { IsNotEmpty, MaxLength, IsOptional, IsInt } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm'
import { User } from 'src/modules/users/entities/user.entity'
import { Project } from '../projects/entity'
import { TaskDependency } from './entities/task-dependency.entity'
import { TaskTimeLog } from './entities/task-time-log.entity'
import { Sprint } from '../sprints/entity'

// 任务状态枚举
export enum TaskStatus {
  pending = '1',
  inProgress = '2',
  completed = '3',
  rejected = '4',
  deferred = '5',
}

export const taskStatusMap = {
  [TaskStatus.pending]: '待处理',
  [TaskStatus.inProgress]: '处理中',
  [TaskStatus.completed]: '已完成',
  [TaskStatus.rejected]: '已驳回',
  [TaskStatus.deferred]: '暂缓',
}

// 优先级枚举
export enum Priority {
  low = '1',
  medium = '2',
  high = '3',
}

export const priorityMap = {
  [Priority.low]: '低',
  [Priority.medium]: '中',
  [Priority.high]: '高',
}

@MyEntity('task')
export class Task extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @BaseColumn({ nullable: true, name: 'sprint_id', comment: '所属Sprint ID' })
  sprintId: string

  @ManyToOne(() => Sprint)
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint

  @BaseColumn({ length: 100 })
  @IsNotEmpty({ message: '任务名称不能为空' })
  @MaxLength(100)
  name: string

  @BaseColumn({ length: 50, nullable: true, comment: '任务编号' })
  code: string

  @BaseColumn({ nullable: true, name: 'leader_id', comment: '负责人ID' })
  leaderId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'leader_id' })
  leader: User

  @BaseColumn({ type: 'json', nullable: true, name: 'executor_ids', comment: '经办人ID数组' })
  executorIds: string[]

  /** 经办人详情（非持久化） */
  executors?: User[]

  @BaseColumn({ nullable: true, name: 'parent_id', comment: '父任务ID' })
  parentId: string

  @ManyToOne(() => Task, (task) => task.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Task

  @OneToMany(() => Task, (task) => task.parent)
  children: Task[]

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'start_date',
    comment: '开始时间',
  })
  startDate: string

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'end_date',
    comment: '截止时间',
  })
  endDate: string

  @BaseColumn({ type: 'char', length: 1, default: TaskStatus.pending, name: 'status', comment: '任务状态' })
  status: TaskStatus

  @BaseColumn({ type: 'char', length: 1, default: Priority.medium, name: 'priority', comment: '优先级' })
  priority: Priority

  @BaseColumn({ type: 'int', default: 0, comment: '进度（0-100）' })
  progress: number

  @BaseColumn({ type: 'longtext', nullable: true, comment: '任务描述' })
  description: string

  @BaseColumn({ type: 'json', nullable: true, comment: '任务附件' })
  attachments: string[]

  // ==================== P0 扩展字段 ====================

  @BaseColumn({ type: 'int', nullable: true, comment: '预估工时（小时）' })
  estimatedHours: number

  @BaseColumn({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '实际工时（小时）' })
  actualHours: number

  @BaseColumn({ type: 'int', nullable: true, comment: '剩余工时（小时）' })
  remainingHours: number

  @BaseColumn({ type: 'longtext', nullable: true, comment: '验收标准' })
  acceptanceCriteria: string

  @BaseColumn({ type: 'int', nullable: true, comment: '故事点' })
  storyPoints: number

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '工作流实例ID' })
  workflowInstanceId: string

  @BaseColumn({ type: 'char', length: 1, default: '0', comment: '审批状态: 0无需审批 1审批中 2已通过 3已驳回' })
  approvalStatus: string

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '当前审批节点名称' })
  currentNodeName: string

  // 工时记录
  @OneToMany(() => TaskTimeLog, (timelog) => timelog.task)
  timeLogs: TaskTimeLog[]
}
