import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { Project } from '../entity'
import { Sprint } from '../../sprints/entity'
import { User } from 'src/modules/users/entities/user.entity'

export enum UserStoryType {
  epic = '1',
  story = '2',
  task = '3',
}

export const userStoryTypeMap = {
  [UserStoryType.epic]: '史诗',
  [UserStoryType.story]: '故事',
  [UserStoryType.task]: '任务',
}

export enum UserStoryStatus {
  backlog = '1',
  selected = '2',
  inProgress = '3',
  done = '4',
  accepted = '5',
  rejected = '6',
}

export const userStoryStatusMap = {
  [UserStoryStatus.backlog]: '待办',
  [UserStoryStatus.selected]: '已选定',
  [UserStoryStatus.inProgress]: '进行中',
  [UserStoryStatus.done]: '已完成',
  [UserStoryStatus.accepted]: '已验收',
  [UserStoryStatus.rejected]: '已拒绝',
}

@MyEntity('user_story')
export class UserStory extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ length: 200 })
  @IsNotEmpty({ message: '故事标题不能为空' })
  @MaxLength(200)
  title: string

  @BaseColumn({ type: 'text', nullable: true, comment: '故事描述（As a... I want... So that...）' })
  description: string

  @BaseColumn({ type: 'char', length: 1, default: UserStoryType.story, name: 'type', comment: '类型：1史诗 2故事 3任务' })
  type: UserStoryType

  @BaseColumn({ type: 'char', length: 1, default: UserStoryStatus.backlog, name: 'status', comment: '状态' })
  status: UserStoryStatus

  @BaseColumn({ type: 'int', default: 0, comment: '故事点' })
  storyPoints: number

  @BaseColumn({ length: 500, nullable: true, name: 'acceptance_criteria', comment: '验收标准' })
  acceptanceCriteria: string

  @BaseColumn({ type: 'int', default: 0, comment: '优先级（数字越小优先级越高）' })
  priority: number

  @BaseColumn({ nullable: true, name: 'sprint_id', comment: '所属Sprint ID' })
  sprintId: string

  @ManyToOne(() => Sprint)
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint

  @BaseColumn({ nullable: true, name: 'parent_id', comment: '父故事ID（用于史诗分解）' })
  parentId: string

  @ManyToOne(() => UserStory)
  @JoinColumn({ name: 'parent_id' })
  parent: UserStory

  @BaseColumn({ nullable: true, name: 'assignee_id', comment: '负责人ID' })
  assigneeId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignee_id' })
  assignee: User

  @BaseColumn({ nullable: true, name: 'reporter_id', comment: '报告人ID' })
  reporterId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User

  @BaseColumn({ nullable: true, name: 'project_id', comment: '关联项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'estimated_date',
    comment: '预估完成日期',
  })
  estimatedDate: string

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
}