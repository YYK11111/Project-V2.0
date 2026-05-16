import { Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, LessThan, Like, Repository } from "typeorm";
import { BaseService } from "src/common/BaseService";
import { Message, MessageType } from "./entity";
import { MessageDto } from "./dto";
import { BoolNum } from "src/common/type/base";
import { WorkflowTask } from "src/modulesBusi/workflow/entity/workflow-task.entity";
import { WorkflowInstance } from "src/modulesBusi/workflow/entity/workflow-instance.entity";
import { QueryListDto } from "src/common/dto";
import { SystenConfigsService } from "../configs/service";
import { ExternalNotifyService } from "../external-notify/service";
import { WorkflowTodoCardStatusOptions } from "../external-notify/provider.interface";
import { getMessageScene, MessageScene } from "./message-scenes";
import dayjs from "dayjs";

@Injectable()
export class MessagesService extends BaseService<Message, MessageDto> {
  constructor(
    @InjectRepository(Message) repository: Repository<Message>,
    @InjectRepository(WorkflowTask)
    private workflowTaskRepo: Repository<WorkflowTask>,
    @InjectRepository(WorkflowInstance)
    private workflowInstanceRepo: Repository<WorkflowInstance>,
    private readonly systemConfigsService: SystenConfigsService,
    @Optional()
    private readonly externalNotifyService?: ExternalNotifyService,
  ) {
    super(Message, repository);
  }

  async sendMessage(data: Partial<Message>) {
    const notificationId = data.notificationId || this.generateNotificationId();
    const message = await this.add({
      notificationId,
      title: data.title,
      content: data.content,
      messageType: data.messageType,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      receiverId: data.receiverId,
      senderId: data.senderId,
      channel: data.channel || "system",
      linkType: data.linkType || "route",
      linkUrl: data.linkUrl || "",
      linkParams: data.linkParams || {},
      extraData: data.extraData || {},
      isRead: BoolNum.No,
      isActive: BoolNum.Yes,
    } as any);
    const scene = getMessageScene(message);
    this.saveSystemMessageLog(message, scene);
    this.sendExternalNotification(message, scene);
    return message;
  }

  private generateNotificationId() {
    return `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private saveSystemMessageLog(message: Message, scene?: MessageScene | null) {
    if (!this.externalNotifyService) return;
    void this.externalNotifyService
      .saveSystemMessageLog({
        ...(message as any),
        sceneKey: scene?.key || "",
      })
      .catch(() => undefined);
  }

  private sendExternalNotification(
    message: Message,
    scene?: MessageScene | null,
  ) {
    if (!this.externalNotifyService) return;
    if (!scene) return;
    void this.sendExternalNotificationByScene(message, scene).catch(
      () => undefined,
    );
  }

  private async sendExternalNotificationByScene(
    message: Message,
    scene: MessageScene,
  ) {
    const config =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    if (!this.isSceneEnabledForFeishu(config, scene.key)) return;

    const notifyMessage = {
      messageId: message.id,
      notificationId: message.notificationId,
      receiverId: message.receiverId,
      templateKey: scene.supportedTemplates.feishu || "feishuText",
      title: message.title,
      content: message.content,
      linkUrl: message.linkUrl,
      linkParams: message.linkParams,
      extraData: message.extraData || {},
      sourceType: message.sourceType,
      sourceId: message.sourceId,
      messageType: message.messageType,
      sceneKey: scene.key,
    };

    await this.externalNotifyService.sendToUser(
      message.receiverId,
      notifyMessage,
    );
  }

  private isSceneEnabledForFeishu(config: any, sceneKey: string) {
    const enabledScenes = Array.isArray(config?.feishu?.enabledScenes)
      ? config.feishu.enabledScenes
      : [];
    return (
      Boolean(config?.enabled && config?.feishu?.enabled) &&
      enabledScenes.includes(sceneKey)
    );
  }

  async getUnreadCount(userId: string) {
    const [todo, cc] = await Promise.all([
      this.repository.count({
        where: {
          receiverId: userId,
          isRead: BoolNum.No,
          isDelete: null as any,
          isActive: BoolNum.Yes,
          messageType: MessageType.todo,
        } as any,
      }),
      this.repository.count({
        where: {
          receiverId: userId,
          isRead: BoolNum.No,
          isDelete: null as any,
          messageType: MessageType.cc,
        } as any,
      }),
    ]);
    return { todo, cc, total: todo + cc };
  }

  async getRecentMessages(userId: string, limit = 10) {
    const list = await this.repository.find({
      where: { receiverId: userId, isDelete: null as any } as any,
      order: { isRead: "ASC" as any, createTime: "DESC" as any },
      take: limit * 4,
    });
    return {
      todo: list
        .filter(
          (item) =>
            item.messageType === MessageType.todo &&
            item.isActive === BoolNum.Yes,
        )
        .slice(0, limit),
      cc: list
        .filter(
          (item) =>
            item.messageType === MessageType.cc && item.isRead === BoolNum.No,
        )
        .slice(0, limit),
    };
  }

  async getMessageList(userId: string, query: QueryListDto) {
    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const messageType = String(query.messageType || "");
    const scope = String(query.scope || "current");
    const keyword = String(query.keyword || "").trim();
    const sourceType = String(query.sourceType || "").trim();

    const where: Record<string, any> = {
      receiverId: userId,
      isDelete: null,
    };

    if (messageType) {
      where.messageType = messageType;
    }
    if (sourceType) {
      where.sourceType = sourceType;
    }

    if (messageType === MessageType.todo) {
      if (scope === "current") {
        where.isActive = BoolNum.Yes;
      } else if (scope === "history") {
        where.isActive = BoolNum.No;
      }
    }

    if (messageType === MessageType.cc) {
      if (scope === "current") {
        where.isRead = BoolNum.No;
      } else if (scope === "history") {
        where.isRead = BoolNum.Yes;
      }
    }

    const whereList = keyword
      ? [
          { ...where, title: Like(`%${keyword}%`) },
          { ...where, content: Like(`%${keyword}%`) },
        ]
      : where;

    const [list, total] = await this.repository.findAndCount({
      where: whereList as any,
      order: { createTime: "DESC" as any },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return {
      total,
      list,
    };
  }

  async markRead(id: string, userId: string) {
    await this.repository.update(
      { id, receiverId: userId } as any,
      {
        isRead: BoolNum.Yes as any,
        readTime: this.getCurrentDateTime(),
      } as any,
    );
  }

  async markProjectAlertsRead(userId: string) {
    await this.repository.update(
      {
        receiverId: userId,
        sourceType: "project_alert",
        messageType: MessageType.cc,
        isRead: BoolNum.No,
        isDelete: null as any,
      } as any,
      {
        isRead: BoolNum.Yes as any,
        readTime: this.getCurrentDateTime(),
      } as any,
    );
  }

  async clearProjectAlerts(userId: string) {
    await this.repository.update(
      {
        receiverId: userId,
        sourceType: "project_alert",
        messageType: MessageType.cc,
        isDelete: null as any,
      } as any,
      {
        isActive: BoolNum.No as any,
        isRead: BoolNum.Yes as any,
        readTime: this.getCurrentDateTime(),
      } as any,
    );
  }

  async deactivateWorkflowTaskMessages(
    taskIds: string[] | string,
    statusOptions?: WorkflowTodoCardStatusOptions,
  ) {
    const ids = (Array.isArray(taskIds) ? taskIds : [taskIds])
      .filter(Boolean)
      .map((id) => String(id));
    if (!ids.length) return;
    const activeMessages = this.externalNotifyService
      ? await this.repository.find({
          where: {
            sourceType: "workflow_task",
            sourceId: In(ids) as any,
            isActive: BoolNum.Yes,
            isDelete: null as any,
          } as any,
        })
      : [];
    await this.repository.update(
      {
        sourceType: "workflow_task",
        sourceId: In(ids) as any,
        isDelete: null as any,
      } as any,
      {
        isActive: BoolNum.No as any,
        isRead: BoolNum.Yes as any,
        readTime: this.getCurrentDateTime(),
      } as any,
    );
    if (this.externalNotifyService && activeMessages.length) {
      void this.externalNotifyService
        .updateWorkflowTodoCardStatus({
          messages: activeMessages.map((message) => ({
            ...(message as any),
            messageId: message.id,
          })),
          ...(statusOptions || { status: "cancelled", statusText: "已失效" }),
        })
        .catch(() => undefined);
    }
  }

  async cleanupExpiredMessages(
    options: { retentionDays?: number; limit?: number } = {},
  ) {
    const retentionDays = Math.max(Number(options.retentionDays || 180), 1);
    const expiredBefore = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const result = await this.repository.update(
      [
        {
          messageType: MessageType.cc,
          isRead: BoolNum.Yes,
          isDelete: null,
          createTime: LessThan(expiredBefore),
        } as any,
        {
          messageType: MessageType.todo,
          isActive: BoolNum.No,
          isDelete: null,
          createTime: LessThan(expiredBefore),
        } as any,
      ],
      { isDelete: BoolNum.Yes as any },
    );
    return {
      processedCount: Number(result?.affected || 0),
      successCount: Number(result?.affected || 0),
      failedCount: 0,
    };
  }

  async deactivateWorkflowInstanceCcMessages(
    instanceIds: string[] | string,
    receiverId?: string,
  ) {
    const ids = (Array.isArray(instanceIds) ? instanceIds : [instanceIds])
      .filter(Boolean)
      .map((id) => String(id));
    if (!ids.length) return;

    const where: Record<string, any> = {
      sourceType: "workflow_instance",
      sourceId: In(ids) as any,
      messageType: MessageType.cc,
      isDelete: null as any,
    };

    if (receiverId) {
      where.receiverId = receiverId;
    }

    await this.repository.update(
      where as any,
      {
        isActive: BoolNum.No as any,
        isRead: BoolNum.Yes as any,
        readTime: this.getCurrentDateTime(),
      } as any,
    );
  }

  async deactivateInactiveWorkflowTaskMessages() {
    const activeTodoMessages = await this.repository.find({
      where: {
        sourceType: "workflow_task",
        messageType: MessageType.todo,
        isActive: BoolNum.Yes,
        isDelete: null as any,
      } as any,
      select: ["id", "sourceId"],
    });
    if (!activeTodoMessages.length) return 0;

    const activeTaskIds = Array.from(
      new Set(
        activeTodoMessages.map((item) => String(item.sourceId)).filter(Boolean),
      ),
    );
    const pendingTasks = await this.workflowTaskRepo.find({
      where: activeTaskIds.map((id) => ({ id, status: "1" })) as any,
      select: ["id"],
    });
    const pendingTaskIdSet = new Set(
      pendingTasks.map((task) => String(task.id)),
    );
    const staleMessageIds = activeTodoMessages
      .filter((item) => !pendingTaskIdSet.has(String(item.sourceId)))
      .map((item) => item.id);
    if (!staleMessageIds.length) return 0;

    await this.repository.update(
      staleMessageIds as any,
      {
        isActive: BoolNum.No as any,
        isRead: BoolNum.Yes as any,
        readTime: this.getCurrentDateTime(),
      } as any,
    );
    return staleMessageIds.length;
  }

  async ensureWorkflowTodoMessages() {
    await this.deactivateInactiveWorkflowTaskMessages();
    const pendingTasks = await this.workflowTaskRepo.find({
      where: { status: "1" } as any,
    });
    for (const task of pendingTasks) {
      const exists = await this.repository.findOne({
        where: {
          sourceType: "workflow_task",
          sourceId: task.id,
          receiverId: task.assigneeId,
          isDelete: null as any,
        } as any,
      });
      if (exists) continue;
      const instance = await this.workflowInstanceRepo.findOne({
        where: { id: task.instanceId },
      });
      await this.sendMessage({
        title: `待办审批：${task.nodeName}`,
        content: `您有一个新的审批任务待处理。`,
        messageType: MessageType.todo,
        sourceType: "workflow_task",
        sourceId: task.id,
        receiverId: task.assigneeId,
        senderId: instance?.starterId || "",
        linkUrl: this.getBusinessRoute(instance?.businessKey || ""),
        linkParams: this.getBusinessRouteParams(
          instance?.businessKey || "",
          task.id,
          instance?.id,
        ),
      });
    }
  }

  async syncProjectAlerts(
    userId: string,
    projectId: string,
    projectName: string,
    alerts: Array<{
      type?: string;
      title?: string;
      value?: number;
      desc?: string;
      tab?: string;
      filter?: string;
    }> = [],
  ) {
    const strategy =
      await this.systemConfigsService.getProjectReminderStrategy();
    if (!strategy?.enabled || !strategy?.delivery?.messageCenter) return 0;

    const sourceId = String(projectId || "");
    if (!userId || !sourceId) return 0;

    const filteredAlerts = alerts.filter((alert) => {
      const ruleMap = {
        "tasks::overdue": strategy?.rules?.taskOverdue,
        "tasks::dueSoon": strategy?.rules?.taskDueSoon,
        "plan::delayed": strategy?.rules?.milestoneDelayed,
        "plan::active": strategy?.rules?.sprintDelayed,
        "risks::high": strategy?.rules?.highRisk,
        "changes::pending": strategy?.rules?.changePending,
        "plan::unplanned": strategy?.rules?.unplannedTask,
        "closure::incomplete": strategy?.rules?.closureIncomplete,
      };
      const key = `${alert.tab || ""}::${alert.filter || ""}`;
      return ruleMap[key] !== false;
    });

    const activeMessages = await this.repository.find({
      where: {
        sourceType: "project_alert",
        sourceId,
        receiverId: userId,
        isDelete: null as any,
        isActive: BoolNum.Yes,
      } as any,
    });
    const activeMap = new Map<string, Message>(
      activeMessages.map((item) => [
        String(item.extraData?.alertKey || ""),
        item,
      ]),
    );
    const nextKeys = new Set<string>();

    for (const alert of filteredAlerts) {
      const alertKey = [
        alert.tab || "",
        alert.filter || "",
        alert.title || "",
      ].join("::");
      nextKeys.add(alertKey);
      const exists = activeMap.get(alertKey);
      const title = `项目提醒：${projectName || sourceId}`;
      const content = `${alert.title || "项目异常"}${
        alert.value != null ? `（${alert.value}）` : ""
      }\n${alert.desc || ""}`;

      if (exists) {
        const frequencyMode = String(strategy?.frequency?.mode || "interval");
        const frequencyHours = Math.max(
          1,
          Number(strategy?.frequency?.hours || 24),
        );
        const lastSyncedAt = exists.extraData?.lastSyncedAt
          ? new Date(exists.extraData.lastSyncedAt).getTime()
          : 0;
        const now = Date.now();
        const withinInterval =
          frequencyMode === "interval" &&
          lastSyncedAt > 0 &&
          now - lastSyncedAt < frequencyHours * 60 * 60 * 1000;
        const nextContent = String(content || "");
        const currentContent = String(exists.content || "");
        if (nextContent !== currentContent && !withinInterval) {
          await this.repository.update(exists.id, {
            title,
            content,
            linkUrl: "/projectManage/detail",
            linkParams: {
              id: sourceId,
              tab: alert.tab || "overview",
            },
            extraData: {
              ...(exists.extraData || {}),
              alertKey,
              alertType: alert.type || "info",
              tab: alert.tab || "overview",
              filter: alert.filter || "all",
              lastSyncedAt: new Date().toISOString(),
            },
            isRead: BoolNum.No as any,
            isActive: BoolNum.Yes as any,
            readTime: null as any,
          } as any);
        }
        continue;
      }

      await this.sendMessage({
        title,
        content,
        messageType: MessageType.cc,
        sourceType: "project_alert",
        sourceId,
        receiverId: userId,
        senderId: "system",
        linkUrl: "/projectManage/detail",
        linkParams: {
          id: sourceId,
          tab: alert.tab || "overview",
        },
        extraData: {
          alertKey,
          alertType: alert.type || "info",
          tab: alert.tab || "overview",
          filter: alert.filter || "all",
          lastSyncedAt: new Date().toISOString(),
        },
      });
    }

    const staleIds = activeMessages
      .filter((item) => !nextKeys.has(String(item.extraData?.alertKey || "")))
      .map((item) => item.id);
    if (staleIds.length) {
      await this.repository.update(
        staleIds as any,
        {
          isActive: BoolNum.No as any,
          isRead: BoolNum.Yes as any,
          readTime: this.getCurrentDateTime(),
        } as any,
      );
    }
    return filteredAlerts.length;
  }

  private getCurrentDateTime() {
    return dayjs().format("YYYY-MM-DD HH:mm:ss");
  }

  private getBusinessRoute(businessKey: string) {
    const businessType = String(businessKey || "").split("_")[0];
    if (businessType === "project") return "/projectManage/approval";
    if (businessType === "change") return "/changeManage/form";
    if (businessType === "ticket") return "/ticketManage/form";
    if (businessType === "task") return "/taskManage/form";
    if (businessType === "articleBorrow")
      return "/content/articleManage/borrowApproval";
    if (businessType === "customer") return "/crm/customerManage/form";
    if (businessType === "interaction") return "/crm/interactionManage/form";
    if (businessType === "opportunity") return "/crm/opportunityManage/form";
    if (businessType === "contract") return "/crm/contractManage/form";
    return "";
  }

  private getBusinessRouteParams(
    businessKey: string,
    taskId?: string,
    instanceId?: string,
  ) {
    const businessId = String(businessKey || "")
      .split("_")
      .pop();
    return {
      id: businessId,
      taskId: taskId || "",
      instanceId: instanceId || "",
      fromWorkflow: "1",
    };
  }
}
