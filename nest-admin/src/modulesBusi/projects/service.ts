import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, FindManyOptions, In, Like, Repository } from 'typeorm'
import { Project, ProjectStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { ProjectDto } from './dto'
import { Task, TaskStatus } from '../tasks/entity'
import { Ticket, TicketStatus } from '../tickets/entity'
import { Document } from '../documents/entity'
import { SysFileService } from 'src/modules/sys/file/service'
import { FileStatus, SysFile } from 'src/modules/sys/file/entity'
import { SaveDto } from 'src/common/dto'
import { ProjectMember, ProjectMemberRole } from '../project-members/entity'
import { Milestone, MilestoneStatus } from '../milestones/entity'
import { Risk, RiskLevel, RiskStatus } from '../risks/entity'
import { ProjectChange, ChangeImpact, ChangeStatus } from '../changes/entity'
import { Sprint, SprintStatus } from '../sprints/entity'

@Injectable()
export class ProjectsService extends BaseService<Project, ProjectDto> {
  constructor(
    @InjectRepository(Project) repository: Repository<Project>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
    @InjectRepository(Document) private documentRepository: Repository<Document>,
    @InjectRepository(ProjectMember) private projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Milestone) private milestoneRepository: Repository<Milestone>,
    @InjectRepository(Risk) private riskRepository: Repository<Risk>,
    @InjectRepository(ProjectChange) private changeRepository: Repository<ProjectChange>,
    @InjectRepository(Sprint) private sprintRepository: Repository<Sprint>,
    private readonly sysFileService: SysFileService,
    private readonly dataSource: DataSource,
  ) {
    super(Project, repository)
  }

  private getFileRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(SysFile) : this.sysFileService['repository']
  }

  private normalizeProjectPayload(dto: SaveDto<ProjectDto> & { attachments?: string[]; members?: any[]; milestones?: any[] }) {
    if (typeof dto.attachments === 'string' && !dto.attachments) {
      dto.attachments = [] as any
    }
    if (dto.attachments != null && !Array.isArray(dto.attachments)) {
      dto.attachments = [dto.attachments].filter(Boolean) as any
    }
    dto.members = Array.isArray(dto.members) ? dto.members : []
    dto.milestones = Array.isArray(dto.milestones) ? dto.milestones : []
    return dto
  }

  private async getFileIdsByPaths(paths: string[], manager?: EntityManager): Promise<string[]> {
    if (!paths || paths.length === 0) return []
    const files = await this.getFileRepository(manager).find({
      where: { storedPath: In(paths) },
      select: ['id'],
    })
    return files.map((f) => f.id)
  }

  private async associateFilesInTransaction(
    manager: EntityManager,
    businessId: string,
    attachments: string[] | undefined,
  ) {
    if (attachments === undefined || !businessId) return
    const fileIds = await this.getFileIdsByPaths(attachments, manager)
    await manager.getRepository(SysFile).update(
      { businessType: 'project', businessId } as any,
      {
        businessType: null as any,
        businessId: null as any,
        status: FileStatus.Pending as any,
      },
    )
    if (fileIds.length === 0) return
    await manager.getRepository(SysFile).update(
      { id: In(fileIds) } as any,
      {
        businessType: 'project',
        businessId,
        status: FileStatus.Associated as any,
      },
    )
  }

  private async saveProjectGraph(
    dto: SaveDto<ProjectDto> & { attachments?: string[]; members?: any[]; milestones?: any[] },
    mode: 'save' | 'add' | 'update',
  ) {
    this.normalizeProjectPayload(dto)
    const attachments = dto.attachments
    const members = dto.members || []
    const milestones = dto.milestones || []
    delete dto.attachments
    delete dto.members
    delete dto.milestones

    if ((mode === 'save' || mode === 'add') && !dto.code) {
      dto.code = await this.generateProjectCode()
    }

    dto.status ??= ProjectStatus.draft

    return this.dataSource.transaction(async (manager) => {
      const projectRepository = manager.getRepository(Project)
      const projectMemberRepository = manager.getRepository(ProjectMember)
      const milestoneRepository = manager.getRepository(Milestone)
      const baseService = new BaseService<Project, ProjectDto>(Project, projectRepository)

      let result: Project | Project[]
      if (mode === 'add') {
        delete dto.id
        result = await baseService.add(dto as any)
      } else if (mode === 'update') {
        if (!dto.id) throw new Error('数据不存在')
        result = await baseService.update(dto as any)
      } else {
        result = await baseService.save(dto as any)
      }

      const saved = Array.isArray(result) ? result[0] : result
      if (!saved?.id) return result

      await this.syncMembers(saved.id, members, projectMemberRepository)
      await this.syncMilestones(saved.id, milestones, milestoneRepository)
      await this.associateFilesInTransaction(manager, saved.id, attachments)

      return projectRepository.findOne({
        where: { id: saved.id } as any,
        relations: ['leader', 'customer'],
      })
    })
  }

  async save(dto: SaveDto<ProjectDto> & { attachments?: string[]; members?: any[]; milestones?: any[] }) {
    return this.saveProjectGraph(dto, 'save')
  }

  async add(dto: SaveDto<ProjectDto> & { attachments?: string[]; members?: any[]; milestones?: any[] }) {
    return this.saveProjectGraph(dto, 'add')
  }

  async update(dto: SaveDto<ProjectDto> & { attachments?: string[]; members?: any[]; milestones?: any[] }) {
    return this.saveProjectGraph(dto, 'update')
  }

  private async generateProjectCode(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const prefix = `PRJ-${today}-`

    const latest = await this.repository
      .createQueryBuilder('project')
      .where('project.code LIKE :prefix', { prefix: prefix + '%' })
      .orderBy('project.code', 'DESC')
      .getOne()

    let seq = 1
    if (latest && latest.code) {
      const lastSeq = parseInt(latest.code.replace(prefix, ''), 10)
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1
      }
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`
  }

  async calculateProjectProgress(projectId: string): Promise<number> {
    const totalTasks = await this.taskRepository.count({
      where: { projectId, isDelete: null as any } as any,
    })
    const completedTasks = await this.taskRepository.count({
      where: {
        projectId,
        status: TaskStatus.completed,
        isDelete: null as any,
      } as any,
    })
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }

  async recalculateProjectProgress(projectId: string): Promise<number> {
    if (!projectId) return 0
    const progress = await this.calculateProjectProgress(projectId)
    await this.repository.update(projectId, { progress } as any)
    return progress
  }

  async recalculateProjectProgressBatch(projectIds?: string[]) {
    let targetProjectIds = Array.from(new Set((projectIds || []).filter(Boolean).map((id) => String(id))))

    if (!targetProjectIds.length) {
      const projects = await this.repository.find({
        where: { isDelete: null as any } as any,
        select: ['id'] as any,
      })
      targetProjectIds = projects.map((item) => String(item.id)).filter(Boolean)
    }

    const results: Array<{ projectId: string; progress: number }> = []
    for (const projectId of targetProjectIds) {
      const progress = await this.recalculateProjectProgress(projectId)
      results.push({ projectId, progress })
    }

    return {
      total: results.length,
      results,
    }
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Project>> {
    let { name, code, status, priority, leaderId, isArchived, projectType } = query as QueryListDto & { projectType?: string }
    let queryOrm: FindManyOptions = {
      where: {
        name: this.sqlLike(name),
        code: this.sqlLike(code),
        status,
        priority,
        leaderId,
        isArchived,
        projectType,
      },
      relations: ['leader'],
    }
    return this.listBy(queryOrm, query)
  }

  async getOne(query, isError = true): Promise<any | null> {
    const project = await super.getOne(
      {
        where: { ...query },
        relations: ['leader', 'customer'],
      },
      isError,
    )
    if (!project) return project

    const calculatedProgress = await this.calculateProjectProgress(project.id)
    if (Number(project.progress || 0) !== calculatedProgress) {
      project.progress = calculatedProgress
      await this.repository.update(project.id, { progress: calculatedProgress } as any)
    }

    const members = await this.projectMemberRepository.find({
      where: { projectId: project.id, isActive: '1' },
      relations: ['user'],
      order: { sort: 'ASC', createTime: 'ASC' },
    })

    const milestones = await this.milestoneRepository.find({
      where: { projectId: project.id },
      order: { sort: 'ASC', createTime: 'ASC' },
    })

    return {
      ...project,
      members: members.map((member) => ({
        id: member.id,
        projectId: member.projectId,
        userId: member.userId,
        role: member.role,
        isCore: member.isCore,
        remark: member.remark,
        sort: member.sort,
        isActive: member.isActive,
        user: member.user
          ? {
              id: member.user.id,
              nickname: member.user.nickname,
              name: member.user.name,
              avatar: member.user.avatar,
            }
          : null,
      })),
      milestones,
    }
  }

  private async syncMembers(projectId: string, members: any[], repository = this.projectMemberRepository) {
    const existingMembers = await repository.find({ where: { projectId } })
    const incomingIds = new Set(members.filter((item) => item.id).map((item) => String(item.id)))

    for (const member of existingMembers) {
      if (!incomingIds.has(String(member.id))) {
        await repository.update(member.id, { isDelete: '1' as any })
      }
    }

    for (const [index, member] of members.entries()) {
      const payload = {
        projectId,
        userId: member.userId,
        role: member.role,
        isCore: member.isCore || '0',
        remark: member.remark || '',
        sort: Number(member.sort ?? index),
        isActive: member.isActive || '1',
      }

      if (member.id) {
        await repository.update(member.id, {
          ...payload,
          isDelete: null as any,
        })
      } else {
        await repository.save(new ProjectMember(payload))
      }
    }
  }

  private async syncMilestones(projectId: string, milestones: any[], repository = this.milestoneRepository) {
    const existingMilestones = await repository.find({ where: { projectId } })
    const incomingIds = new Set(milestones.filter((item) => item.id).map((item) => String(item.id)))

    for (const milestone of existingMilestones) {
      if (!incomingIds.has(String(milestone.id))) {
        await repository.update(milestone.id, { isDelete: '1' as any })
      }
    }

    for (const [index, milestone] of milestones.entries()) {
      const payload = {
        projectId,
        name: milestone.name,
        description: milestone.description || '',
        dueDate: milestone.dueDate || null,
        completedDate: milestone.completedDate || null,
        status: milestone.status || MilestoneStatus.pending,
        deliverables: milestone.deliverables || [],
        sort: Number(milestone.sort ?? index),
      }

      if (milestone.id) {
        await repository.update(milestone.id, {
          ...payload,
          isDelete: null as any,
        })
      } else {
        await repository.save(new Milestone(payload))
      }
    }
  }

  /**
   * 归档项目
   */
  async archive(id: string): Promise<any> {
    return this.repository.update(id, { isArchived: '1' })
  }

  /**
   * 获取项目统计
   */
  async getStatistics(id: string): Promise<any> {
    const project = await this.getOne({ id })
    
    // 统计任务数据
    const totalTasks = await this.taskRepository.count({ where: { projectId: id } })
    const completedTasks = await this.taskRepository.count({ 
      where: { projectId: id, status: TaskStatus.completed }
    })
    const inProgressTasks = await this.taskRepository.count({
      where: { projectId: id, status: TaskStatus.inProgress }
    })
    const pendingTasks = await this.taskRepository.count({
      where: { projectId: id, status: TaskStatus.pending }
    })
    
    // 统计工单数据
    const totalTickets = await this.ticketRepository.count({ where: { projectId: id } })
    const resolvedTickets = await this.ticketRepository.count({
      where: { projectId: id, status: TicketStatus.resolved }
    })
    
    // 统计文档数据
    const totalDocuments = await this.documentRepository.count({ where: { projectId: id } })
    
    // 计算进度
    const progress = await this.calculateProjectProgress(id)
    
    return {
      projectId: project.id,
      projectName: project.name,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        progress: progress
      },
      tickets: {
        total: totalTickets,
        resolved: resolvedTickets,
        unresolved: totalTickets - resolvedTickets
      },
      documents: {
        total: totalDocuments
      },
      progress: progress
    }
  }

  async getDashboard(id: string): Promise<any> {
    const project = await this.getOne({ id })
    const [tasks, tickets, milestones, risks, changes, sprints] = await Promise.all([
      this.taskRepository.find({ where: { projectId: id }, relations: ['leader'], order: { endDate: 'ASC', createTime: 'DESC' } }),
      this.ticketRepository.find({ where: { projectId: id }, relations: ['handler'], order: { createTime: 'DESC' } }),
      this.milestoneRepository.find({ where: { projectId: id }, order: { dueDate: 'ASC', sort: 'ASC', createTime: 'ASC' } }),
      this.riskRepository.find({ where: { projectId: id }, relations: ['riskOwner'], order: { level: 'DESC', dueDate: 'ASC', createTime: 'DESC' } }),
      this.changeRepository.find({ where: { projectId: id }, order: { impact: 'DESC', createTime: 'DESC' } }),
      this.sprintRepository.find({ where: { projectId: id }, order: { startDate: 'DESC', createTime: 'DESC' } }),
    ])

    const now = new Date()
    const dueSoonDays = 7
    const getDayDiff = (dateString?: string) => {
      if (!dateString) return null
      const targetDate = new Date(dateString)
      if (Number.isNaN(targetDate.getTime())) return null
      return Math.ceil((targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    }
    const isTaskCompleted = (task: Task) => [TaskStatus.completed, TaskStatus.rejected].includes(task.status)
    const isTicketResolved = (ticket: Ticket) => [TicketStatus.resolved, TicketStatus.closed].includes(ticket.status)
    const isRiskClosed = (risk: Risk) => [RiskStatus.resolved, RiskStatus.closed].includes(risk.status)

    const taskSummary = {
      total: tasks.length,
      completed: tasks.filter(isTaskCompleted).length,
      inProgress: tasks.filter((item) => item.status === TaskStatus.inProgress).length,
      pending: tasks.filter((item) => item.status === TaskStatus.pending).length,
      overdue: tasks.filter((item) => !isTaskCompleted(item) && (getDayDiff(item.endDate) ?? 1) < 0).length,
      dueSoon: tasks.filter((item) => {
        const diff = getDayDiff(item.endDate)
        return !isTaskCompleted(item) && diff !== null && diff >= 0 && diff <= dueSoonDays
      }).length,
      completionRate: tasks.length > 0 ? Math.round((tasks.filter(isTaskCompleted).length / tasks.length) * 100) : 0,
    }

    const ticketSummary = {
      total: tickets.length,
      open: tickets.filter((item) => !isTicketResolved(item)).length,
      critical: tickets.filter((item) => item.severity === '1' && !isTicketResolved(item)).length,
    }

    const riskSummary = {
      total: risks.length,
      active: risks.filter((item) => !isRiskClosed(item)).length,
      high: risks.filter((item) => [RiskLevel.high, RiskLevel.critical].includes(item.level) && !isRiskClosed(item)).length,
      overdue: risks.filter((item) => !isRiskClosed(item) && (getDayDiff(item.dueDate) ?? 1) < 0).length,
    }

    const changeSummary = {
      total: changes.length,
      pendingApproval: changes.filter((item) => item.status === ChangeStatus.pending).length,
      highImpact: changes.filter((item) => item.impact === ChangeImpact.high).length,
      implemented: changes.filter((item) => item.status === ChangeStatus.implemented).length,
    }

    const milestoneSummary = {
      total: milestones.length,
      completed: milestones.filter((item) => item.status === MilestoneStatus.completed).length,
      delayed: milestones.filter((item) => item.status === MilestoneStatus.delayed).length,
      dueSoon: milestones.filter((item) => {
        const diff = getDayDiff(item.dueDate)
        return item.status !== MilestoneStatus.completed && diff !== null && diff >= 0 && diff <= dueSoonDays
      }).length,
      overdue: milestones.filter((item) => item.status !== MilestoneStatus.completed && (getDayDiff(item.dueDate) ?? 1) < 0).length,
      completionRate: milestones.length > 0 ? Math.round((milestones.filter((item) => item.status === MilestoneStatus.completed).length / milestones.length) * 100) : 0,
    }

    const projectProgress = taskSummary.completionRate
    if (project?.id && Number(project.progress || 0) !== projectProgress) {
      project.progress = projectProgress
      await this.repository.update(project.id, { progress: projectProgress } as any)
    }

    const sprintSummary = {
      total: sprints.length,
      active: sprints.filter((item) => item.status === SprintStatus.active).length,
      planning: sprints.filter((item) => item.status === SprintStatus.planning).length,
      current: sprints.find((item) => item.status === SprintStatus.active) || sprints.find((item) => item.status === SprintStatus.planning) || null,
    }

    return {
      project,
      tasks,
      tickets,
      milestones,
      risks,
      changes,
      sprints,
      summary: {
        taskSummary,
        ticketSummary,
        riskSummary,
        changeSummary,
        milestoneSummary,
        sprintSummary,
        budget: Number(project?.budget || 0),
        actualCost: Number(project?.actualCost || 0),
        costVariance: Number(project?.actualCost || 0) - Number(project?.budget || 0),
      },
      focus: {
        dueSoonTasks: tasks.filter((item) => {
          const diff = getDayDiff(item.endDate)
          return !isTaskCompleted(item) && diff !== null && diff >= 0 && diff <= dueSoonDays
        }).slice(0, 5),
        overdueTasks: tasks.filter((item) => !isTaskCompleted(item) && (getDayDiff(item.endDate) ?? 1) < 0).slice(0, 5),
        criticalTickets: tickets.filter((item) => item.severity === '1' && !isTicketResolved(item)).slice(0, 5),
        highRisks: risks.filter((item) => [RiskLevel.high, RiskLevel.critical].includes(item.level) && !isRiskClosed(item)).slice(0, 5),
        pendingChanges: changes.filter((item) => item.status === ChangeStatus.pending).slice(0, 5),
        dueSoonMilestones: milestones.filter((item) => {
          const diff = getDayDiff(item.dueDate)
          return item.status !== MilestoneStatus.completed && diff !== null && diff >= 0 && diff <= dueSoonDays
        }).slice(0, 5),
      },
    }
  }

  async getCockpit(query: QueryListDto): Promise<any> {
    const projectListRes = await this.list(query)
    const projects = projectListRes?.data || []
    const selectedProjectId = String(query.projectId || projects[0]?.id || '')
    const selectedProject = selectedProjectId ? await this.getDashboard(selectedProjectId) : null

    const totalProjects = projects.length
    const activeProjects = projects.filter((item) => ['2', '3', '4'].includes(String(item.status || ''))).length
    const completedProjects = projects.filter((item) => String(item.status || '') === '6').length
    const overdueProjects = projects.filter((item) => item.endDate && new Date(item.endDate).getTime() < Date.now() && String(item.status || '') !== '6').length
    const budgetTotal = projects.reduce((sum, item) => sum + Number(item.budget || 0), 0)
    const actualCostTotal = projects.reduce((sum, item) => sum + Number(item.actualCost || 0), 0)
    const now = Date.now()
    const overdueRanking = [...projects]
      .filter((item) => item.endDate && new Date(item.endDate).getTime() < now && String(item.status || '') !== '6')
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 5)
    const laggingRanking = [...projects]
      .filter((item) => String(item.status || '') !== '6')
      .sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0))
      .slice(0, 5)
    const costRiskRanking = [...projects]
      .filter((item) => Number(item.actualCost || 0) > Number(item.budget || 0))
      .sort((a, b) => (Number(b.actualCost || 0) - Number(b.budget || 0)) - (Number(a.actualCost || 0) - Number(a.budget || 0)))
      .slice(0, 5)

    return {
      projectOptions: projects.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        priority: item.priority,
        progress: item.progress,
        leader: item.leader,
      })),
      selectedProjectId,
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        overdueProjects,
        budgetTotal,
        actualCostTotal,
        costVariance: actualCostTotal - budgetTotal,
      },
      rankings: {
        overdueProjects: overdueRanking,
        laggingProjects: laggingRanking,
        costRiskProjects: costRiskRanking,
      },
      selectedProject,
    }
  }
}
