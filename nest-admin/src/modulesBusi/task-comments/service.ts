import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { TaskComment } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { TaskCommentDto, UpdateTaskCommentDto } from './dto'

@Injectable()
export class TaskCommentsService extends BaseService<TaskComment, TaskCommentDto> {
  constructor(@InjectRepository(TaskComment) repository: Repository<TaskComment>) {
    super(TaskComment, repository)
  }

  async list(query: QueryListDto): Promise<ResponseListDto<TaskComment>> {
    let { taskId, userId } = query
    let queryOrm: FindManyOptions = {
      where: {
        taskId,
        userId,
      },
      relations: ['user', 'task'],
      order: {
        createTime: 'DESC'
      }
    }
    return this.listBy(queryOrm, query)
  }

  /**
   * 添加任务评论
   */
  async addComment(data: TaskCommentDto, userId: string): Promise<TaskComment> {
    const commentData = {
      ...data,
      userId
    }
    return this.add(commentData)
  }

  /**
   * 更新评论
   */
  async updateComment(id: string, data: UpdateTaskCommentDto, userId: string): Promise<TaskComment> {
    // 检查是否是评论作者
    const comment = await this.getOne({ id })
    if (comment.userId !== userId) {
      throw new Error('只能编辑自己的评论')
    }

    await this.update({ 
      id,
      ...data, 
      isEdited: '1' 
    })
    return this.getOne({ id })
  }

  /**
   * 删除评论
   */
  async deleteComment(id: string, userId: string): Promise<any> {
    // 检查是否是评论作者
    const comment = await this.getOne({ id })
    if (comment.userId !== userId) {
      throw new Error('只能删除自己的评论')
    }

    return this.del([id])
  }

  /**
   * 获取任务的所有评论
   */
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return this.repository.find({
      where: { taskId },
      relations: ['user'],
      order: {
        createTime: 'ASC'
      }
    })
  }

  /**
   * 获取用户的评论列表
   */
  async getUserComments(userId: string): Promise<TaskComment[]> {
    return this.repository.find({
      where: { userId },
      relations: ['task'],
      order: {
        createTime: 'DESC'
      }
    })
  }
}
