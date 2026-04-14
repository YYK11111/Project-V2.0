import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Like, Repository } from 'typeorm'
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
    let { projectId, userId, role, isActive } = query
    let queryOrm: FindManyOptions = {
      where: {
        projectId: this.sqlLike(projectId),
        userId: this.sqlLike(userId),
        role,
        isActive,
      },
      relations: ['user', 'project'],
      order: { sort: 'ASC', createTime: 'ASC' },
    }
    return this.listBy(queryOrm, query)
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
