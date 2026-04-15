import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { Sprint, SprintStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { CreateSprintDto } from './dto'
import { Task, TaskStatus } from '../tasks/entity'
import { User } from 'src/modules/users/entities/user.entity'

@Injectable()
export class SprintsService extends BaseService<Sprint, CreateSprintDto> {
  constructor(
    @InjectRepository(Sprint) repository: Repository<Sprint>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
  ) {
    super(Sprint, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Sprint>> {
    let { projectId, status, name } = query
    let queryOrm: FindManyOptions = {
      where: {
        name: this.sqlLike(name),
        projectId: projectId || undefined,
        status: status || undefined,
      },
      relations: ['project', 'scrumMaster'],
      order: { sort: 'ASC', startDate: 'DESC' },
    }
    return this.listBy(queryOrm, query)
  }

  async getBurndown(sprintId: string): Promise<any> {
    const sprint = await this.getOne({ id: sprintId })
    if (!sprint) {
      throw new Error('Sprint不存在')
    }

    const tasks = await this.taskRepository.find({
      where: { sprintId },
      select: ['id', 'storyPoints', 'status', 'startDate', 'endDate'],
    })

    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    const startDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    const today = new Date()

    const days: string[] = []
    const idealLine: number[] = []
    const actualLine: number[] = []

    let currentDate = new Date(startDate)
    let remainingPoints = totalPoints
    const dailyCompleted: Map<string, number> = new Map()

    for (const task of tasks) {
      if (task.status === '3' && task.endDate) {
        const end = new Date(task.endDate)
        const key = end.toISOString().split('T')[0]
        dailyCompleted.set(key, (dailyCompleted.get(key) || 0) + (task.storyPoints || 0))
      }
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1
    const pointsPerDay = totalPoints / totalDays

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      days.push(dateKey)

      const dayIndex = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      idealLine.push(Math.max(0, Math.round(totalPoints - pointsPerDay * dayIndex)))

      if (currentDate <= today) {
        const completed = dailyCompleted.get(dateKey) || 0
        remainingPoints -= completed
        actualLine.push(Math.max(0, remainingPoints))
      } else {
        actualLine.push(-1)
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      sprintName: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      totalPoints,
      days,
      idealLine,
      actualLine: actualLine.map(v => v === -1 ? null : v),
    }
  }

  async getVelocity(projectId: string): Promise<any> {
    const sprints = await this.repository.find({
      where: { projectId, status: SprintStatus.completed },
      order: { endDate: 'ASC' },
      select: ['id', 'name', 'endDate', 'completedPoints', 'committedPoints'],
    })

    return sprints.map(sprint => ({
      sprintId: sprint.id,
      sprintName: sprint.name,
      endDate: sprint.endDate,
      committedPoints: sprint.committedPoints,
      completedPoints: sprint.completedPoints,
      velocity: sprint.completedPoints,
    }))
  }

  async startSprint(sprintId: string): Promise<any> {
    const sprint = await this.getOne({ id: sprintId })
    if (!sprint) {
      throw new Error('Sprint不存在')
    }

    const tasks = await this.taskRepository.find({
      where: { sprintId },
      select: ['id', 'storyPoints'],
    })

    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)

    await this.repository.update(sprintId, {
      status: SprintStatus.active,
      committedPoints: totalPoints,
    })

    return { success: true, committedPoints: totalPoints }
  }

  async completeSprint(sprintId: string): Promise<any> {
    const sprint = await this.getOne({ id: sprintId })
    if (!sprint) {
      throw new Error('Sprint不存在')
    }

    const tasks = await this.taskRepository.find({
      where: { sprintId },
      select: ['id', 'storyPoints', 'status'],
    })

    const completedPoints = tasks
      .filter(t => t.status === TaskStatus.completed)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0)

    await this.repository.update(sprintId, {
      status: SprintStatus.completed,
      completedPoints,
    })

    return { success: true, completedPoints }
  }

  private mapUserSummary(user?: User | null) {
    if (!user) return null
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
    }
  }

  private mapProjectSummary(project?: any) {
    if (!project) return null
    return {
      id: project.id,
      code: project.code,
      name: project.name,
    }
  }

  async getOne(query, isError = true): Promise<any | null> {
    const sprint = await super.getOne(
      {
        where: query,
        relations: ['project', 'scrumMaster'],
      },
      isError,
    )
    if (!sprint) return sprint

    return {
      ...sprint,
      project: this.mapProjectSummary(sprint.project),
      scrumMaster: this.mapUserSummary(sprint.scrumMaster),
    }
  }
}
