import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BusinessApprovalContext } from "./entity/business-approval-context.entity";
import { BusinessApprovalParticipant } from "./entity/business-approval-participant.entity";
import { WorkflowInstance } from "../workflow/entity/workflow-instance.entity";

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
}
