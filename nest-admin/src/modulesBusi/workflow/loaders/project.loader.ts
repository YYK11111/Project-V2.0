import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../projects/entity';
import { ProjectMember, ProjectMemberRole } from '../../project-members/entity';
import { BusinessDataLoader } from './business-data-loader.interface';
import { BusinessData, FieldDefinition } from './business-data-loader.interface';

@Injectable()
export class ProjectLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private projectMemberRepo: Repository<ProjectMember>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = businessKey.replace('project_', '');

    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['leader', 'customer'],
    });

    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    const members = await this.projectMemberRepo.find({
      where: { projectId: id, isActive: '1' },
      relations: ['user'],
      order: { sort: 'ASC', createTime: 'ASC' },
    })

    const normalizedMembers = members.map((member) => ({
      id: member.id,
      role: member.role,
      isCore: member.isCore,
      remark: member.remark,
      sort: member.sort,
      user: member.user
        ? {
            id: member.user.id,
            nickname: member.user.nickname,
            name: member.user.name,
          }
        : null,
    }))

    const memberGroups = Object.values(ProjectMemberRole).reduce((acc, role) => {
      acc[role] = normalizedMembers.filter((item) => item.role === role).map((item) => item.user?.id).filter(Boolean)
      return acc
    }, {} as Record<string, string[]>)

    return {
      id: project.id,
      type: 'project',
      data: {
        id: project.id,
        name: project.name,
        code: project.code,
        budget: project.budget,
        actualCost: project.actualCost,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        leader: project.leader ? {
          id: project.leader.id,
          nickname: project.leader.nickname,
          name: project.leader.name,
          deptId: project.leader.deptId,
        } : null,
        customer: project.customer ? {
          id: project.customer.id,
          name: project.customer.name,
          shortName: project.customer.shortName,
        } : null,
        members: normalizedMembers,
        memberGroups,
      },
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: 'id', label: '项目ID', type: 'string' },
      { name: 'name', label: '项目名称', type: 'string' },
      { name: 'code', label: '项目编号', type: 'string' },
      { name: 'budget', label: '预算', type: 'number' },
      { name: 'actualCost', label: '实际成本', type: 'number' },
      { name: 'status', label: '状态', type: 'enum', enumValues: [
        { label: '草稿', value: '1' },
        { label: '立项审批中', value: '2' },
        { label: '执行中', value: '3' },
        { label: '暂停中', value: '4' },
        { label: '结项审批中', value: '5' },
        { label: '已结项', value: '6' },
        { label: '已取消', value: '7' },
      ]},
      { name: 'priority', label: '优先级', type: 'enum', enumValues: [
        { label: '低', value: '1' },
        { label: '中', value: '2' },
        { label: '高', value: '3' },
      ]},
      { name: 'progress', label: '进度(%)', type: 'number' },
      { name: 'startDate', label: '开始日期', type: 'date' },
      { name: 'endDate', label: '结束日期', type: 'date' },
      { name: 'leader.id', label: '负责人ID', type: 'string' },
      { name: 'leader.nickname', label: '负责人姓名', type: 'relation', relationEntity: 'User' },
      { name: 'leader.name', label: '负责人用户名', type: 'relation', relationEntity: 'User' },
      { name: 'leader.deptId', label: '负责人部门ID', type: 'string' },
      { name: `memberGroups.${ProjectMemberRole.manager}`, label: '项目成员-项目经理', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.deliveryManager}`, label: '项目成员-交付经理', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.techLead}`, label: '项目成员-技术负责人', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.implementationLead}`, label: '项目成员-实施负责人', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.testLead}`, label: '项目成员-测试负责人', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.customerContact}`, label: '项目成员-客户联系人', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.businessContact}`, label: '项目成员-商务接口人', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.developer}`, label: '项目成员-开发工程师', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.implementationConsultant}`, label: '项目成员-实施顾问', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.tester}`, label: '项目成员-测试工程师', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.operationsEngineer}`, label: '项目成员-运维工程师', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.trainer}`, label: '项目成员-培训顾问', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.dataMigrationEngineer}`, label: '项目成员-数据迁移工程师', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.onsiteSupport}`, label: '项目成员-驻场支持', type: 'array' },
      { name: `memberGroups.${ProjectMemberRole.member}`, label: '项目成员-普通成员', type: 'array' },
      { name: 'customer.id', label: '客户ID', type: 'string' },
      { name: 'customer.name', label: '客户名称', type: 'relation', relationEntity: 'Customer' },
      { name: 'customer.shortName', label: '客户简称', type: 'relation', relationEntity: 'Customer' },
    ];
  }
}
