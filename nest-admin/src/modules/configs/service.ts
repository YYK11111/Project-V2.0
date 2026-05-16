import { Injectable } from "@nestjs/common";
import { SystenConfigDto } from "./dto";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Like, Repository, UpdateResult } from "typeorm";
import { SystenConfig } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { SysFileService } from "src/modules/sys/file/service";
import { BusinessType } from "src/modules/sys/file/entity";
import { MESSAGE_SCENE_KEYS } from "../messages/message-scenes";

@Injectable()
export class SystenConfigsService extends BaseService<
  SystenConfig,
  SystenConfigDto
> {
  constructor(
    @InjectRepository(SystenConfig) repository: Repository<SystenConfig>,
    protected readonly sysFileService: SysFileService,
  ) {
    super(SystenConfig, repository);
  }

  async save(createDto: SystenConfigDto) {
    const previousConfig = await this.getLatestConfig();
    const savedConfig = await super.save(createDto);
    await this.syncBrandingFiles(previousConfig, savedConfig);
    return savedConfig;
  }

  async getSessionExpireMinutes() {
    const config = await this.repository.findOne({
      where: { isDelete: null as any } as any,
      order: { createTime: "DESC" as any },
    });
    const value = Number(config?.sessionExpireMinutes || 0);
    return Number.isFinite(value) && value > 0 ? value : 30;
  }

  async list(query: QueryListDto): Promise<ResponseListDto<SystenConfig>> {
    return this.listBy(
      {
        where: { isDelete: null as any } as any,
        order: { createTime: "DESC" as any },
      },
      query,
    );
  }

  async getDefaultUserPassword() {
    const config = await this.getLatestConfig();
    return String(config?.defaultUserPassword || "").trim();
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

  getDefaultExternalNotifyConfig() {
    return {
      enabled: false,
      siteUrl: "",
      feishu: {
        enabled: false,
        appId: "",
        appSecret: "",
        baseUrl: "https://open.feishu.cn",
        enabledScenes: [MESSAGE_SCENE_KEYS.workflowApprovalTodo],
      },
      dingtalk: {
        enabled: false,
        appKey: "",
        appSecret: "",
        baseUrl: "https://oapi.dingtalk.com",
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

  mergeExternalNotifyConfig(config?: Record<string, any>) {
    const defaults = this.getDefaultExternalNotifyConfig();
    return {
      ...defaults,
      ...(config || {}),
      feishu: {
        ...defaults.feishu,
        ...(config?.feishu || {}),
      },
      dingtalk: {
        ...defaults.dingtalk,
        ...(config?.dingtalk || {}),
      },
    };
  }

  mergeExternalNotifyRuntimeConfig(config?: Record<string, any>) {
    const defaults = this.getDefaultExternalNotifyConfig();
    if (!config) {
      return {
        ...defaults,
        enabled:
          process.env.FEISHU_ENABLED === "true" ||
          process.env.DINGTALK_ENABLED === "true",
        feishu: {
          ...defaults.feishu,
          enabled: process.env.FEISHU_ENABLED === "true",
          appId: process.env.FEISHU_APP_ID || "",
          appSecret: process.env.FEISHU_APP_SECRET || "",
          baseUrl: process.env.FEISHU_BASE_URL || defaults.feishu.baseUrl,
          enabledScenes: defaults.feishu.enabledScenes,
        },
        dingtalk: {
          ...defaults.dingtalk,
          enabled: process.env.DINGTALK_ENABLED === "true",
          appKey: process.env.DINGTALK_APP_KEY || "",
          appSecret: process.env.DINGTALK_APP_SECRET || "",
          baseUrl: process.env.DINGTALK_BASE_URL || defaults.dingtalk.baseUrl,
        },
      };
    }
    return this.mergeExternalNotifyConfig(config);
  }

  async getLatestConfig() {
    return this.repository.findOne({
      where: { isDelete: null as any } as any,
      order: { createTime: "DESC" as any },
    });
  }

  private async syncBrandingFiles(
    previousConfig?: Pick<SystenConfig, "systemLogo" | "browserIcon"> | null,
    savedConfig?: Pick<
      SystenConfig,
      "id" | "systemLogo" | "browserIcon"
    > | null,
  ) {
    if (!savedConfig?.id) return;

    const nextPaths = this.normalizeBrandingPaths(
      this.getBrandingPaths(savedConfig),
    );
    const previousPaths = this.normalizeBrandingPaths(
      this.getBrandingPaths(previousConfig),
    );

    for (const path of nextPaths) {
      const file = await this.sysFileService.findByPath(path);
      if (!file?.id) continue;
      await this.sysFileService.associateFiles({
        businessType: BusinessType.SystemConfig,
        businessId: savedConfig.id,
        fileIds: [file.id],
      });
    }

    for (const path of previousPaths) {
      if (nextPaths.includes(path)) continue;
      await this.sysFileService.softDeleteByPath(path);
    }
  }

  private getBrandingPaths(
    config?: Pick<SystenConfig, "systemLogo" | "browserIcon"> | null,
  ) {
    return [config?.systemLogo, config?.browserIcon];
  }

  private normalizeBrandingPaths(paths: Array<string | null | undefined>) {
    return Array.from(
      new Set(
        paths
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .filter((item) => !this.isExternalPath(item)),
      ),
    );
  }

  private isExternalPath(value: string) {
    return /^https?:\/\//i.test(value);
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

  async getExternalNotifyConfig() {
    const config = await this.getLatestConfig();
    return this.mergeExternalNotifyConfig(config?.externalNotifyConfig);
  }

  async getExternalNotifyRuntimeConfig() {
    const config = await this.getLatestConfig();
    return this.mergeExternalNotifyRuntimeConfig(config?.externalNotifyConfig);
  }
}
