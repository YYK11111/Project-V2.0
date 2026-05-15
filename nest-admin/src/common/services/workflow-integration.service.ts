import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import dayjs from "dayjs";
import { Project, ProjectStatus } from "src/modulesBusi/projects/entity";
import { ProjectsService } from "src/modulesBusi/projects/service";
import { Task, TaskStatus } from "src/modulesBusi/tasks/entity";
import { Ticket, TicketStatus } from "src/modulesBusi/tickets/entity";
import { ProjectChange, ChangeStatus } from "src/modulesBusi/changes/entity";
import { Customer } from "src/modulesBusi/crm/customers/entity";
import {
  GoLiveRecord,
  GoLiveRecordStatus,
} from "src/modulesBusi/go-live-records/entity";
import {
  AcceptanceRecord,
  AcceptanceRecordResult,
} from "src/modulesBusi/acceptance-records/entity";
import {
  HandoverRecord,
  HandoverRecordStatus,
} from "src/modulesBusi/handover-records/entity";
import { WorkflowService } from "src/modulesBusi/workflow/service";
import { CustomersService } from "src/modulesBusi/crm/customers/service";
import { BusinessApprovalContextService } from "src/modulesBusi/approval-contexts/service";
import {
  ArticleBorrow,
  KnowledgeBorrowStatus,
} from "src/modulesBusi/articleBorrows/entity";
import { TasksService } from "../tasks/tasks.service";

@Injectable()
export class WorkflowIntegrationService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(ProjectChange)
    private readonly changeRepository: Repository<ProjectChange>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(GoLiveRecord)
    private readonly goLiveRecordRepository: Repository<GoLiveRecord>,
    @InjectRepository(AcceptanceRecord)
    private readonly acceptanceRecordRepository: Repository<AcceptanceRecord>,
    @InjectRepository(HandoverRecord)
    private readonly handoverRecordRepository: Repository<HandoverRecord>,
    @Inject(forwardRef(() => WorkflowService))
    private readonly workflowService: WorkflowService,
    private readonly projectsService: ProjectsService,
    private readonly customersService?: CustomersService,
    @Optional()
    private readonly businessApprovalContextService?: BusinessApprovalContextService,
    @Optional()
    @InjectRepository(ArticleBorrow)
    private readonly articleBorrowRepository?: Repository<ArticleBorrow>,
    @Optional()
    private readonly tasksService?: TasksService,
  ) {}

  private getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }

  async syncApprovalParticipants(instanceId: string): Promise<void> {
    await this.businessApprovalContextService?.syncParticipantsFromWorkflow(
      instanceId,
    );
  }

  async startProjectApproval(
    projectId: string,
    initiatorId: string,
  ): Promise<string> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new BadRequestException("项目不存在");
    }

    if (project.status !== ProjectStatus.draft) {
      throw new BadRequestException("只有草稿状态的项目才能提交立项审批");
    }

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "project",
        businessScene: "initiation",
        businessKey: `project_${projectId}`,
        variables: {
          starterId: initiatorId,
          businessType: "project",
          workflowScene: "projectApproval",
        },
      },
      initiatorId,
    );

    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "project",
      businessId: projectId,
      businessScene: "initiation",
      sceneTitle: "立项审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "project",
      rootBusinessId: projectId,
      projectId,
    });
    await this.syncApprovalParticipants(instance.id);

    project.workflowInstanceId = instance.id;
    project.status = ProjectStatus.approvalPending;
    project.approvalStatus = "1";
    project.currentNodeName = "立项审批中";
    await this.projectRepository.save(project);

    return instance.id;
  }

  async startProjectCloseApproval(
    projectId: string,
    initiatorId: string,
  ): Promise<string> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new BadRequestException("项目不存在");
    }

    if (project.status !== ProjectStatus.executing) {
      throw new BadRequestException("只有执行中的项目才能提交结项审批");
    }

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "project",
        businessScene: "closure",
        businessKey: `project_close_${projectId}`,
        variables: {
          starterId: initiatorId,
          businessType: "project",
          workflowScene: "projectCloseApproval",
          projectId,
        },
      },
      initiatorId,
    );

    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "project",
      businessId: projectId,
      businessScene: "closure",
      sceneTitle: "结项审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "project",
      rootBusinessId: projectId,
      projectId,
    });
    await this.syncApprovalParticipants(instance.id);

    project.workflowInstanceId = instance.id;
    project.status = ProjectStatus.closeApprovalPending;
    project.approvalStatus = "1";
    project.currentNodeName = "结项审批中";
    await this.projectRepository.save(project);

    return instance.id;
  }

  async startGoLiveApproval(
    recordId: string,
    initiatorId: string,
  ): Promise<string> {
    const record = await this.goLiveRecordRepository.findOne({
      where: { id: recordId },
    });
    if (!record) throw new BadRequestException("上线单不存在");
    if (record.status !== GoLiveRecordStatus.draft) {
      throw new BadRequestException("只有草稿状态的上线单才能提交审批");
    }
    await this.projectsService.assertExecutionObjectPermission(
      record.projectId,
      initiatorId,
    );
    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "goLive",
        businessScene: "approval",
        businessKey: `goLive_${recordId}`,
        variables: {
          starterId: initiatorId,
          businessType: "goLive",
          workflowScene: "goLiveApproval",
        },
      },
      initiatorId,
    );
    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "goLive",
      businessId: recordId,
      businessScene: "approval",
      sceneTitle: "上线审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "project",
      rootBusinessId: record.projectId,
      projectId: record.projectId,
    });
    await this.syncApprovalParticipants(instance.id);
    await this.goLiveRecordRepository.update(recordId, {
      status: GoLiveRecordStatus.pendingApproval,
    } as any);
    return instance.id;
  }

  async startAcceptanceApproval(
    recordId: string,
    initiatorId: string,
  ): Promise<string> {
    const record = await this.acceptanceRecordRepository.findOne({
      where: { id: recordId },
    });
    if (!record) throw new BadRequestException("验收单不存在");
    if (
      ![
        AcceptanceRecordResult.pending,
        AcceptanceRecordResult.rectifying,
      ].includes(record.result)
    ) {
      throw new BadRequestException("当前验收结果不允许提交审批");
    }
    await this.projectsService.assertExecutionObjectPermission(
      record.projectId,
      initiatorId,
    );
    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "acceptance",
        businessScene: "approval",
        businessKey: `acceptance_${recordId}`,
        variables: {
          starterId: initiatorId,
          businessType: "acceptance",
          workflowScene: "acceptanceApproval",
        },
      },
      initiatorId,
    );
    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "acceptance",
      businessId: recordId,
      businessScene: "approval",
      sceneTitle: "验收审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "project",
      rootBusinessId: record.projectId,
      projectId: record.projectId,
    });
    await this.syncApprovalParticipants(instance.id);
    await this.acceptanceRecordRepository.update(recordId, {
      result: AcceptanceRecordResult.pending,
    } as any);
    return instance.id;
  }

  async startHandoverApproval(
    recordId: string,
    initiatorId: string,
  ): Promise<string> {
    const record = await this.handoverRecordRepository.findOne({
      where: { id: recordId },
    });
    if (!record) throw new BadRequestException("运维交接单不存在");
    if (record.status !== HandoverRecordStatus.draft) {
      throw new BadRequestException("只有草稿状态的交接单才能提交审批");
    }
    await this.projectsService.assertExecutionObjectPermission(
      record.projectId,
      initiatorId,
    );
    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "handover",
        businessScene: "approval",
        businessKey: `handover_${recordId}`,
        variables: {
          starterId: initiatorId,
          businessType: "handover",
          workflowScene: "handoverApproval",
        },
      },
      initiatorId,
    );
    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "handover",
      businessId: recordId,
      businessScene: "approval",
      sceneTitle: "交接审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "project",
      rootBusinessId: record.projectId,
      projectId: record.projectId,
    });
    await this.syncApprovalParticipants(instance.id);
    await this.handoverRecordRepository.update(recordId, {
      status: HandoverRecordStatus.draft,
    } as any);
    return instance.id;
  }

  async handleWorkflowCallback(
    instanceId: string,
    status: string,
    variables: any,
  ): Promise<void> {
    const businessKey = variables.businessKey;
    await this.businessApprovalContextService?.syncWorkflowStatus(instanceId, {
      status: status === "completed" ? "2" : "3",
      endedAt: new Date().toISOString(),
      currentNodeId: status === "completed" ? "end" : "cancelled",
      currentNodeName: status === "completed" ? "审批完成" : "审批取消",
    });
    await this.syncApprovalParticipants(instanceId);

    if (businessKey?.startsWith("project_") && !businessKey.includes("close")) {
      const projectId = businessKey.replace("project_", "");
      if (status === "completed") {
        const project = await this.projectRepository.findOne({
          where: { id: projectId },
        });
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.executing as any,
          approvalStatus: "2",
          currentNodeName: "立项审批已通过",
          actualStartDate: project?.actualStartDate || this.getTodayDate(),
          phase: "delivery" as any,
        });
        await this.projectsService.ensureKnowledgeSpaceWhenProjectExecuting(
          projectId,
        );
      } else {
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.draft as any,
          approvalStatus: "3",
          currentNodeName: "立项审批已驳回",
        });
      }
    } else if (businessKey?.startsWith("project_close_")) {
      const projectId = businessKey.replace("project_close_", "");
      if (status === "completed") {
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.completed as any,
          approvalStatus: "2",
          currentNodeName: "结项审批已通过",
          actualEndDate: this.getTodayDate(),
          phase: "closure" as any,
        });
      } else {
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.executing as any,
          approvalStatus: "3",
          currentNodeName: "结项审批已驳回",
        });
      }
    } else if (businessKey?.startsWith("task_")) {
      const taskId = businessKey.replace("task_", "");
      const task = await this.taskRepository.findOne({
        where: { id: taskId, isDelete: null as any } as any,
      });
      const isPendingCompletionApproval =
        task?.status === TaskStatus.pendingCompletionApproval &&
        String(task?.approvalStatus || "") === "1";
      if (isPendingCompletionApproval) {
        await this.taskRepository.update(taskId, {
          status:
            status === "completed"
              ? TaskStatus.completed
              : TaskStatus.inProgress,
          approvalStatus: status === "completed" ? "2" : "3",
          currentNodeName:
            status === "completed" ? "完成审批已通过" : "完成审批已驳回",
          ...(status === "completed" && !task?.actualEndDate
            ? { actualEndDate: this.getTodayDate() }
            : {}),
        } as any);
      } else {
        await this.taskRepository.update(taskId, {
          status:
            status === "completed"
              ? TaskStatus.inProgress
              : TaskStatus.rejected,
          approvalStatus: status === "completed" ? "2" : "3",
          currentNodeName:
            status === "completed"
              ? "任务审批已通过，进入处理中"
              : "任务审批已驳回",
        } as any);
      }
    } else if (businessKey?.startsWith("ticket_")) {
      const ticketId = businessKey.replace("ticket_", "");
      await this.ticketRepository.update(ticketId, {
        status:
          status === "completed"
            ? TicketStatus.inProgress
            : TicketStatus.closed,
        approvalStatus: status === "completed" ? "2" : "3",
        currentNodeName:
          status === "completed"
            ? "工单审批已通过，进入处理中"
            : "工单审批已驳回，已关闭",
      } as any);
    } else if (businessKey?.startsWith("change_")) {
      const changeId = businessKey.replace("change_", "");
      await this.changeRepository.update(changeId, {
        status:
          status === "completed"
            ? ChangeStatus.approved
            : ChangeStatus.rejected,
        approvalStatus: status === "completed" ? "2" : "3",
        currentNodeName:
          status === "completed" ? "变更审批已通过" : "变更审批已驳回",
      } as any);
    } else if (businessKey?.startsWith("customer_")) {
      const customerId = businessKey.replace("customer_", "");
      await this.customersService?.syncApprovalParticipants(
        customerId,
        instanceId,
      );
      await this.customerRepository.update(customerId, {
        status: status === "completed" ? "2" : "4",
        approvalStatus: status === "completed" ? "2" : "3",
        currentNodeName:
          status === "completed"
            ? "客户审批已通过，转为意向客户"
            : "客户审批已驳回，转为流失客户",
      } as any);
    } else if (businessKey?.startsWith("goLive_")) {
      const recordId = businessKey.replace("goLive_", "");
      const record = await this.goLiveRecordRepository.findOne({
        where: { id: recordId },
      });
      if (record?.status !== GoLiveRecordStatus.pendingApproval) return;
      await this.goLiveRecordRepository.update(recordId, {
        status:
          status === "completed"
            ? GoLiveRecordStatus.approved
            : GoLiveRecordStatus.cancelled,
      } as any);
    } else if (businessKey?.startsWith("acceptance_")) {
      const recordId = businessKey.replace("acceptance_", "");
      const record = await this.acceptanceRecordRepository.findOne({
        where: { id: recordId },
      });
      if (record?.result !== AcceptanceRecordResult.pending) return;
      await this.acceptanceRecordRepository.update(recordId, {
        result:
          status === "completed"
            ? AcceptanceRecordResult.passed
            : AcceptanceRecordResult.rejected,
      } as any);
    } else if (businessKey?.startsWith("handover_")) {
      const recordId = businessKey.replace("handover_", "");
      const record = await this.handoverRecordRepository.findOne({
        where: { id: recordId },
      });
      if (record?.status !== HandoverRecordStatus.draft) return;
      await this.handoverRecordRepository.update(recordId, {
        status:
          status === "completed"
            ? HandoverRecordStatus.confirmed
            : HandoverRecordStatus.draft,
      } as any);
    } else if (businessKey?.startsWith("articleBorrow_")) {
      const borrowId = businessKey.replace("articleBorrow_", "");
      await this.handleArticleBorrowWorkflowCallback(borrowId, status);
    }
  }

  private async handleArticleBorrowWorkflowCallback(
    borrowId: string,
    status: string,
  ) {
    if (!this.articleBorrowRepository) return;
    const row = await this.articleBorrowRepository.findOne({
      where: { id: borrowId as any },
    });
    if (!row || row.status !== KnowledgeBorrowStatus.pending) return;

    if (status !== "completed") {
      await this.articleBorrowRepository.update(borrowId, {
        status: KnowledgeBorrowStatus.rejected,
        approvalStatus: "3",
        approvedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        currentNodeName: "借阅审批已驳回",
        rejectReason: "审批未通过",
      } as any);
      return;
    }

    const now = dayjs();
    const requestedStart = row.requestedStartTime
      ? dayjs(row.requestedStartTime)
      : null;
    const shouldWait = requestedStart?.isValid() && requestedStart.isAfter(now);
    const start = shouldWait ? requestedStart : now;
    const end = start.add(Number(row.requestedDays || 1), "day");
    const borrowStartTime = start.format("YYYY-MM-DD HH:mm:ss");
    const borrowEndTime = end.format("YYYY-MM-DD HH:mm:ss");

    await this.articleBorrowRepository.update(borrowId, {
      status: shouldWait
        ? KnowledgeBorrowStatus.waitingStart
        : KnowledgeBorrowStatus.active,
      approvalStatus: "2",
      approvedAt: now.format("YYYY-MM-DD HH:mm:ss"),
      borrowStartTime,
      borrowEndTime,
      currentNodeName: shouldWait
        ? "借阅审批已通过，等待开始借阅"
        : "借阅审批已通过，已开始借阅",
    } as any);

    if (shouldWait) {
      this.scheduleArticleBorrowStart(borrowId, borrowStartTime, borrowEndTime);
    } else {
      this.scheduleArticleBorrowExpire(borrowId, borrowEndTime);
    }
  }

  private scheduleArticleBorrowStart(
    id: string,
    borrowStartTime: string,
    borrowEndTime: string,
  ) {
    if (!this.tasksService || !this.articleBorrowRepository) return;
    this.tasksService.deleteTimeout(`articleBorrowStart:${id}`);
    this.tasksService.addTimeout(
      `articleBorrowStart:${id}`,
      borrowStartTime,
      async () => {
        const row = await this.articleBorrowRepository?.findOne({
          where: { id: id as any },
        });
        if (!row || row.status !== KnowledgeBorrowStatus.waitingStart) return;
        await this.articleBorrowRepository?.update(id, {
          status: KnowledgeBorrowStatus.active,
          currentNodeName: "已开始借阅",
        } as any);
        this.scheduleArticleBorrowExpire(
          id,
          row.borrowEndTime || borrowEndTime,
        );
      },
    );
  }

  private scheduleArticleBorrowExpire(id: string, borrowEndTime: string) {
    if (!this.tasksService || !this.articleBorrowRepository) return;
    this.tasksService.deleteTimeout(`articleBorrow:${id}`);
    this.tasksService.addTimeout(
      `articleBorrow:${id}`,
      borrowEndTime,
      async () => {
        const row = await this.articleBorrowRepository?.findOne({
          where: { id: id as any },
        });
        if (
          !row ||
          ![
            KnowledgeBorrowStatus.active,
            KnowledgeBorrowStatus.approved,
          ].includes(row.status)
        )
          return;
        await this.articleBorrowRepository?.update(id, {
          status: KnowledgeBorrowStatus.expired,
        } as any);
      },
    );
  }

  async handleReturnedToStarter(
    instanceId: string,
    variables: any,
  ): Promise<void> {
    const businessKey = variables.businessKey;

    if (businessKey?.startsWith("project_") && !businessKey.includes("close")) {
      const projectId = businessKey.replace("project_", "");
      await this.projectRepository.update(projectId, {
        status: ProjectStatus.draft as any,
        approvalStatus: "3",
        currentNodeName: "已退回发起人，待修改后重新提交",
      });
    } else if (businessKey?.startsWith("project_close_")) {
      const projectId = businessKey.replace("project_close_", "");
      await this.projectRepository.update(projectId, {
        status: ProjectStatus.executing as any,
        approvalStatus: "3",
        currentNodeName: "结项申请已退回发起人，待处理",
      });
    } else if (businessKey?.startsWith("task_")) {
      const taskId = businessKey.replace("task_", "");
      await this.taskRepository.update(taskId, {
        approvalStatus: "3",
        currentNodeName: "已退回发起人，待修改后重新提交",
      } as any);
    } else if (businessKey?.startsWith("ticket_")) {
      const ticketId = businessKey.replace("ticket_", "");
      await this.ticketRepository.update(ticketId, {
        approvalStatus: "3",
        currentNodeName: "已退回发起人，待修改后重新提交",
      } as any);
    } else if (businessKey?.startsWith("change_")) {
      const changeId = businessKey.replace("change_", "");
      await this.changeRepository.update(changeId, {
        approvalStatus: "3",
        currentNodeName: "已退回发起人，待修改后重新提交",
      } as any);
    } else if (businessKey?.startsWith("customer_")) {
      const customerId = businessKey.replace("customer_", "");
      await this.customerRepository.update(customerId, {
        approvalStatus: "3",
        currentNodeName: "已退回发起人，待修改后重新提交",
      } as any);
    }
  }

  async handleCloseReturnedInstance(
    instanceId: string,
    variables: any,
  ): Promise<void> {
    const businessKey = variables.businessKey;

    if (businessKey?.startsWith("project_") && !businessKey.includes("close")) {
      const projectId = businessKey.replace("project_", "");
      await this.projectRepository.update(projectId, {
        status: ProjectStatus.draft as any,
        approvalStatus: "3",
        currentNodeName: "立项审批已驳回，实例已结束",
      });
    } else if (businessKey?.startsWith("project_close_")) {
      const projectId = businessKey.replace("project_close_", "");
      await this.projectRepository.update(projectId, {
        status: ProjectStatus.executing as any,
        approvalStatus: "3",
        currentNodeName: "结项审批已驳回，实例已结束",
      });
    } else if (businessKey?.startsWith("task_")) {
      const taskId = businessKey.replace("task_", "");
      await this.taskRepository.update(taskId, {
        status: TaskStatus.rejected,
        approvalStatus: "3",
        currentNodeName: "任务审批已驳回，实例已结束",
      } as any);
    } else if (businessKey?.startsWith("ticket_")) {
      const ticketId = businessKey.replace("ticket_", "");
      await this.ticketRepository.update(ticketId, {
        status: TicketStatus.closed,
        approvalStatus: "3",
        currentNodeName: "工单审批已驳回，实例已结束",
      } as any);
    } else if (businessKey?.startsWith("change_")) {
      const changeId = businessKey.replace("change_", "");
      await this.changeRepository.update(changeId, {
        status: ChangeStatus.rejected,
        approvalStatus: "3",
        currentNodeName: "变更审批已驳回，实例已结束",
      } as any);
    } else if (businessKey?.startsWith("customer_")) {
      const customerId = businessKey.replace("customer_", "");
      await this.customerRepository.update(customerId, {
        status: "4",
        approvalStatus: "3",
        currentNodeName: "客户审批已驳回，实例已结束",
      } as any);
    }
  }

  async handleResubmitReturnedInstance(
    instanceId: string,
    variables: any,
  ): Promise<void> {
    const businessKey = variables.businessKey;

    if (businessKey?.startsWith("project_") && !businessKey.includes("close")) {
      const projectId = businessKey.replace("project_", "");
      await this.projectRepository.update(projectId, {
        workflowInstanceId: instanceId,
        status: ProjectStatus.approvalPending as any,
        approvalStatus: "1",
        currentNodeName: "立项审批中",
      });
    } else if (businessKey?.startsWith("project_close_")) {
      const projectId = businessKey.replace("project_close_", "");
      await this.projectRepository.update(projectId, {
        workflowInstanceId: instanceId,
        status: ProjectStatus.closeApprovalPending as any,
        approvalStatus: "1",
        currentNodeName: "结项审批中",
      });
    } else if (businessKey?.startsWith("task_")) {
      const taskId = businessKey.replace("task_", "");
      await this.taskRepository.update(taskId, {
        workflowInstanceId: instanceId,
        approvalStatus: "1",
        currentNodeName: "任务审批中",
      } as any);
    } else if (businessKey?.startsWith("ticket_")) {
      const ticketId = businessKey.replace("ticket_", "");
      await this.ticketRepository.update(ticketId, {
        workflowInstanceId: instanceId,
        approvalStatus: "1",
        currentNodeName: "工单审批中",
      } as any);
    } else if (businessKey?.startsWith("change_")) {
      const changeId = businessKey.replace("change_", "");
      await this.changeRepository.update(changeId, {
        workflowInstanceId: instanceId,
        approvalStatus: "1",
        currentNodeName: "变更审批中",
      } as any);
    } else if (businessKey?.startsWith("customer_")) {
      const customerId = businessKey.replace("customer_", "");
      await this.customerRepository.update(customerId, {
        workflowInstanceId: instanceId,
        approvalStatus: "1",
        currentNodeName: "客户审批中",
      } as any);
    }
  }

  async startTaskApproval(
    taskId: string,
    initiatorId: string,
  ): Promise<string> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new BadRequestException("任务不存在");
    await this.projectsService.assertExecutionObjectPermission(
      task.projectId,
      initiatorId,
    );

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "task",
        businessScene: "approval",
        businessKey: `task_${taskId}`,
        variables: { starterId: initiatorId, businessType: "task" },
      },
      initiatorId,
    );

    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "task",
      businessId: taskId,
      businessScene: "approval",
      sceneTitle: "任务审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "project",
      rootBusinessId: task.projectId,
      projectId: task.projectId,
    });
    await this.syncApprovalParticipants(instance.id);

    await this.taskRepository.update(taskId, {
      workflowInstanceId: instance.id,
      approvalStatus: "1",
      currentNodeName: "任务审批中",
    } as any);
    return instance.id;
  }

  async startTicketApproval(
    ticketId: string,
    initiatorId: string,
  ): Promise<string> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });
    if (!ticket) throw new BadRequestException("工单不存在");
    await this.projectsService.assertExecutionObjectPermission(
      ticket.projectId,
      initiatorId,
    );

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "ticket",
        businessScene: "approval",
        businessKey: `ticket_${ticketId}`,
        variables: { starterId: initiatorId, businessType: "ticket" },
      },
      initiatorId,
    );

    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "ticket",
      businessId: ticketId,
      businessScene: "approval",
      sceneTitle: "工单审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "project",
      rootBusinessId: ticket.projectId,
      projectId: ticket.projectId,
    });
    await this.syncApprovalParticipants(instance.id);

    await this.ticketRepository.update(ticketId, {
      workflowInstanceId: instance.id,
      approvalStatus: "1",
      currentNodeName: "工单审批中",
    } as any);
    return instance.id;
  }

  async startChangeApproval(
    changeId: string,
    initiatorId: string,
  ): Promise<string> {
    const change = await this.changeRepository.findOne({
      where: { id: changeId },
    });
    if (!change) throw new BadRequestException("变更不存在");
    await this.projectsService.assertExecutionObjectPermission(
      change.projectId,
      initiatorId,
    );

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "change",
        businessScene: "approval",
        businessKey: `change_${changeId}`,
        variables: { starterId: initiatorId, businessType: "change" },
      },
      initiatorId,
    );

    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "change",
      businessId: changeId,
      businessScene: "approval",
      sceneTitle: "变更审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "project",
      rootBusinessId: change.projectId,
      projectId: change.projectId,
    });
    await this.syncApprovalParticipants(instance.id);

    await this.changeRepository.update(changeId, {
      status: ChangeStatus.pending,
      workflowInstanceId: instance.id,
      approvalStatus: "1",
      currentNodeName: "变更审批中",
    } as any);
    return instance.id;
  }

  async startCustomerApproval(
    customerId: string,
    initiatorId: string,
  ): Promise<string> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) throw new BadRequestException("客户不存在");
    if (!customer.salesId)
      throw new BadRequestException("客户审批前必须维护销售负责人");

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: "customer",
        businessScene: "approval",
        businessKey: `customer_${customerId}`,
        variables: { starterId: initiatorId, businessType: "customer" },
      },
      initiatorId,
    );

    await this.businessApprovalContextService?.createFromWorkflowStart({
      businessType: "customer",
      businessId: customerId,
      businessScene: "approval",
      sceneTitle: "客户审批",
      workflowInstance: instance,
      starterId: initiatorId,
      rootBusinessType: "customer",
      rootBusinessId: customerId,
    });
    await this.syncApprovalParticipants(instance.id);

    await this.customerRepository.update(customerId, {
      workflowInstanceId: instance.id,
      approvalStatus: "1",
      currentNodeName: "客户审批中",
    } as any);
    return instance.id;
  }
}
