import { Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, MoreThan, Repository } from "typeorm";
import { BusinessApprovalContext } from "./entity/business-approval-context.entity";
import { BusinessApprovalParticipant } from "./entity/business-approval-participant.entity";
import { WorkflowInstance } from "../workflow/entity/workflow-instance.entity";
import { ProjectChange } from "../changes/entity";
import { Task } from "../tasks/entity";
import { Ticket } from "../tickets/entity";
import { GoLiveRecord } from "../go-live-records/entity";
import { AcceptanceRecord } from "../acceptance-records/entity";
import { HandoverRecord } from "../handover-records/entity";
import { WorkflowTask } from "../workflow/entity/workflow-task.entity";
import { WorkflowHistory } from "../workflow/entity/workflow-history.entity";

export interface CreateBusinessApprovalContextOptions {
  businessType: string;
  businessId: string;
  businessScene: string;
  sceneTitle: string;
  workflowInstance: Pick<
    WorkflowInstance,
    | "id"
    | "definitionId"
    | "definitionCode"
    | "status"
    | "currentNodeId"
    | "startTime"
  > & { currentNodeName?: string };
  starterId: string;
  starterName?: string;
  rootBusinessType?: string;
  rootBusinessId?: string;
  projectId?: string;
}

export interface SyncBusinessApprovalStatusOptions {
  status: string;
  endedAt?: string;
  currentNodeId?: string;
  currentNodeName?: string;
}

export interface BackfillApprovalParticipantsOptions {
  businessType?: string;
  rootBusinessType?: string;
  limit?: number;
  afterId?: string;
}

@Injectable()
export class BusinessApprovalContextService {
  constructor(
    @InjectRepository(BusinessApprovalContext)
    private readonly contextRepository: Repository<BusinessApprovalContext>,
    @InjectRepository(BusinessApprovalParticipant)
    private readonly participantRepository: Repository<BusinessApprovalParticipant>,
    @Optional()
    @InjectRepository(WorkflowInstance)
    private readonly workflowInstanceRepository?: Repository<WorkflowInstance>,
    @Optional()
    @InjectRepository(ProjectChange)
    private readonly changeRepository?: Repository<ProjectChange>,
    @Optional()
    @InjectRepository(Task)
    private readonly taskRepository?: Repository<Task>,
    @Optional()
    @InjectRepository(Ticket)
    private readonly ticketRepository?: Repository<Ticket>,
    @Optional()
    @InjectRepository(GoLiveRecord)
    private readonly goLiveRecordRepository?: Repository<GoLiveRecord>,
    @Optional()
    @InjectRepository(AcceptanceRecord)
    private readonly acceptanceRecordRepository?: Repository<AcceptanceRecord>,
    @Optional()
    @InjectRepository(HandoverRecord)
    private readonly handoverRecordRepository?: Repository<HandoverRecord>,
    @Optional()
    @InjectRepository(WorkflowTask)
    private readonly workflowTaskRepository?: Repository<WorkflowTask>,
    @Optional()
    @InjectRepository(WorkflowHistory)
    private readonly workflowHistoryRepository?: Repository<WorkflowHistory>,
  ) {}

  async createFromWorkflowStart(options: CreateBusinessApprovalContextOptions) {
    await this.contextRepository.update(
      {
        businessType: options.businessType,
        businessId: options.businessId,
        businessScene: options.businessScene,
        isCurrent: "1",
      },
      { isCurrent: "0" },
    );

    const context = this.contextRepository.create({
      businessType: options.businessType,
      businessId: options.businessId,
      businessScene: options.businessScene,
      sceneTitle: options.sceneTitle,
      workflowInstanceId: options.workflowInstance.id,
      workflowDefinitionId: options.workflowInstance.definitionId,
      workflowDefinitionCode: options.workflowInstance.definitionCode,
      status: options.workflowInstance.status,
      currentNodeId: options.workflowInstance.currentNodeId,
      currentNodeName: options.workflowInstance.currentNodeName || "",
      starterId: options.starterId,
      starterName: options.starterName || "",
      startedAt: options.workflowInstance.startTime,
      rootBusinessType: options.rootBusinessType || options.businessType,
      rootBusinessId: options.rootBusinessId || options.businessId,
      projectId: options.projectId || null,
      isCurrent: "1",
      isActive: "1",
    });
    const savedContext = await this.contextRepository.save(context);

    await this.participantRepository.save(
      this.participantRepository.create({
        approvalContextId: savedContext.id,
        workflowInstanceId: options.workflowInstance.id,
        userId: options.starterId,
        roleType: "starter",
        businessType: options.businessType,
        businessId: options.businessId,
        rootBusinessType: options.rootBusinessType || options.businessType,
        rootBusinessId: options.rootBusinessId || options.businessId,
      }),
    );

    return savedContext;
  }

  findByRootBusiness(rootBusinessType: string, rootBusinessId: string) {
    return this.contextRepository.find({
      where: {
        rootBusinessType,
        rootBusinessId,
        isActive: "1",
      },
      order: { startedAt: "DESC", createTime: "DESC" },
    });
  }

  async findProjectApprovalContexts(projectId: string) {
    const contexts = await this.findByRootBusiness("project", projectId);
    await this.backfillProjectApprovalContexts(projectId, contexts);
    return this.findByRootBusiness("project", projectId);
  }

  findByBusiness(businessType: string, businessId: string) {
    return this.contextRepository.find({
      where: {
        businessType,
        businessId,
        isActive: "1",
      },
      order: { startedAt: "DESC", createTime: "DESC" },
    });
  }

  findByWorkflowInstance(workflowInstanceId: string) {
    return this.contextRepository.findOne({
      where: { workflowInstanceId, isActive: "1" },
    });
  }

  syncWorkflowStatus(
    workflowInstanceId: string,
    options: SyncBusinessApprovalStatusOptions,
  ) {
    return this.contextRepository.update(
      { workflowInstanceId },
      {
        status: options.status,
        endedAt: options.endedAt,
        currentNodeId: options.currentNodeId,
        currentNodeName: options.currentNodeName,
      },
    );
  }

  async syncParticipantsFromWorkflow(workflowInstanceId: string) {
    if (!this.workflowTaskRepository || !this.workflowHistoryRepository) return;

    const context = await this.findByWorkflowInstance(workflowInstanceId);
    if (!context) return;

    const [tasks, histories] = await Promise.all([
      this.workflowTaskRepository.find({
        where: { instanceId: workflowInstanceId, status: "1" },
      }),
      this.workflowHistoryRepository.find({
        where: { instanceId: workflowInstanceId },
      }),
    ]);
    const participants = [
      ...this.buildParticipants(
        context,
        this.getUniqueUserIds(tasks.map((task) => task.assigneeId)),
        "assignee",
      ),
      ...this.buildParticipants(
        context,
        this.getUniqueUserIds(histories.map((history) => history.operatorId)),
        "history",
      ),
    ];

    await this.participantRepository.delete({
      workflowInstanceId,
      roleType: In(["assignee", "history"]),
    });
    if (!participants.length) return;
    await this.participantRepository.save(
      participants.map((participant) =>
        this.participantRepository.create(participant),
      ),
    );
  }

  async findVisibleRootBusinessIdsForUser(
    userId: string,
    rootBusinessType: string,
  ) {
    if (!userId || !rootBusinessType) return [];
    const participants = await this.participantRepository.find({
      where: {
        userId: String(userId),
        rootBusinessType: String(rootBusinessType),
      },
      select: ["rootBusinessId"] as any,
    });
    return this.getUniqueUserIds(
      participants.map((item) => item.rootBusinessId),
    );
  }

  async findVisibleBusinessIdsForUser(userId: string, businessType: string) {
    if (!userId || !businessType) return [];
    const participants = await this.participantRepository.find({
      where: {
        userId: String(userId),
        businessType: String(businessType),
      },
      select: ["businessId"] as any,
    });
    return this.getUniqueUserIds(participants.map((item) => item.businessId));
  }

  async hasRootBusinessParticipantAccess(
    userId: string,
    rootBusinessType: string,
    rootBusinessId: string,
  ) {
    if (!userId || !rootBusinessType || !rootBusinessId) return false;
    const participant = await this.participantRepository.findOne({
      where: {
        userId: String(userId),
        rootBusinessType: String(rootBusinessType),
        rootBusinessId: String(rootBusinessId),
      },
      select: ["id"] as any,
    });
    return Boolean(participant);
  }

  async hasBusinessParticipantAccess(
    userId: string,
    businessType: string,
    businessId: string,
  ) {
    if (!userId || !businessType || !businessId) return false;
    const participant = await this.participantRepository.findOne({
      where: {
        userId: String(userId),
        businessType: String(businessType),
        businessId: String(businessId),
      },
      select: ["id"] as any,
    });
    return Boolean(participant);
  }

  async backfillParticipants(
    options: BackfillApprovalParticipantsOptions = {},
  ) {
    const limit = Math.min(Math.max(Number(options.limit || 200), 1), 1000);
    const where: Record<string, any> = { isActive: "1" };
    if (options.businessType) {
      where.businessType = String(options.businessType);
    }
    if (options.rootBusinessType) {
      where.rootBusinessType = String(options.rootBusinessType);
    }
    if (options.afterId) {
      where.id = MoreThan(String(options.afterId));
    }
    const contexts = await this.contextRepository.find({
      where,
      select: ["id", "workflowInstanceId"] as any,
      order: { id: "ASC" },
      take: limit,
    });
    const failures: Array<{ contextId: string; workflowInstanceId: string }> =
      [];
    let processed = 0;
    let skipped = 0;

    for (const context of contexts) {
      const workflowInstanceId = String(context.workflowInstanceId || "");
      if (!workflowInstanceId) {
        skipped += 1;
        continue;
      }
      try {
        await this.syncParticipantsFromWorkflow(workflowInstanceId);
        processed += 1;
      } catch {
        failures.push({
          contextId: String(context.id || ""),
          workflowInstanceId,
        });
      }
    }

    return {
      total: contexts.length,
      processed,
      skipped,
      failed: failures.length,
      failures,
      nextAfterId: contexts.length
        ? String(contexts[contexts.length - 1].id || "")
        : "",
      hasMore: contexts.length >= limit,
    };
  }

  private async backfillProjectApprovalContexts(
    projectId: string,
    existingContexts: BusinessApprovalContext[],
  ) {
    if (
      !this.workflowInstanceRepository ||
      !this.changeRepository ||
      !this.taskRepository ||
      !this.ticketRepository ||
      !this.goLiveRecordRepository ||
      !this.acceptanceRecordRepository ||
      !this.handoverRecordRepository
    )
      return;

    const changes = await this.changeRepository.find({
      where: { projectId },
      select: ["id"],
    });
    const tasks = await this.taskRepository.find({
      where: { projectId },
      select: ["id"],
    });
    const tickets = await this.ticketRepository.find({
      where: { projectId },
      select: ["id"],
    });
    const goLiveRecords = await this.goLiveRecordRepository.find({
      where: { projectId },
      select: ["id"],
    });
    const acceptanceRecords = await this.acceptanceRecordRepository.find({
      where: { projectId },
      select: ["id"],
    });
    const handoverRecords = await this.handoverRecordRepository.find({
      where: { projectId },
      select: ["id"],
    });
    const businessKeys = [
      `project_${projectId}`,
      `project_close_${projectId}`,
      ...changes.map((change) => `change_${change.id}`),
      ...tasks.map((task) => `task_${task.id}`),
      ...tickets.map((ticket) => `ticket_${ticket.id}`),
      ...goLiveRecords.map((record) => `goLive_${record.id}`),
      ...acceptanceRecords.map((record) => `acceptance_${record.id}`),
      ...handoverRecords.map((record) => `handover_${record.id}`),
    ];
    const workflowInstances = await this.workflowInstanceRepository.find({
      where: { businessKey: In(businessKeys) },
      order: { startTime: "ASC", createTime: "ASC" },
    });
    const existingWorkflowInstanceIds = new Set(
      (existingContexts || []).map((context) =>
        String(context.workflowInstanceId || ""),
      ),
    );
    for (const instance of workflowInstances) {
      if (existingWorkflowInstanceIds.has(String(instance.id))) continue;
      const options = this.buildProjectBackfillContextOptions(
        projectId,
        instance,
      );
      if (!options) continue;
      await this.createFromWorkflowStart(options);
    }
  }

  private getUniqueUserIds(userIds: Array<string | null | undefined>) {
    return Array.from(
      new Set(
        userIds
          .map((userId) => String(userId || "").trim())
          .filter((userId) => !!userId),
      ),
    );
  }

  private buildParticipants(
    context: BusinessApprovalContext,
    userIds: string[],
    roleType: "assignee" | "history",
  ) {
    return userIds.map((userId) => ({
      approvalContextId: context.id,
      workflowInstanceId: context.workflowInstanceId,
      userId,
      roleType,
      businessType: context.businessType,
      businessId: context.businessId,
      rootBusinessType: context.rootBusinessType,
      rootBusinessId: context.rootBusinessId,
    }));
  }

  private buildProjectBackfillContextOptions(
    projectId: string,
    instance: WorkflowInstance,
  ): CreateBusinessApprovalContextOptions | null {
    const businessKey = String(instance.businessKey || "");
    const commonOptions = {
      workflowInstance: instance,
      starterId: instance.starterId,
      rootBusinessType: "project",
      rootBusinessId: projectId,
      projectId,
    };
    if (businessKey === `project_${projectId}`) {
      return {
        ...commonOptions,
        businessType: "project",
        businessId: projectId,
        businessScene: "initiation",
        sceneTitle: "立项审批",
      };
    }
    if (businessKey === `project_close_${projectId}`) {
      return {
        ...commonOptions,
        businessType: "project",
        businessId: projectId,
        businessScene: "closure",
        sceneTitle: "结项审批",
      };
    }
    if (businessKey.startsWith("change_")) {
      return {
        ...commonOptions,
        businessType: "change",
        businessId: businessKey.replace("change_", ""),
        businessScene: "approval",
        sceneTitle: "变更审批",
      };
    }
    if (businessKey.startsWith("task_")) {
      return {
        ...commonOptions,
        businessType: "task",
        businessId: businessKey.replace("task_", ""),
        businessScene: "approval",
        sceneTitle: "任务审批",
      };
    }
    if (businessKey.startsWith("ticket_")) {
      return {
        ...commonOptions,
        businessType: "ticket",
        businessId: businessKey.replace("ticket_", ""),
        businessScene: "approval",
        sceneTitle: "工单审批",
      };
    }
    if (businessKey.startsWith("goLive_")) {
      return {
        ...commonOptions,
        businessType: "goLive",
        businessId: businessKey.replace("goLive_", ""),
        businessScene: "approval",
        sceneTitle: "上线审批",
      };
    }
    if (businessKey.startsWith("acceptance_")) {
      return {
        ...commonOptions,
        businessType: "acceptance",
        businessId: businessKey.replace("acceptance_", ""),
        businessScene: "approval",
        sceneTitle: "验收审批",
      };
    }
    if (businessKey.startsWith("handover_")) {
      return {
        ...commonOptions,
        businessType: "handover",
        businessId: businessKey.replace("handover_", ""),
        businessScene: "approval",
        sceneTitle: "交接审批",
      };
    }
    return null;
  }
}
