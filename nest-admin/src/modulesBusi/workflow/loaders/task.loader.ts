import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Task, priorityMap, taskStatusMap } from '../../tasks/entity'
import { User } from '../../../modules/users/entities/user.entity'
import { BusinessData, BusinessDataLoader, FieldDefinition } from './business-data-loader.interface'

@Injectable()
export class TaskLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = businessKey.replace('task_', '')
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['project', 'sprint', 'leader'],
    })

    if (!task) {
      throw new Error(`Task not found: ${id}`)
    }

    const executors = task.executorIds?.length
      ? await this.userRepo.find({ where: task.executorIds.map((executorId) => ({ id: executorId })) })
      : []

    return {
      id: task.id,
      type: 'task',
      data: {
        id: task.id,
        name: task.name,
        code: task.code,
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        description: task.description,
        startDate: task.startDate,
        endDate: task.endDate,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        remainingHours: task.remainingHours,
        acceptanceCriteria: task.acceptanceCriteria,
        storyPoints: task.storyPoints,
        project: task.project
          ? {
              id: task.project.id,
              name: task.project.name,
              code: task.project.code,
            }
          : null,
        sprint: task.sprint
          ? {
              id: task.sprint.id,
              name: task.sprint.name,
            }
          : null,
        leader: task.leader
          ? {
              id: task.leader.id,
              nickname: task.leader.nickname,
              name: task.leader.name,
              deptId: task.leader.deptId,
            }
          : null,
        executorIds: task.executorIds || [],
        executors: executors.map((user) => ({
          id: user.id,
          nickname: user.nickname,
          name: user.name,
          deptId: user.deptId,
        })),
      },
    }
  }

  getFields(): FieldDefinition[] {
    return [
      { name: 'id', label: '任务ID', type: 'string' },
      { name: 'name', label: '任务名称', type: 'string' },
      { name: 'code', label: '任务编号', type: 'string' },
      { name: 'status', label: '任务状态', type: 'enum', enumValues: Object.entries(taskStatusMap).map(([value, label]) => ({ value, label })) },
      { name: 'priority', label: '任务优先级', type: 'enum', enumValues: Object.entries(priorityMap).map(([value, label]) => ({ value, label })) },
      { name: 'progress', label: '任务进度', type: 'number' },
      { name: 'startDate', label: '开始日期', type: 'date' },
      { name: 'endDate', label: '截止日期', type: 'date' },
      { name: 'leader.id', label: '任务负责人', type: 'string' },
      { name: 'leader.deptId', label: '任务负责人部门', type: 'string' },
      { name: 'executorIds', label: '任务经办人', type: 'array' },
    ]
  }
}
