import { Injectable } from "@nestjs/common";
import { SystenConfigDto } from "./dto";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Like, Repository, UpdateResult } from "typeorm";
import { SystenConfig } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";

@Injectable()
export class SystenConfigsService extends BaseService<
  SystenConfig,
  SystenConfigDto
> {
  constructor(
    @InjectRepository(SystenConfig) repository: Repository<SystenConfig>,
  ) {
    super(SystenConfig, repository);
  }

  async getSessionExpireMinutes() {
    const config = await this.repository.findOne({
      where: { isDelete: null as any } as any,
      order: { createTime: "DESC" as any },
    });
    const value = Number(config?.sessionExpireMinutes || 0);
    return Number.isFinite(value) && value > 0 ? value : 30;
  }

  getDefaultProjectReminderStrategy() {
    return {
      enabled: true,
      delivery: {
        messageCenter: true,
      },
      roles: {
        projectManager: true,
        deliveryManager: true,
        coreMember: false,
      },
      frequency: {
        mode: "interval",
        hours: 24,
      },
      trendThresholds: {
        enabled: true,
        windowSize: 3,
        healthDeclineStep: 5,
        riskIncreaseStep: 1,
        costVarianceIncreaseStep: 1000,
      },
      rules: {
        taskOverdue: true,
        taskDueSoon: true,
        milestoneDelayed: true,
        sprintDelayed: true,
        highRisk: true,
        changePending: true,
        unplannedTask: true,
        closureIncomplete: true,
      },
    };
  }

  getDefaultProjectFieldPermissionMatrix() {
    return {
      project: {
        projectManager: {
          projectBasic: "editable",
          projectMember: "editable",
          projectPlan: "editable",
          projectBusiness: "editable",
          projectClosure: "editable",
          projectKnowledge: "editable",
        },
        deliveryManager: {
          projectBasic: "readonly",
          projectMember: "editable",
          projectPlan: "editable",
          projectBusiness: "readonly",
          projectClosure: "editable",
          projectKnowledge: "editable",
        },
        ownerRole: {
          projectBasic: "readonly",
          projectMember: "readonly",
          projectPlan: "readonly",
          projectBusiness: "hidden",
          projectClosure: "readonly",
          projectKnowledge: "editable",
        },
        member: {
          projectBasic: "readonly",
          projectMember: "readonly",
          projectPlan: "readonly",
          projectBusiness: "hidden",
          projectClosure: "hidden",
          projectKnowledge: "readonly",
        },
        visitor: {
          projectBasic: "readonly",
          projectMember: "hidden",
          projectPlan: "hidden",
          projectBusiness: "hidden",
          projectClosure: "hidden",
          projectKnowledge: "readonly",
        },
      },
    };
  }

  mergeProjectFieldPermissionMatrix(matrix?: Record<string, any>) {
    const defaults = this.getDefaultProjectFieldPermissionMatrix();
    return {
      ...defaults,
      ...(matrix || {}),
      project: {
        ...defaults.project,
        ...(matrix?.project || {}),
        projectManager: {
          ...defaults.project.projectManager,
          ...(matrix?.project?.projectManager || {}),
        },
        deliveryManager: {
          ...defaults.project.deliveryManager,
          ...(matrix?.project?.deliveryManager || {}),
        },
        ownerRole: {
          ...defaults.project.ownerRole,
          ...(matrix?.project?.ownerRole || {}),
        },
        member: {
          ...defaults.project.member,
          ...(matrix?.project?.member || {}),
        },
        visitor: {
          ...defaults.project.visitor,
          ...(matrix?.project?.visitor || {}),
        },
      },
    };
  }

  async getLatestConfig() {
    return this.repository.findOne({
      where: { isDelete: null as any } as any,
      order: { createTime: "DESC" as any },
    });
  }

  async getProjectReminderStrategy() {
    const config = await this.getLatestConfig();
    return {
      ...this.getDefaultProjectReminderStrategy(),
      ...(config?.projectReminderStrategy || {}),
      delivery: {
        ...this.getDefaultProjectReminderStrategy().delivery,
        ...(config?.projectReminderStrategy?.delivery || {}),
      },
      roles: {
        ...this.getDefaultProjectReminderStrategy().roles,
        ...(config?.projectReminderStrategy?.roles || {}),
      },
      frequency: {
        ...this.getDefaultProjectReminderStrategy().frequency,
        ...(config?.projectReminderStrategy?.frequency || {}),
      },
      trendThresholds: {
        ...this.getDefaultProjectReminderStrategy().trendThresholds,
        ...(config?.projectReminderStrategy?.trendThresholds || {}),
      },
      rules: {
        ...this.getDefaultProjectReminderStrategy().rules,
        ...(config?.projectReminderStrategy?.rules || {}),
      },
    };
  }

  async getProjectFieldPermissionMatrix() {
    const config = await this.getLatestConfig();
    return this.mergeProjectFieldPermissionMatrix(
      config?.projectFieldPermissionMatrix,
    );
  }
}
