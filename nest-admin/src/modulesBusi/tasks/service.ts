import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Task, TaskStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { TaskDto } from './dto'
import { TaskDependency } from './entities/task-dependency.entity'
import { TaskTimeLog } from './entities/task-time-log.entity'
import { SysFileService } from 'src/modules/sys/file/service'
import { SaveDto } from 'src/common/dto'
import { User } from 'src/modules/users/entities/user.entity'
import { TaskComment } from '../task-comments/entity'

@Injectable()
export class TasksService extends BaseService<Task, TaskDto> {
  constructor(
    @InjectRepository(Task) repository: Repository<Task>,
    @InjectRepository(TaskDependency) private dependencyRepository: Repository<TaskDependency>,
    @InjectRepository(TaskTimeLog) private timeLogRepository: Repository<TaskTimeLog>,
    @InjectRepository(TaskComment) private taskCommentRepository: Repository<TaskComment>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly sysFileService: SysFileService,
  ) {
    super(Task, repository)
  }

  private normalizeTaskPayload(dto: SaveDto<TaskDto> & { attachments?: string[] }) {
    if (typeof dto.executorIds === 'string' && !dto.executorIds) {
      dto.executorIds = [] as any
    }
    if (dto.executorIds == null) {
      dto.executorIds = [] as any
    }
    if (!Array.isArray(dto.executorIds)) {
      dto.executorIds = [dto.executorIds].filter(Boolean) as any
    }
    return dto
  }

  private async generateTaskCode(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const prefix = `TSK-${today}-`

    const latest = await this.repository
      .createQueryBuilder('task')
      .where('task.code LIKE :prefix', { prefix: prefix + '%' })
      .orderBy('task.code', 'DESC')
      .getOne()

    let seq = 1
    if (latest?.code) {
      const lastSeq = parseInt(String(latest.code).replace(prefix, ''), 10)
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1
      }
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`
  }

  async save(dto: SaveDto<TaskDto> & { attachments?: string[] }) {
    this.normalizeTaskPayload(dto)
    if (!dto.id && !dto.code) {
      dto.code = await this.generateTaskCode()
    }
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
    this.normalizeTaskPayload(dto)
    if (!dto.code) {
      dto.code = await this.generateTaskCode()
    }
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
    this.normalizeTaskPayload(dto)
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

  private mapUserSummary(user?: User | null) {
    if (!user) return null
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
    }
  }

  private mapTaskSummary(task?: Task | null) {
    if (!task) return null
    return {
      id: task.id,
      code: task.code,
      name: task.name,
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

  private async fillExecutors(executorIds: string[] = []) {
    const normalizedExecutorIds = Array.from(new Set((executorIds || []).filter(Boolean).map((id) => String(id))))
    if (!normalizedExecutorIds.length) return []

    const users = await this.userRepository.find({ where: normalizedExecutorIds.map((id) => ({ id })) })
    const userMap = new Map(users.map((user) => [String(user.id), user]))
    return normalizedExecutorIds.map((id) => this.mapUserSummary(userMap.get(id))).filter(Boolean)
  }

  private async ensureTaskCode(task: Task) {
    if (task?.code) return task.code
    const code = await this.generateTaskCode()
    await this.repository.update(task.id, { code })
    task.code = code
    return code
  }

  private async buildTaskDetail(task: Task) {
    await this.ensureTaskCode(task)
    const executors = await this.fillExecutors(task.executorIds || [])

    return {
      ...task,
      project: this.mapProjectSummary(task.project),
      leader: this.mapUserSummary(task.leader),
      parent: this.mapTaskSummary(task.parent),
      executors,
    }
  }

  async getOne(query, isError = true): Promise<Task | null> {
    const task = await super.getOne(
      {
        where: query,
        relations: ['leader', 'project', 'parent'],
      },
      isError,
    )
    if (!task) return task
    return this.buildTaskDetail(task) as any
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Task>> {
    let { name, status, priority, leaderId, projectId, parentId, hasComment, hasReport, reportFreshness } = query
    const taskQuery = this.repository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.leader', 'leader')
      .leftJoinAndSelect('task.project', 'project')

    if (name !== undefined && name !== '') {
      taskQuery.andWhere('task.name LIKE :name', { name: `%${String(name).replace(/%/g, '\\%').replace(/_/g, '\\_')}%` })
    }
    if (status !== undefined && status !== '') {
      taskQuery.andWhere('task.status = :status', { status })
    }
    if (priority !== undefined && priority !== '') {
      taskQuery.andWhere('task.priority = :priority', { priority })
    }
    if (leaderId !== undefined && leaderId !== '') {
      taskQuery.andWhere('task.leader_id = :leaderId', { leaderId })
    }
    if (projectId !== undefined && projectId !== '') {
      taskQuery.andWhere('task.project_id = :projectId', { projectId })
    }
    if (parentId !== undefined && parentId !== '') {
      taskQuery.andWhere('task.parent_id = :parentId', { parentId })
    }
    if (hasComment === '1') {
      taskQuery.andWhere('EXISTS (SELECT 1 FROM task_comment comment WHERE comment.task_id = task.id AND comment.is_delete IS NULL)')
    }
    if (hasComment === '0') {
      taskQuery.andWhere('NOT EXISTS (SELECT 1 FROM task_comment comment WHERE comment.task_id = task.id AND comment.is_delete IS NULL)')
    }
    if (hasReport === '1') {
      taskQuery.andWhere('EXISTS (SELECT 1 FROM task_time_log timelog WHERE timelog.task_id = task.id AND timelog.is_delete IS NULL)')
    }
    if (hasReport === '0') {
      taskQuery.andWhere('NOT EXISTS (SELECT 1 FROM task_time_log timelog WHERE timelog.task_id = task.id AND timelog.is_delete IS NULL)')
    }
    if (reportFreshness === 'stale7d') {
      taskQuery.andWhere(`
        NOT EXISTS (
          SELECT 1
          FROM task_time_log timelog_recent
          WHERE timelog_recent.task_id = task.id
            AND timelog_recent.is_delete IS NULL
            AND timelog_recent.create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        )
      `)
    }

    taskQuery.orderBy('task.createTime', 'DESC')

    const pageNum = Number(query.pageNum || 1)
    const pageSize = Number(query.pageSize || 10)
    if (pageNum && pageSize) {
      taskQuery.skip((pageNum - 1) * pageSize).take(pageSize)
    }

    const [rows, total] = await taskQuery.getManyAndCount()
    const taskIds = rows.map((row) => String(row.id)).filter(Boolean)
    const executorIds = Array.from(new Set(rows.flatMap((row) => row.executorIds || []).filter(Boolean).map((id) => String(id))))
    const users = executorIds.length ? await this.userRepository.find({ where: executorIds.map((id) => ({ id: String(id) })) }) : []
    const userMap = new Map(users.map((user) => [String(user.id), user]))
    const commentSummary = taskIds.length
      ? await this.taskCommentRepository.query(
        `SELECT task_id AS taskId, COUNT(id) AS commentCount
         FROM task_comment
         WHERE task_id IN (?)
           AND is_delete IS NULL
         GROUP BY task_id`,
        [taskIds],
      )
      : []
    const latestReportSummary = taskIds.length
      ? await this.timeLogRepository.query(
        `SELECT task_id AS taskId, MAX(create_time) AS latestReportTime
         FROM task_time_log
         WHERE task_id IN (?)
           AND is_delete IS NULL
         GROUP BY task_id`,
        [taskIds],
      )
      : []
    const commentCountMap = new Map(commentSummary.map((item) => [String(item.taskId), Number(item.commentCount || 0)]))
    const latestReportMap = new Map(latestReportSummary.map((item) => [String(item.taskId), item.latestReportTime || '']))
    rows.forEach((row) => {
      row.leader = this.mapUserSummary(row.leader as any) as any
      row.project = this.mapProjectSummary(row.project) as any
      row.executors = (row.executorIds || []).map((id) => this.mapUserSummary(userMap.get(String(id)))).filter(Boolean) as any
      row['commentCount'] = commentCountMap.get(String(row.id)) || 0
      row['latestReportTime'] = latestReportMap.get(String(row.id)) || ''
    })
    return { data: rows, total, _flag: true }
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
  async addTimeLog(taskId: number, hours: number, description: string, workDate: string, userId: string, attachments: string[] = [], progress?: number): Promise<TaskTimeLog> {
    if (!userId) {
      throw new BadRequestException('当前登录用户不存在')
    }
    if (!workDate) {
      throw new BadRequestException('工作日期不能为空')
    }
    if (!hours || Number(hours) <= 0) {
      throw new BadRequestException('工时必须大于0')
    }
    if (!String(description || '').trim()) {
      throw new BadRequestException('汇报内容不能为空')
    }
    if (progress === undefined || progress === null || Number(progress) < 0 || Number(progress) > 100) {
      throw new BadRequestException('当前进度必须在0到100之间')
    }
    const task = await this.repository.findOne({ where: { id: String(taskId) } as any })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }
    const timeLog = this.timeLogRepository.create({
      taskId,
      hours,
      progress,
      description,
      workDate,
      userId,
      attachments,
    })
    const saved = await this.timeLogRepository.save(timeLog)
    if (progress !== undefined && progress !== null) {
      await this.repository.update(taskId, { progress })
    }
    
    // 更新任务的实际工时
    await this.updateActualHours(taskId)
    
    return this.timeLogRepository.findOne({ where: { id: saved.id } as any, relations: ['user'] })
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

  async getTimeLogList(query: QueryListDto): Promise<ResponseListDto<TaskTimeLog>> {
    const { taskId, userId, beginDate, endDate, pageNum, pageSize } = query
    const timeLogQuery = this.timeLogRepository
      .createQueryBuilder('timelog')
      .leftJoinAndSelect('timelog.user', 'user')
      .leftJoinAndSelect('timelog.task', 'task')
      .orderBy('timelog.createTime', 'DESC')

    if (taskId !== undefined && taskId !== '') {
      timeLogQuery.andWhere('timelog.task_id = :taskId', { taskId })
    }
    if (userId !== undefined && userId !== '') {
      timeLogQuery.andWhere('timelog.user_id = :userId', { userId })
    }
    if (beginDate !== undefined && beginDate !== '') {
      timeLogQuery.andWhere('timelog.work_date >= :beginDate', { beginDate })
    }
    if (endDate !== undefined && endDate !== '') {
      timeLogQuery.andWhere('timelog.work_date <= :endDate', { endDate })
    }

    const pageNumValue = Number(pageNum || 1)
    const pageSizeValue = Number(pageSize || 10)
    if (pageNumValue && pageSizeValue) {
      timeLogQuery.skip((pageNumValue - 1) * pageSizeValue).take(pageSizeValue)
    }

    const [rows, total] = await timeLogQuery.getManyAndCount()
    rows.forEach((row) => {
      row.user = this.mapUserSummary(row.user as any) as any
      row.task = this.mapTaskSummary(row.task as any) as any
    })
    return { data: rows, total, _flag: true }
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
  async deleteTimeLog(id: number, userId: string): Promise<void> {
    const log = await this.timeLogRepository.findOne({ where: { id: String(id) } })
    if (!log) {
      throw new NotFoundException('工时记录不存在')
    }
    if (String(log.userId) !== String(userId)) {
      throw new ForbiddenException('只能删除自己的工时记录')
    }
    
    const taskId = log.taskId
    await this.timeLogRepository.delete(String(id))
    
    // 更新任务的实际工时
    await this.updateActualHours(taskId)
  }

  async updateTimeLog(id: number, hours: number, description: string, workDate: string, userId: string, attachments: string[] = [], progress?: number): Promise<TaskTimeLog> {
    if (!userId) {
      throw new BadRequestException('当前登录用户不存在')
    }
    if (!workDate) {
      throw new BadRequestException('工作日期不能为空')
    }
    if (!hours || Number(hours) <= 0) {
      throw new BadRequestException('工时必须大于0')
    }
    if (!String(description || '').trim()) {
      throw new BadRequestException('汇报内容不能为空')
    }
    if (progress === undefined || progress === null || Number(progress) < 0 || Number(progress) > 100) {
      throw new BadRequestException('当前进度必须在0到100之间')
    }
    const log = await this.timeLogRepository.findOne({ where: { id: String(id) } as any })
    if (!log) {
      throw new NotFoundException('工时记录不存在')
    }
    if (String(log.userId) !== String(userId)) {
      throw new ForbiddenException('只能编辑自己的工时记录')
    }

    await this.timeLogRepository.update(String(id), {
      hours,
      progress,
      description,
      workDate,
      attachments,
    })

    if (progress !== undefined && progress !== null) {
      await this.repository.update(log.taskId, { progress })
    }

    await this.updateActualHours(log.taskId)
    return this.timeLogRepository.findOne({ where: { id: String(id) } as any, relations: ['user', 'task'] })
  }
}
