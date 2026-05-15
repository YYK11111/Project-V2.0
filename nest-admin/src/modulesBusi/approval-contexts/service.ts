import { Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { BusinessApprovalContext } from "./entity/business-approval-context.entity";
import { BusinessApprovalParticipant } from "./entity/business-approval-participant.entity";
import { WorkflowInstance } from "../workflow/entity/workflow-instance.entity";
import { ProjectChange } from "../changes/entity";
import { Task } from "../tasks/entity";
import { Ticket } from "../tickets/entity";

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

  private async backfillProjectApprovalContexts(
    projectId: string,
    existingContexts: BusinessApprovalContext[],
  ) {
    if (
      !this.workflowInstanceRepository ||
      !this.changeRepository ||
      !this.taskRepository ||
      !this.ticketRepository
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
    const businessKeys = [
      `project_${projectId}`,
      `project_close_${projectId}`,
      ...changes.map((change) => `change_${change.id}`),
      ...tasks.map((task) => `task_${task.id}`),
      ...tickets.map((ticket) => `ticket_${ticket.id}`),
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
    return null;
  }
}
