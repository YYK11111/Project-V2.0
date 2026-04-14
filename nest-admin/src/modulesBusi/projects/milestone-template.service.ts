import { Injectable } from '@nestjs/common'
import { ProjectType } from './entity'

type MilestoneTemplateItem = {
  name: string
  sort: number
}

@Injectable()
export class ProjectMilestoneTemplateService {
  getTemplates(projectType: string): MilestoneTemplateItem[] {
    const templates: Record<string, MilestoneTemplateItem[]> = {
      [ProjectType.implementation]: [
        { name: '项目启动', sort: 10 },
        { name: '需求调研完成', sort: 20 },
        { name: '实施方案确认', sort: 30 },
        { name: '系统配置完成', sort: 40 },
        { name: '联调完成', sort: 50 },
        { name: '培训完成', sort: 60 },
        { name: 'UAT完成', sort: 70 },
        { name: '上线完成', sort: 80 },
        { name: '验收完成', sort: 90 },
        { name: '结项完成', sort: 100 },
      ],
      [ProjectType.customDevelopment]: [
        { name: '项目启动', sort: 10 },
        { name: '需求评审通过', sort: 20 },
        { name: '方案设计评审通过', sort: 30 },
        { name: '开发完成', sort: 40 },
        { name: 'SIT完成', sort: 50 },
        { name: 'UAT完成', sort: 60 },
        { name: '上线审批通过', sort: 70 },
        { name: '上线完成', sort: 80 },
        { name: '验收完成', sort: 90 },
        { name: '结项完成', sort: 100 },
      ],
      [ProjectType.operations]: [
        { name: '服务启动', sort: 10 },
        { name: '运维交接完成', sort: 20 },
        { name: '巡检机制建立', sort: 30 },
        { name: '首月服务评估', sort: 40 },
        { name: '阶段服务复盘', sort: 50 },
        { name: '周期验收', sort: 60 },
        { name: '服务结项', sort: 70 },
      ],
    }

    return templates[projectType] || templates[ProjectType.implementation]
  }
}
