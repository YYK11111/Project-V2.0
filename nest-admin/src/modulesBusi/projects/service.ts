import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Like, Repository } from 'typeorm'
import { Project, ProjectStatus } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { ProjectDto } from './dto'
import { Task, TaskStatus } from '../tasks/entity'
import { Ticket, TicketStatus } from '../tickets/entity'
import { Document } from '../documents/entity'
import { SysFileService } from 'src/modules/sys/file/service'
import { SysFile } from 'src/modules/sys/file/entity'
import { SaveDto } from 'src/common/dto'
import { ProjectMember, ProjectMemberRole } from '../project-members/entity'
import { Milestone, MilestoneStatus } from '../milestones/entity'

@Injectable()
export class ProjectsService extends BaseService<Project, ProjectDto> {
  constructor(
    @InjectRepository(Project) repository: Repository<Project>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
    @InjectRepository(Document) private documentRepository: Repository<Document>,
    @InjectRepository(ProjectMember) private projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Milestone) private milestoneRepository: Repository<Milestone>,
    private readonly sysFileService: SysFileService,
  ) {
    super(Project, repository)
  }

  async save(dto: SaveDto<ProjectDto> & { attachments?: string[]; members?: any[]; milestones?: any[] }) {
    const attachments = dto.attachments
    const members = dto.members || []
    const milestones = dto.milestones || []
    delete dto.attachments
    delete dto.members
    delete dto.milestones

    if (!dto.code) {
      dto.code = await this.generateProjectCode()
    }

    dto.status ??= ProjectStatus.draft

    const result = await super.save(dto)
    const saved = Array.isArray(result) ? result[0] : result

    if (saved?.id) {
      await this.syncMembers(saved.id, members)
      await this.syncMilestones(saved.id, milestones)
    }

    if (attachments !== undefined) {
      const fileIds = await this.getFileIdsByPaths(attachments)
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: 'project',
          businessId: saved.id,
          fileIds,
        })
      } else if (attachments.length === 0 && saved.id) {
        await this.sysFileService.associateFiles({
          businessType: 'project',
          businessId: saved.id,
          fileIds: [],
        })
      }
    }

    return result
  }

  async add(dto: SaveDto<ProjectDto> & { attachments?: string[]; members?: any[]; milestones?: any[] }) {
    const attachments = dto.attachments
    const members = dto.members || []
    const milestones = dto.milestones || []
    delete dto.attachments
    delete dto.members
    delete dto.milestones

    if (!dto.code) {
      dto.code = await this.generateProjectCode()
    }

    dto.status ??= ProjectStatus.draft

    const result = await super.add(dto)
    const saved = Array.isArray(result) ? result[0] : result

    if (saved?.id) {
      await this.syncMembers(saved.id, members)
      await this.syncMilestones(saved.id, milestones)
    }

    if (attachments !== undefined && attachments.length > 0) {
      const fileIds = await this.getFileIdsByPaths(attachments)
      if (fileIds.length > 0) {
        await this.sysFileService.associateFiles({
          businessType: 'project',
          businessId: saved.id,
          fileIds,
        })
      }
    }

    return result
  }

  async update(dto: SaveDto<ProjectDto> & { attachments?: string[]; members?: any[]; milestones?: any[] }) {
    const attachments = dto.attachments
    const members = dto.members || []
    const milestones = dto.milestones || []
    delete dto.attachments
    delete dto.members
    delete dto.milestones

    const result = await super.update(dto)
    const saved = Array.isArray(result) ? result[0] : result

    if (saved?.id) {
      await this.syncMembers(saved.id, members)
      await this.syncMilestones(saved.id, milestones)
    }

    if (attachments !== undefined) {
      const fileIds = await this.getFileIdsByPaths(attachments)
      await this.sysFileService.associateFiles({
        businessType: 'project',
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

  private async syncMembers(projectId: string, members: any[]) {
    const existingMembers = await this.projectMemberRepository.find({ where: { projectId } })
    const incomingIds = new Set(members.filter((item) => item.id).map((item) => String(item.id)))

    for (const member of existingMembers) {
      if (!incomingIds.has(String(member.id))) {
        await this.projectMemberRepository.update(member.id, { isDelete: '1' as any })
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
        await this.projectMemberRepository.update(member.id, {
          ...payload,
          isDelete: null as any,
        })
      } else {
        await this.projectMemberRepository.save(new ProjectMember(payload))
      }
    }
  }

  private async syncMilestones(projectId: string, milestones: any[]) {
    const existingMilestones = await this.milestoneRepository.find({ where: { projectId } })
    const incomingIds = new Set(milestones.filter((item) => item.id).map((item) => String(item.id)))

    for (const milestone of existingMilestones) {
      if (!incomingIds.has(String(milestone.id))) {
        await this.milestoneRepository.update(milestone.id, { isDelete: '1' as any })
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
        await this.milestoneRepository.update(milestone.id, {
          ...payload,
          isDelete: null as any,
        })
      } else {
        await this.milestoneRepository.save(new Milestone(payload))
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
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
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
}
