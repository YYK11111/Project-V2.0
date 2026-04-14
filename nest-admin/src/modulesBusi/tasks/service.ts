import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Like, Repository } from 'typeorm'
import { Task, TaskStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { TaskDto } from './dto'
import { TaskDependency } from './entities/task-dependency.entity'
import { TaskTimeLog } from './entities/task-time-log.entity'
import { SysFileService } from 'src/modules/sys/file/service'
import { SaveDto } from 'src/common/dto'

@Injectable()
export class TasksService extends BaseService<Task, TaskDto> {
  constructor(
    @InjectRepository(Task) repository: Repository<Task>,
    @InjectRepository(TaskDependency) private dependencyRepository: Repository<TaskDependency>,
    @InjectRepository(TaskTimeLog) private timeLogRepository: Repository<TaskTimeLog>,
    private readonly sysFileService: SysFileService,
  ) {
    super(Task, repository)
  }

  async save(dto: SaveDto<TaskDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.save(dto)

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: 'task',
          businessId: saved.id,
          fileIds,
        })
      } else if (attachments.length === 0 && saved.id) {
        await this.sysFileService.associateFiles({
          businessType: 'task',
          businessId: saved.id,
          fileIds: [],
        })
      }
    }

    return result
  }

  async add(dto: SaveDto<TaskDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.add(dto)

    if (attachments !== undefined && attachments.length > 0) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: 'task',
          businessId: saved.id,
          fileIds,
        })
      }
    }

    return result
  }

  async update(dto: SaveDto<TaskDto> & { attachments?: string[] }) {
    const attachments = dto.attachments
    delete dto.attachments

    const result = await super.update(dto)

    if (attachments !== undefined) {
      const saved = Array.isArray(result) ? result[0] : result
      const fileIds = await this.getFileIdsByPaths(attachments)
      await this.sysFileService.associateFiles({
        businessType: 'task',
        businessId: saved.id,
        fileIds,
      })
    }

    return result
  }

  private async getFileIdsByPaths(paths: string[]): Promise<string[]> {
    if (!paths || paths.length === 0) return []
    const files = await this.sysFileService['repository'].find({
      where: { storedPath: In(paths) },
      select: ['id'],
    })
    return files.map((f) => f.id)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Task>> {
    let { name, status, priority, leaderId, projectId, parentId } = query
    let queryOrm: FindManyOptions = {
      where: {
        name: this.sqlLike(name),
        status,
        priority,
        leaderId,
        projectId,
        parentId,
      },
      relations: ['leader', 'project'],
    }
    return this.listBy(queryOrm, query)
  }

  /**
   * 更新任务进度
   */
  async updateProgress(id: string, progress: number): Promise<any> {
    if (progress < 0 || progress > 100) {
      throw new Error('进度必须在0-100之间')
    }
    return this.repository.update(id, { progress })
  }

  /**
   * 获取看板数据（按状态分组）
   */
  async getKanbanData(projectId: string): Promise<any[]> {
    const tasks = await this.repository.find({
      where: { projectId },
      relations: ['leader'],
    })

    // 按状态分组
    const statusMap: Record<string, any[]> = {
      '1': [],
      '2': [],
      '3': [],
      '4': [],
      '5': [],
    }

    tasks.forEach((task) => {
      if (statusMap[task.status]) {
        statusMap[task.status].push(task)
      }
    })

    return [
      { status: '1', statusName: '待处理', tasks: statusMap['1'] },
      { status: '2', statusName: '处理中', tasks: statusMap['2'] },
      { status: '3', statusName: '已完成', tasks: statusMap['3'] },
      { status: '4', statusName: '已驳回', tasks: statusMap['4'] },
      { status: '5', statusName: '暂缓', tasks: statusMap['5'] },
    ]
  }

  // ==================== P0 任务依赖功能 ====================

  /**
   * 添加任务依赖
   */
  async addDependency(taskId: number, dependencyId: number, dependencyType: string = '1', lagDays: number = 0): Promise<TaskDependency> {
    // 检查是否存在循环依赖
    const hasCircular = await this.checkCircularDependency(taskId, dependencyId)
    if (hasCircular) {
      throw new Error('添加该依赖会形成循环依赖')
    }

    // 检查重复依赖
    const existing = await this.dependencyRepository.findOne({
      where: { taskId, dependencyId },
    })
    if (existing) {
      throw new Error('该依赖关系已存在')
    }

    const dependency = this.dependencyRepository.create({
      taskId,
      dependencyId,
      dependencyType,
      lagDays,
    })
    return this.dependencyRepository.save(dependency)
  }

  /**
   * 移除任务依赖
   */
  async removeDependency(taskId: number, dependencyId: number): Promise<void> {
    const result = await this.dependencyRepository.delete({ taskId, dependencyId })
    if (result.affected === 0) {
      throw new NotFoundException('依赖关系不存在')
    }
  }

  /**
   * 获取任务的依赖列表（前置任务）
   */
  async getDependencies(taskId: number): Promise<TaskDependency[]> {
    return this.dependencyRepository.find({
      where: { taskId },
      relations: ['dependency'],
    })
  }

  /**
   * 获取任务的后置任务列表
   */
  async getDependents(taskId: number): Promise<TaskDependency[]> {
    return this.dependencyRepository.find({
      where: { dependencyId: taskId },
      relations: ['task'],
    })
  }

  /**
   * 检测循环依赖（使用DFS）
   */
  async checkCircularDependency(taskId: number, dependencyId: number): Promise<boolean> {
    // 构建邻接表
    const adjacencyList = await this.buildAdjacencyList()
    
    // 临时添加新依赖
    adjacencyList[taskId] = adjacencyList[taskId] || []
    adjacencyList[taskId].push(dependencyId)
    
    const visited = new Set<number>()
    const recursionStack = new Set<number>()
    
    const hasCycle = (node: number): boolean => {
      if (recursionStack.has(node)) return true
      if (visited.has(node)) return false
      
      visited.add(node)
      recursionStack.add(node)
      
      const neighbors = adjacencyList[node] || []
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true
      }
      
      recursionStack.delete(node)
      return false
    }
    
    return hasCycle(taskId)
  }

  /**
   * 构建邻接表（任务依赖关系图）
   */
  private async buildAdjacencyList(): Promise<Record<number, number[]>> {
    const dependencies = await this.dependencyRepository.find()
    const adjacencyList: Record<number, number[]> = {}
    
    for (const dep of dependencies) {
      if (!adjacencyList[dep.taskId]) {
        adjacencyList[dep.taskId] = []
      }
      adjacencyList[dep.taskId].push(dep.dependencyId)
    }
    
    return adjacencyList
  }

  // ==================== P0 工时记录功能 ====================

  /**
   * 添加工时记录
   */
  async addTimeLog(taskId: number, hours: number, description: string, workDate: string, userId: string): Promise<TaskTimeLog> {
    const timeLog = this.timeLogRepository.create({
      taskId,
      hours,
      description,
      workDate,
      userId,
    })
    const saved = await this.timeLogRepository.save(timeLog)
    
    // 更新任务的实际工时
    await this.updateActualHours(taskId)
    
    return saved
  }

  /**
   * 获取任务的工时记录
   */
  async getTimeLogs(taskId: number): Promise<TaskTimeLog[]> {
    return this.timeLogRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createTime: 'DESC' },
    })
  }

  /**
   * 更新任务的实际工时（汇总所有工时记录）
   */
  private async updateActualHours(taskId: number): Promise<void> {
    const result = await this.timeLogRepository
      .createQueryBuilder('log')
      .where('log.task_id = :taskId', { taskId })
      .select('SUM(log.hours)', 'total')
      .getRawOne()
    
    const totalHours = parseFloat(result?.total || 0)
    await this.repository.update(taskId, { actualHours: totalHours })
  }

  /**
   * 删除工时记录
   */
  async deleteTimeLog(id: number): Promise<void> {
    const log = await this.timeLogRepository.findOne({ where: { id: String(id) } })
    if (!log) {
      throw new NotFoundException('工时记录不存在')
    }
    
    const taskId = log.taskId
    await this.timeLogRepository.delete(String(id))
    
    // 更新任务的实际工时
    await this.updateActualHours(taskId)
  }
}
