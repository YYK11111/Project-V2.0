import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { Project } from '../projects/entity'
import { User } from 'src/modules/users/entities/user.entity'

export enum MilestoneStatus {
  pending = '1',
  completed = '2',
  delayed = '3',
  cancelled = '4',
}

export const milestoneStatusMap = {
  [MilestoneStatus.pending]: '待完成',
  [MilestoneStatus.completed]: '已完成',
  [MilestoneStatus.delayed]: '已延期',
  [MilestoneStatus.cancelled]: '已取消',
}

@MyEntity('milestone')
export class Milestone extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ length: 100 })
  @IsNotEmpty({ message: '里程碑名称不能为空' })
  @MaxLength(100)
  name: string

  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @BaseColumn({ type: 'text', nullable: true, comment: '里程碑描述' })
  description: string

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'due_date',
    comment: '计划完成日期',
  })
  dueDate: string

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'completed_date',
    comment: '实际完成日期',
  })
  completedDate: string

  @BaseColumn({ type: 'char', length: 1, default: MilestoneStatus.pending, name: 'status', comment: '状态' })
  status: MilestoneStatus

  @BaseColumn({ type: 'int', default: 0, comment: '关联任务数' })
  taskCount: number

  @BaseColumn({ type: 'int', default: 0, comment: '已完成任务数' })
  completedTaskCount: number

  @BaseColumn({ type: 'int', nullable: true, name: 'creator_id', comment: '创建人ID' })
  creatorId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User

  @BaseColumn({ type: 'json', nullable: true, comment: '交付物清单' })
  deliverables: string[]

  @BaseColumn({ type: 'int', default: 0, comment: '排序' })
  sort: number
}