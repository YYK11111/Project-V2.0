import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Like, Repository } from 'typeorm'
import { BaseService } from 'src/common/BaseService'
import { Message, MessageType } from './entity'
import { MessageDto } from './dto'
import { BoolNum } from 'src/common/type/base'
import { WorkflowTask } from 'src/modulesBusi/workflow/entity/workflow-task.entity'
import { WorkflowInstance } from 'src/modulesBusi/workflow/entity/workflow-instance.entity'
import { QueryListDto } from 'src/common/dto'

@Injectable()
export class MessagesService extends BaseService<Message, MessageDto> {
  constructor(
    @InjectRepository(Message) repository: Repository<Message>,
    @InjectRepository(WorkflowTask) private workflowTaskRepo: Repository<WorkflowTask>,
    @InjectRepository(WorkflowInstance) private workflowInstanceRepo: Repository<WorkflowInstance>,
  ) {
    super(Message, repository)
  }

  async sendMessage(data: Partial<Message>) {
    return this.add({
      title: data.title,
      content: data.content,
      messageType: data.messageType,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      receiverId: data.receiverId,
      senderId: data.senderId,
      channel: data.channel || 'system',
      linkType: data.linkType || 'route',
      linkUrl: data.linkUrl || '',
      linkParams: data.linkParams || {},
      extraData: data.extraData || {},
      isRead: BoolNum.No,
      isActive: BoolNum.Yes,
    } as any)
  }

  async getUnreadCount(userId: string) {
    const [todo, cc] = await Promise.all([
      this.repository.count({ where: { receiverId: userId, isRead: BoolNum.No, isDelete: null as any, isActive: BoolNum.Yes, messageType: MessageType.todo } as any }),
      this.repository.count({ where: { receiverId: userId, isRead: BoolNum.No, isDelete: null as any, messageType: MessageType.cc } as any }),
    ])
    return { todo, cc, total: todo + cc }
  }

  async getRecentMessages(userId: string, limit = 10) {
    const list = await this.repository.find({
      where: { receiverId: userId, isDelete: null as any } as any,
      order: { isRead: 'ASC' as any, createTime: 'DESC' as any },
      take: limit * 4,
    })
    return {
      todo: list.filter((item) => item.messageType === MessageType.todo && item.isActive === BoolNum.Yes).slice(0, limit),
      cc: list.filter((item) => item.messageType === MessageType.cc && item.isRead === BoolNum.No).slice(0, limit),
    }
  }

  async getMessageList(userId: string, query: QueryListDto) {
    const pageNum = Number(query.pageNum || 1)
    const pageSize = Number(query.pageSize || 10)
    const messageType = String(query.messageType || '')
    const scope = String(query.scope || 'current')
    const keyword = String(query.keyword || '').trim()
    const sourceType = String(query.sourceType || '').trim()

    const where: Record<string, any> = {
      receiverId: userId,
      isDelete: null,
    }

    if (messageType) {
      where.messageType = messageType
    }
    if (sourceType) {
      where.sourceType = sourceType
    }

    if (messageType === MessageType.todo) {
      if (scope === 'current') {
        where.isActive = BoolNum.Yes
      } else if (scope === 'history') {
        where.isActive = BoolNum.No
      }
    }

    if (messageType === MessageType.cc) {
      if (scope === 'current') {
        where.isRead = BoolNum.No
      } else if (scope === 'history') {
        where.isRead = BoolNum.Yes
      }
    }

    const whereList = keyword
      ? [
          { ...where, title: Like(`%${keyword}%`) },
          { ...where, content: Like(`%${keyword}%`) },
        ]
      : where

    const [list, total] = await this.repository.findAndCount({
      where: whereList as any,
      order: { createTime: 'DESC' as any },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    })

    return {
      total,
      list,
    }
  }

  async markRead(id: string, userId: string) {
    await this.repository.update({ id, receiverId: userId } as any, { isRead: BoolNum.Yes as any, readTime: new Date().toISOString() } as any)
  }

  async deactivateWorkflowTaskMessages(taskIds: string[] | string) {
    const ids = (Array.isArray(taskIds) ? taskIds : [taskIds]).filter(Boolean).map((id) => String(id))
    if (!ids.length) return
    await this.repository.update(
      { sourceType: 'workflow_task', sourceId: In(ids) as any, isDelete: null as any } as any,
      { isActive: BoolNum.No as any, isRead: BoolNum.Yes as any, readTime: new Date().toISOString() } as any,
    )
  }

  async deactivateInactiveWorkflowTaskMessages() {
    const activeTodoMessages = await this.repository.find({
      where: { sourceType: 'workflow_task', messageType: MessageType.todo, isActive: BoolNum.Yes, isDelete: null as any } as any,
      select: ['id', 'sourceId'],
    })
    if (!activeTodoMessages.length) return 0

    const activeTaskIds = Array.from(new Set(activeTodoMessages.map((item) => String(item.sourceId)).filter(Boolean)))
    const pendingTasks = await this.workflowTaskRepo.find({
      where: activeTaskIds.map((id) => ({ id, status: '1' })) as any,
      select: ['id'],
    })
    const pendingTaskIdSet = new Set(pendingTasks.map((task) => String(task.id)))
    const staleMessageIds = activeTodoMessages
      .filter((item) => !pendingTaskIdSet.has(String(item.sourceId)))
      .map((item) => item.id)
    if (!staleMessageIds.length) return 0

    await this.repository.update(
      staleMessageIds as any,
      { isActive: BoolNum.No as any, isRead: BoolNum.Yes as any, readTime: new Date().toISOString() } as any,
    )
    return staleMessageIds.length
  }

  async ensureWorkflowTodoMessages() {
    await this.deactivateInactiveWorkflowTaskMessages()
    const pendingTasks = await this.workflowTaskRepo.find({ where: { status: '1' } as any })
    for (const task of pendingTasks) {
      const exists = await this.repository.findOne({ where: { sourceType: 'workflow_task', sourceId: task.id, receiverId: task.assigneeId, isDelete: null as any } as any })
      if (exists) continue
      const instance = await this.workflowInstanceRepo.findOne({ where: { id: task.instanceId } })
      await this.sendMessage({
        title: `待办审批：${task.nodeName}`,
        content: `您有一个新的审批任务待处理。`,
        messageType: MessageType.todo,
        sourceType: 'workflow_task',
        sourceId: task.id,
        receiverId: task.assigneeId,
        senderId: instance?.starterId || '',
        linkUrl: this.getBusinessRoute(instance?.businessKey || ''),
        linkParams: this.getBusinessRouteParams(instance?.businessKey || '', task.id, instance?.id),
      })
    }
  }

  private getBusinessRoute(businessKey: string) {
    const businessType = String(businessKey || '').split('_')[0]
    if (businessType === 'project') return '/projectManage/detail'
    if (businessType === 'change') return '/changeManage/form'
    if (businessType === 'ticket') return '/ticketManage/form'
    if (businessType === 'task') return '/taskManage/form'
    if (businessType === 'customer') return '/crm/customerManage/form'
    if (businessType === 'interaction') return '/crm/interactionManage/form'
    if (businessType === 'opportunity') return '/crm/opportunityManage/form'
    if (businessType === 'contract') return '/crm/contractManage/form'
    return ''
  }

  private getBusinessRouteParams(businessKey: string, taskId?: string, instanceId?: string) {
    const businessId = String(businessKey || '').split('_').pop()
    return {
      id: businessId,
      taskId: taskId || '',
      instanceId: instanceId || '',
      fromWorkflow: '1',
    }
  }
}
