import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { TaskComment } from './entity'
import { QueryListDto, ResponseListDto } from 'src/common/dto'
import { BaseService } from 'src/common/BaseService'
import { TaskCommentDto, UpdateTaskCommentDto } from './dto'
import { Task } from '../tasks/entity'

@Injectable()
export class TaskCommentsService extends BaseService<TaskComment, TaskCommentDto> {
  constructor(
    @InjectRepository(TaskComment) repository: Repository<TaskComment>,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
  ) {
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
    if (!userId) {
      throw new BadRequestException('当前登录用户不存在')
    }
    if (!String(data.content || '').trim()) {
      throw new BadRequestException('评论内容不能为空')
    }
    const task = await this.taskRepository.findOne({ where: { id: data.taskId } as any })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }
    const commentData = {
      ...data,
      userId,
    }
    const saved = await this.add(commentData)
    return this.repository.findOne({ where: { id: saved.id } as any, relations: ['user', 'task'] })
  }

  /**
   * 更新评论
   */
  async updateComment(id: string, data: UpdateTaskCommentDto, userId: string): Promise<TaskComment> {
    if (!String(data.content || '').trim()) {
      throw new BadRequestException('评论内容不能为空')
    }
    const comment = await this.repository.findOne({ where: { id } as any, relations: ['user', 'task'] })
    if (!comment) {
      throw new NotFoundException('评论不存在')
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('只能编辑自己的评论')
    }

    await this.update({
      id,
      ...data,
      isEdited: '1',
    })
    return this.repository.findOne({ where: { id } as any, relations: ['user', 'task'] })
  }

  /**
   * 删除评论
   */
  async deleteComment(id: string, userId: string): Promise<any> {
    const comment = await this.repository.findOne({ where: { id } as any })
    if (!comment) {
      throw new NotFoundException('评论不存在')
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('只能删除自己的评论')
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
