import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entity';
import { BusinessDataLoader } from './business-data-loader.interface';
import { BusinessData, FieldDefinition } from './business-data-loader.interface';

@Injectable()
export class TicketLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = businessKey.replace('ticket_', '');

    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['project', 'task', 'submitter', 'handler'],
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`);
    }

    return {
      id: ticket.id,
      type: 'ticket',
      data: {
        id: ticket.id,
        title: ticket.title,
        type: ticket.type,
        status: ticket.status,
        severity: ticket.severity,
        content: ticket.content,
        solution: ticket.solution,
        environment: ticket.environment,
        rootCause: ticket.rootCause,
        rootCauseCategory: ticket.rootCauseCategory,
        foundInVersion: ticket.foundInVersion,
        fixedInVersion: ticket.fixedInVersion,
        reopenedCount: ticket.reopenedCount,
        projectId: ticket.projectId,
        project: ticket.project ? {
          id: ticket.project.id,
          name: ticket.project.name,
          code: ticket.project.code,
        } : null,
        taskId: ticket.taskId,
        task: ticket.task ? {
          id: ticket.task.id,
          name: ticket.task.name,
        } : null,
        submitterId: ticket.submitterId,
        submitter: ticket.submitter ? {
          id: ticket.submitter.id,
          nickname: ticket.submitter.nickname,
          name: ticket.submitter.name,
          deptId: ticket.submitter.deptId,
        } : null,
        handlerId: ticket.handlerId,
        handler: ticket.handler ? {
          id: ticket.handler.id,
          nickname: ticket.handler.nickname,
          name: ticket.handler.name,
          deptId: ticket.handler.deptId,
        } : null,
      },
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: 'id', label: '工单ID', type: 'string' },
      { name: 'title', label: '工单标题', type: 'string' },
      { name: 'type', label: '类型', type: 'enum', enumValues: [
        { label: '缺陷', value: '1' },
        { label: '需求', value: '2' },
        { label: '反馈', value: '3' },
      ]},
      { name: 'status', label: '状态', type: 'enum', enumValues: [
        { label: '待处理', value: '1' },
        { label: '处理中', value: '2' },
        { label: '已解决', value: '3' },
        { label: '已关闭', value: '4' },
      ]},
      { name: 'severity', label: '严重程度', type: 'enum', enumValues: [
        { label: '致命', value: '1' },
        { label: '高', value: '2' },
        { label: '中', value: '3' },
        { label: '低', value: '4' },
      ]},
      { name: 'content', label: '工单内容', type: 'string' },
      { name: 'solution', label: '解决方案', type: 'string' },
      { name: 'rootCause', label: '根因分析', type: 'string' },
      { name: 'rootCauseCategory', label: '根因分类', type: 'enum', enumValues: [
        { label: '代码缺陷', value: '1' },
        { label: '设计问题', value: '2' },
        { label: '需求遗漏', value: '3' },
        { label: '测试不足', value: '4' },
        { label: '环境问题', value: '5' },
        { label: '其他', value: '6' },
      ]},
      { name: 'foundInVersion', label: '发现版本', type: 'string' },
      { name: 'fixedInVersion', label: '修复版本', type: 'string' },
      { name: 'reopenedCount', label: '重新打开次数', type: 'number' },
      { name: 'projectId', label: '项目ID', type: 'string' },
      { name: 'project.name', label: '项目名称', type: 'relation', relationEntity: 'Project' },
      { name: 'taskId', label: '任务ID', type: 'string' },
      { name: 'task.name', label: '任务名称', type: 'relation', relationEntity: 'Task' },
      { name: 'submitterId', label: '工单提交人', type: 'string' },
      { name: 'submitter.deptId', label: '提交人部门ID', type: 'string' },
      { name: 'handlerId', label: '工单处理人', type: 'string' },
      { name: 'handler.deptId', label: '处理人部门ID', type: 'string' },
    ];
  }
}
