import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { UserStory, UserStoryStatus } from './entities/user-story.entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'

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
        projectId,
        sprintId,
        status,
        type,
        parentId,
        assigneeId,
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
}