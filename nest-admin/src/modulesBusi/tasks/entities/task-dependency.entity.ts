import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import { Task } from '../entity'

// 依赖类型枚举
export enum DependencyType {
  finish_to_start = '1',  // 完成-开始（默认）
  start_to_start = '2',   // 开始-开始
  finish_to_finish = '3',  // 完成-完成
  start_to_finish = '4',   // 开始-完成
}

export const dependencyTypeMap = {
  [DependencyType.finish_to_start]: '完成-开始',
  [DependencyType.start_to_start]: '开始-开始',
  [DependencyType.finish_to_finish]: '完成-完成',
  [DependencyType.start_to_finish]: '开始-完成',
}

@Entity('task_dependency')
export class TaskDependency extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @Column({ name: 'task_id', comment: '当前任务ID' })
  taskId: number

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task

  @Column({ name: 'dependency_id', comment: '依赖的任务ID' })
  dependencyId: number

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dependency_id' })
  dependency: Task

  @Column({ type: 'char', length: 1, default: '1', name: 'dependency_type', comment: '依赖类型' })
  dependencyType: string

  @Column({ type: 'int', default: 0, name: 'lag_days', comment: '延迟天数（正数表示延迟，负数表示提前）' })
  lagDays: number
}