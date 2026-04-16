import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProjectMember, ProjectMemberRole } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { ProjectMemberDto, UpdateProjectMemberDto } from './dto'

@Injectable()
export class ProjectMembersService extends BaseService<ProjectMember, ProjectMemberDto> {
  constructor(@InjectRepository(ProjectMember) repository: Repository<ProjectMember>) {
    super(ProjectMember, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<ProjectMember>> {
    const pageNum = Number(query.pageNum || 1)
    const pageSize = Number(query.pageSize || 10)
    const keyword = String(query.keyword || '').trim()
    const { projectId, userId, role, isActive, isCore, issueType, projectStatus } = query as any

    const qb = this.repository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('member.project', 'project')
      .where('member.is_delete IS NULL')

    if (projectId) {
      qb.andWhere('member.projectId = :projectId', { projectId })
    }
    if (userId) {
      qb.andWhere('member.userId = :userId', { userId })
    }
    if (role) {
      qb.andWhere('member.role = :role', { role })
    }
    if (isActive !== undefined && isActive !== '') {
      qb.andWhere('member.isActive = :isActive', { isActive })
    }
    if (isCore !== undefined && isCore !== '') {
      qb.andWhere('member.isCore = :isCore', { isCore })
    }
    if (projectStatus) {
      qb.andWhere('project.status = :projectStatus', { projectStatus })
    }
    if (keyword) {
      qb.andWhere('(project.name LIKE :keyword OR project.code LIKE :keyword OR user.name LIKE :keyword OR user.nickname LIKE :keyword)', {
        keyword: `%${keyword}%`,
      })
    }

    if (issueType === 'missingManager' || issueType === 'missingCore') {
      const projectRows = (await this.repository
        .createQueryBuilder('memberIssue')
        .select('memberIssue.projectId', 'projectId')
        .addSelect('SUM(CASE WHEN memberIssue.role = :managerRole THEN 1 ELSE 0 END)', 'managerCount')
        .addSelect('SUM(CASE WHEN memberIssue.isCore = :coreValue THEN 1 ELSE 0 END)', 'coreCount')
        .where('memberIssue.is_delete IS NULL')
        .andWhere('memberIssue.isActive = :isActive', {
          isActive: '1',
          managerRole: ProjectMemberRole.manager,
          coreValue: '1',
        })
        .groupBy('memberIssue.projectId')
        .getRawMany()) as Array<{ projectId: string; managerCount: string; coreCount: string }>

      const targetProjectIds = projectRows
        .filter((item) => {
          if (issueType === 'missingManager') {
            return Number(item.managerCount || 0) === 0
          }
          return Number(item.coreCount || 0) === 0
        })
        .map((item) => item.projectId)

      if (!targetProjectIds.length) {
        return {
          list: [],
          rows: [],
          data: [],
          total: 0,
          pageNum,
          pageSize,
        } as ResponseListDto<ProjectMember>
      }

      qb.andWhere('member.projectId IN (:...targetProjectIds)', { targetProjectIds })
    }

    qb.orderBy('member.sort', 'ASC').addOrderBy('member.createTime', 'DESC')

    const [list, total] = await qb
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()

    return {
      list,
      rows: list,
      data: list,
      total,
      pageNum,
      pageSize,
    } as ResponseListDto<ProjectMember>
  }

  async getStats() {
    const activeWhere = { isDelete: null as any, isActive: '1' }
    const [totalMembers, coreMembers] = await Promise.all([
      this.repository.count({ where: activeWhere as any }),
      this.repository.count({ where: { ...activeWhere, isCore: '1' } as any }),
    ])

    const distinctProjects = (await this.repository
      .createQueryBuilder('member')
      .select('COUNT(DISTINCT member.projectId)', 'count')
      .where('member.is_delete IS NULL')
      .andWhere('member.isActive = :isActive', { isActive: '1' })
      .getRawOne()) as { count: string }

    const projectRows = (await this.repository
      .createQueryBuilder('member')
      .select('member.projectId', 'projectId')
      .addSelect('SUM(CASE WHEN member.role = :managerRole THEN 1 ELSE 0 END)', 'managerCount')
      .addSelect('SUM(CASE WHEN member.isCore = :coreValue THEN 1 ELSE 0 END)', 'coreCount')
      .where('member.is_delete IS NULL')
      .andWhere('member.isActive = :isActive', { isActive: '1', managerRole: ProjectMemberRole.manager, coreValue: '1' })
      .groupBy('member.projectId')
      .orderBy('member.projectId', 'ASC')
      .getRawMany()) as Array<{ projectId: string; managerCount: string; coreCount: string }>

    const missingManagerProjects = projectRows.filter((item) => Number(item.managerCount || 0) === 0).length
    const missingCoreProjects = projectRows.filter((item) => Number(item.coreCount || 0) === 0).length

    return {
      totalMembers,
      projectCount: Number(distinctProjects?.count || 0),
      coreMembers,
      missingManagerProjects,
      missingCoreProjects,
    }
  }

  async getProjectOverview(query: QueryListDto) {
    const pageNum = Number(query.pageNum || 1)
    const pageSize = Number(query.pageSize || 10)
    const keyword = String(query.keyword || '').trim()
    const projectStatus = String((query as any).projectStatus || '').trim()
    const issueType = String((query as any).issueType || '').trim()

    const qb = this.repository
      .createQueryBuilder('member')
      .leftJoin('member.project', 'project')
      .select('member.projectId', 'projectId')
      .addSelect('project.name', 'projectName')
      .addSelect('project.code', 'projectCode')
      .addSelect('project.status', 'projectStatus')
      .addSelect('COUNT(member.id)', 'memberCount')
      .addSelect('SUM(CASE WHEN member.isCore = :coreValue THEN 1 ELSE 0 END)', 'coreMemberCount')
      .addSelect('SUM(CASE WHEN member.role = :managerRole THEN 1 ELSE 0 END)', 'managerCount')
      .where('member.is_delete IS NULL')
      .andWhere('member.isActive = :isActive', {
        isActive: '1',
        coreValue: '1',
        managerRole: ProjectMemberRole.manager,
      })

    if (projectStatus) {
      qb.andWhere('project.status = :projectStatus', { projectStatus })
    }
    if (keyword) {
      qb.andWhere('(project.name LIKE :keyword OR project.code LIKE :keyword)', { keyword: `%${keyword}%` })
    }

    qb.groupBy('member.projectId')
      .addGroupBy('project.name')
      .addGroupBy('project.code')
      .addGroupBy('project.status')
      .orderBy('member.projectId', 'ASC')

    if (issueType === 'missingManager') {
      qb.having('SUM(CASE WHEN member.role = :managerRole THEN 1 ELSE 0 END) = 0', { managerRole: ProjectMemberRole.manager })
    }
    if (issueType === 'missingCore') {
      qb.having('SUM(CASE WHEN member.isCore = :coreValue THEN 1 ELSE 0 END) = 0', { coreValue: '1' })
    }

    const rows = (await qb.getRawMany()) as Array<{
      projectId: string
      projectName: string
      projectCode: string
      projectStatus: string
      memberCount: string
      coreMemberCount: string
      managerCount: string
    }>

    const list = rows.map((item) => ({
      projectId: item.projectId,
      projectName: item.projectName,
      projectCode: item.projectCode,
      projectStatus: item.projectStatus,
      memberCount: Number(item.memberCount || 0),
      coreMemberCount: Number(item.coreMemberCount || 0),
      managerCount: Number(item.managerCount || 0),
      missingManager: Number(item.managerCount || 0) === 0,
      missingCore: Number(item.coreMemberCount || 0) === 0,
    }))

    const pagedList = list.slice((pageNum - 1) * pageSize, pageNum * pageSize)

    return {
      list: pagedList,
      rows: pagedList,
      data: pagedList,
      total: list.length,
      pageNum,
      pageSize,
    }
  }

  /**
   * 添加项目成员
   */
  async addMember(data: ProjectMemberDto): Promise<ProjectMember> {
    // 同一项目内同一用户只保留一条成员记录
    const existing = await this.repository.findOne({ 
      where: { 
        projectId: data.projectId, 
        userId: data.userId 
      } 
    })
    
    if (existing && existing.isDelete === null) {
      throw new Error('该用户已是项目成员')
    }

    if (existing) {
      await this.repository.update(existing.id, {
        ...data,
        isDelete: null as any,
        isActive: '1',
      })
      return this.getOne({ id: existing.id })
    }

    return this.add(data)
  }

  /**
   * 更新成员角色
   */
  async updateMember(id: string, data: UpdateProjectMemberDto): Promise<ProjectMember> {
    await this.update({ id, ...data })
    return this.getOne({ id })
  }

  /**
   * 移除项目成员
   */
  async removeMember(id: string): Promise<any> {
    return this.del([id])
  }

  /**
   * 获取项目成员列表
   */
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return this.repository.find({
      where: { projectId, isActive: '1' },
      relations: ['user'],
    })
  }

  /**
   * 检查用户是否为项目成员
   */
  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.repository.findOne({
      where: { projectId, userId, isActive: '1' }
    })
    return !!member
  }

  /**
   * 检查用户是否为项目经理
   */
  async isProjectManager(projectId: string, userId: string): Promise<boolean> {
    const member = await this.repository.findOne({
      where: { projectId, userId, role: ProjectMemberRole.manager, isActive: '1' }
    })
    return !!member
  }

  /**
   * 获取用户参与的项目列表
   */
  async getUserProjects(userId: string): Promise<ProjectMember[]> {
    return this.repository.find({
      where: { userId, isActive: '1' },
      relations: ['project'],
    })
  }
}
