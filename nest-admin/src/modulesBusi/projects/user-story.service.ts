import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { UserStory, UserStoryStatus } from './entities/user-story.entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { User } from 'src/modules/users/entities/user.entity'

@Injectable()
export class UserStoryService extends BaseService<UserStory, any> {
  constructor(
    @InjectRepository(UserStory) repository: Repository<UserStory>,
  ) {
    super(UserStory, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<UserStory>> {
    let { projectId, sprintId, status, type, parentId, assigneeId } = query
    let queryOrm: FindManyOptions = {
      where: {
        projectId: projectId || undefined,
        sprintId: sprintId || undefined,
        status: status || undefined,
        type: type || undefined,
        parentId: parentId || undefined,
        assigneeId: assigneeId || undefined,
      },
      relations: ['project', 'sprint', 'assignee', 'reporter', 'parent'],
      order: { priority: 'ASC', createTime: 'DESC' },
    }
    return this.listBy(queryOrm, query)
  }

  async getBacklog(projectIds: string[]): Promise<UserStory[]> {
    if (!projectIds || projectIds.length === 0) {
      return []
    }
    
    const queryOrm: FindManyOptions = {
      where: {
        projectId: projectIds as any,
        sprintId: null as any,
        status: UserStoryStatus.backlog,
      },
      relations: ['project', 'assignee'],
      order: { priority: 'ASC', createTime: 'DESC' },
    }
    const result = await this.listBy(queryOrm, { pageNum: 1, pageSize: 1000 })
    return result.data || []
  }

  async assignToSprint(storyId: string, sprintId: string): Promise<UserStory> {
    const story = await this.getOne({ id: storyId })
    if (!story) {
      throw new Error('用户故事不存在')
    }
    story.sprintId = sprintId
    story.status = UserStoryStatus.selected
    return this.repository.save(story)
  }

  async removeFromSprint(storyId: string): Promise<UserStory> {
    const story = await this.getOne({ id: storyId })
    if (!story) {
      throw new Error('用户故事不存在')
    }
    story.sprintId = null
    story.status = UserStoryStatus.backlog
    return this.repository.save(story)
  }

  async updateStatus(storyId: string, status: UserStoryStatus): Promise<UserStory> {
    const story = await this.getOne({ id: storyId })
    if (!story) {
      throw new Error('用户故事不存在')
    }
    story.status = status
    if (status === UserStoryStatus.done || status === UserStoryStatus.accepted) {
      story.completedDate = new Date().toISOString().split('T')[0]
    }
    return this.repository.save(story)
  }

  async getChildren(parentId: string): Promise<UserStory[]> {
    const result = await this.listBy(
      { where: { parentId }, relations: ['assignee'], order: { priority: 'ASC' } },
      { pageNum: 1, pageSize: 100 }
    )
    return result.data || []
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

  private mapSprintSummary(sprint?: any) {
    if (!sprint) return null
    return {
      id: sprint.id,
      name: sprint.name,
    }
  }

  private mapStorySummary(story?: UserStory | null) {
    if (!story) return null
    return {
      id: story.id,
      title: story.title,
    }
  }

  async getOne(query, isError = true): Promise<any | null> {
    const story = await super.getOne(
      {
        where: query,
        relations: ['project', 'sprint', 'assignee', 'reporter', 'parent'],
      },
      isError,
    )
    if (!story) return story

    return {
      ...story,
      project: this.mapProjectSummary(story.project),
      sprint: this.mapSprintSummary(story.sprint),
      assignee: this.mapUserSummary(story.assignee),
      reporter: this.mapUserSummary(story.reporter),
      parent: this.mapStorySummary(story.parent),
    }
  }
}
