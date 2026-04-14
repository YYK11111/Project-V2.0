import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { Project } from '../projects/entity'
import { User } from 'src/modules/users/entities/user.entity'

export enum SprintStatus {
  planning = '1',
  active = '2',
  completed = '3',
  cancelled = '4',
}

export const sprintStatusMap = {
  [SprintStatus.planning]: '计划中',
  [SprintStatus.active]: '进行中',
  [SprintStatus.completed]: '已完成',
  [SprintStatus.cancelled]: '已取消',
}

@MyEntity('sprint')
export class Sprint extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ length: 100 })
  @IsNotEmpty({ message: 'Sprint名称不能为空' })
  @MaxLength(100)
  name: string

  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @BaseColumn({ type: 'char', length: 1, default: SprintStatus.planning, name: 'status', comment: 'Sprint状态' })
  status: SprintStatus

  @BaseColumn({ type: 'text', nullable: true, comment: 'Sprint目标' })
  goal: string

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'start_date',
    comment: '开始日期',
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
    comment: '结束日期',
  })
  endDate: string

  @BaseColumn({ type: 'int', default: 0, comment: '团队容量（故事点或工时）' })
  capacity: number

  @BaseColumn({ type: 'int', default: 0, comment: '承诺的故事点' })
  committedPoints: number

  @BaseColumn({ type: 'int', default: 0, comment: '已完成的故事点' })
  completedPoints: number

  @BaseColumn({ type: 'int', default: 0, comment: '总故事点' })
  totalStoryPoints: number

  @BaseColumn({ type: 'int', default: 0, comment: '已完成故事点' })
  totalCompletedStoryPoints: number

  @BaseColumn({ type: 'int', default: 0, comment: '总任务数' })
  totalTaskCount: number

  @BaseColumn({ type: 'int', default: 0, comment: '已完成任务数' })
  completedTaskCount: number

  @BaseColumn({ type: 'int', default: 0, comment: '排序' })
  sort: number

  @BaseColumn({ nullable: true, name: 'scrum_master_id', comment: 'Scrum Master ID' })
  scrumMasterId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'scrum_master_id' })
  scrumMaster: User

  @BaseColumn({ type: 'text', nullable: true, comment: '回顾总结' })
  retrospective: string
}