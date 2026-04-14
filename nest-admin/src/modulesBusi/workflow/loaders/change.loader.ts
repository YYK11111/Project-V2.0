import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectChange } from '../../changes/entity';
import { BusinessDataLoader } from './business-data-loader.interface';
import { BusinessData, FieldDefinition } from './business-data-loader.interface';

@Injectable()
export class ChangeLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(ProjectChange)
    private changeRepo: Repository<ProjectChange>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = businessKey.replace('change_', '');

    const change = await this.changeRepo.findOne({
      where: { id },
      relations: ['project', 'requester', 'approver'],
    });

    if (!change) {
      throw new Error(`Change not found: ${id}`);
    }

    return {
      id: change.id,
      type: 'change',
      data: {
        id: change.id,
        title: change.title,
        description: change.description,
        reason: change.reason,
        impactAnalysis: change.impactAnalysis,
        type: change.type,
        impact: change.impact,
        status: change.status,
        costImpact: change.costImpact,
        scheduleImpact: change.scheduleImpact,
        approvalComment: change.approvalComment,
        approvalDate: change.approvalDate,
        projectId: change.projectId,
        project: change.project ? {
          id: change.project.id,
          name: change.project.name,
          code: change.project.code,
          leaderId: change.project.leaderId,
        } : null,
        requesterId: change.requesterId,
        requester: change.requester ? {
          id: change.requester.id,
          nickname: change.requester.nickname,
          name: change.requester.name,
          deptId: change.requester.deptId,
        } : null,
        approverId: change.approverId,
        approver: change.approver ? {
          id: change.approver.id,
          nickname: change.approver.nickname,
          name: change.approver.name,
        } : null,
      },
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: 'id', label: '变更ID', type: 'string' },
      { name: 'title', label: '变更标题', type: 'string' },
      { name: 'description', label: '变更描述', type: 'string' },
      { name: 'reason', label: '变更原因', type: 'string' },
      { name: 'impactAnalysis', label: '影响分析', type: 'string' },
      { name: 'type', label: '变更类型', type: 'enum', enumValues: [
        { label: '范围变更', value: '1' },
        { label: '进度变更', value: '2' },
        { label: '预算变更', value: '3' },
        { label: '资源变更', value: '4' },
        { label: '需求变更', value: '5' },
        { label: '其他变更', value: '6' },
      ]},
      { name: 'impact', label: '影响程度', type: 'enum', enumValues: [
        { label: '低', value: '1' },
        { label: '中', value: '2' },
        { label: '高', value: '3' },
      ]},
      { name: 'status', label: '状态', type: 'enum', enumValues: [
        { label: '草稿', value: '1' },
        { label: '待审批', value: '2' },
        { label: '已批准', value: '3' },
        { label: '已驳回', value: '4' },
        { label: '已实施', value: '5' },
      ]},
      { name: 'costImpact', label: '成本影响', type: 'number' },
      { name: 'scheduleImpact', label: '进度影响(天)', type: 'number' },
      { name: 'approvalComment', label: '审批意见', type: 'string' },
      { name: 'approvalDate', label: '审批日期', type: 'date' },
      { name: 'projectId', label: '项目ID', type: 'string' },
      { name: 'project.name', label: '项目名称', type: 'relation', relationEntity: 'Project' },
      { name: 'project.code', label: '项目编号', type: 'relation', relationEntity: 'Project' },
      { name: 'project.leaderId', label: '关联项目负责人', type: 'string' },
      { name: 'requesterId', label: '变更申请人', type: 'string' },
      { name: 'requester.deptId', label: '申请人部门ID', type: 'string' },
      { name: 'approverId', label: '变更审批人', type: 'string' },
    ];
  }
}
