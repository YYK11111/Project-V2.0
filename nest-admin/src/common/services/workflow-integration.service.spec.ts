import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { WorkflowService } from "src/modulesBusi/workflow/service";
import { WorkflowIntegrationService } from "./workflow-integration.service";
import { ProjectStatus } from "src/modulesBusi/projects/entity";
import { TaskStatus } from "src/modulesBusi/tasks/entity";
import { GoLiveRecordStatus } from "src/modulesBusi/go-live-records/entity";
import { AcceptanceRecordResult } from "src/modulesBusi/acceptance-records/entity";
import { HandoverRecordStatus } from "src/modulesBusi/handover-records/entity";
import { KnowledgeBorrowStatus } from "src/modulesBusi/articleBorrows/entity";

describe("WorkflowIntegrationService 循环依赖声明", () => {
  it("通过 forwardRef 注入 WorkflowService", () => {
    const deps =
      Reflect.getMetadata(
        SELF_DECLARED_DEPS_METADATA,
        WorkflowIntegrationService,
      ) || [];
    const workflowServiceDep = deps.find((item) => item.index === 8)?.param;

    expect(typeof workflowServiceDep?.forwardRef).toBe("function");
    expect(workflowServiceDep.forwardRef()).toBe(WorkflowService);
  });
});

describe("WorkflowIntegrationService 任务完成审批回调", () => {
  const createService = () => {
    const taskRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const service = new WorkflowIntegrationService(
      { findOne: jest.fn(), update: jest.fn(), save: jest.fn() } as any,
      taskRepository as any,
      { update: jest.fn() } as any,
      { update: jest.fn() } as any,
      { update: jest.fn() } as any,
      { findOne: jest.fn(), update: jest.fn() } as any,
      { findOne: jest.fn(), update: jest.fn() } as any,
      { findOne: jest.fn(), update: jest.fn() } as any,
      { startBusinessWorkflow: jest.fn() } as any,
      { ensureKnowledgeSpaceWhenProjectExecuting: jest.fn() } as any,
    );
    return { service, taskRepository };
  };

  it("待完成审批通过后将任务置为已完成", async () => {
    const { service, taskRepository } = createService();
    taskRepository.findOne.mockResolvedValue({
      id: "task-1",
      status: TaskStatus.pendingCompletionApproval,
      approvalStatus: "1",
    });

    await service.handleWorkflowCallback("", "completed", {
      businessKey: "task_task-1",
    });

    expect(taskRepository.update).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        status: TaskStatus.completed,
        approvalStatus: "2",
        currentNodeName: "完成审批已通过",
      }),
    );
  });

  it("待完成审批驳回后将任务回退到处理中", async () => {
    const { service, taskRepository } = createService();
    taskRepository.findOne.mockResolvedValue({
      id: "task-2",
      status: TaskStatus.pendingCompletionApproval,
      approvalStatus: "1",
    });

    await service.handleWorkflowCallback("", "rejected", {
      businessKey: "task_task-2",
    });

    expect(taskRepository.update).toHaveBeenCalledWith(
      "task-2",
      expect.objectContaining({
        status: TaskStatus.inProgress,
        approvalStatus: "3",
        currentNodeName: "完成审批已驳回",
      }),
    );
  });
});

describe("WorkflowIntegrationService 审批发起权限", () => {
  const createService = () => {
    const workflowService = {
      startBusinessWorkflow: jest.fn().mockResolvedValue({
        id: "wf-1",
        definitionId: "def-1",
        definitionCode: "project-init",
        status: "1",
        currentNodeId: "node-1",
        startTime: "2026-05-15 10:00:00",
      }),
    };
    const approvalContextService = {
      createFromWorkflowStart: jest.fn(),
      syncWorkflowStatus: jest.fn(),
      syncParticipantsFromWorkflow: jest.fn(),
    };
    const repositories = {
      project: { findOne: jest.fn(), update: jest.fn(), save: jest.fn() },
      task: { findOne: jest.fn(), update: jest.fn() },
      ticket: { findOne: jest.fn(), update: jest.fn() },
      change: { findOne: jest.fn(), update: jest.fn() },
      customer: { findOne: jest.fn(), update: jest.fn() },
      goLive: { findOne: jest.fn(), update: jest.fn() },
      acceptance: { findOne: jest.fn(), update: jest.fn() },
      handover: { findOne: jest.fn(), update: jest.fn() },
      articleBorrow: { findOne: jest.fn(), update: jest.fn() },
    };
    const tasksService = {
      deleteTimeout: jest.fn(),
      addTimeout: jest.fn(),
    };
    const projectsService = {
      ensureKnowledgeSpaceWhenProjectExecuting: jest.fn(),
      assertExecutionObjectPermission: jest.fn(),
    };
    const service = new WorkflowIntegrationService(
      repositories.project as any,
      repositories.task as any,
      repositories.ticket as any,
      repositories.change as any,
      repositories.customer as any,
      repositories.goLive as any,
      repositories.acceptance as any,
      repositories.handover as any,
      workflowService as any,
      projectsService as any,
      undefined,
      approvalContextService as any,
      repositories.articleBorrow as any,
      tasksService as any,
    );
    return {
      service,
      repositories,
      workflowService,
      projectsService,
      approvalContextService,
      tasksService,
    };
  };

  it("发起项目立项审批后创建立项审批上下文", async () => {
    const { service, repositories, approvalContextService } = createService();
    repositories.project.findOne.mockResolvedValue({
      id: "19",
      status: ProjectStatus.draft,
      name: "项目A",
    });

    await service.startProjectApproval("19", "u1");

    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "project",
        businessId: "19",
        businessScene: "initiation",
        sceneTitle: "立项审批",
        starterId: "u1",
        rootBusinessType: "project",
        rootBusinessId: "19",
        projectId: "19",
      }),
    );
    expect(
      approvalContextService.syncParticipantsFromWorkflow,
    ).toHaveBeenCalledWith("wf-1");
  });

  it("发起项目结项审批后创建结项审批上下文", async () => {
    const { service, repositories, approvalContextService } = createService();
    repositories.project.findOne.mockResolvedValue({
      id: "19",
      status: ProjectStatus.executing,
      name: "项目A",
    });

    await service.startProjectCloseApproval("19", "u1");

    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "project",
        businessId: "19",
        businessScene: "closure",
        sceneTitle: "结项审批",
        starterId: "u1",
        rootBusinessType: "project",
        rootBusinessId: "19",
        projectId: "19",
      }),
    );
  });

  it("发起项目变更审批后创建归属项目的变更审批上下文", async () => {
    const { service, repositories, approvalContextService, projectsService } =
      createService();
    repositories.change.findOne.mockResolvedValue({
      id: "change-1",
      projectId: "19",
      title: "范围调整",
    });

    await service.startChangeApproval("change-1", "u1");

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("19", "u1");
    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "change",
        businessId: "change-1",
        businessScene: "approval",
        sceneTitle: "变更审批",
        starterId: "u1",
        rootBusinessType: "project",
        rootBusinessId: "19",
        projectId: "19",
      }),
    );
  });

  it("发起任务审批后创建归属项目的任务审批上下文", async () => {
    const { service, repositories, approvalContextService, projectsService } =
      createService();
    repositories.task.findOne.mockResolvedValue({
      id: "task-1",
      projectId: "19",
      status: TaskStatus.pending,
      approvalStatus: "0",
      name: "需求确认",
    });

    await service.startTaskApproval("task-1", "u1");

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("19", "u1");
    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "task",
        businessId: "task-1",
        businessScene: "approval",
        sceneTitle: "任务审批",
        starterId: "u1",
        rootBusinessType: "project",
        rootBusinessId: "19",
        projectId: "19",
      }),
    );
  });

  it("仅允许待处理任务发起普通任务审批", async () => {
    const { service, repositories, projectsService } = createService();
    repositories.task.findOne.mockResolvedValue({
      id: "task-1-invalid",
      projectId: "19",
      status: TaskStatus.inProgress,
      approvalStatus: "0",
    });
    projectsService.assertExecutionObjectPermission.mockResolvedValue(
      undefined,
    );

    await expect(
      service.startTaskApproval("task-1-invalid", "u1"),
    ).rejects.toThrow("当前任务状态不允许发起审批");
  });

  it("发起工单审批后创建归属项目的工单审批上下文", async () => {
    const { service, repositories, approvalContextService, projectsService } =
      createService();
    repositories.ticket.findOne.mockResolvedValue({
      id: "ticket-1",
      projectId: "19",
      title: "缺陷处理",
    });

    await service.startTicketApproval("ticket-1", "u1");

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("19", "u1");
    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "ticket",
        businessId: "ticket-1",
        businessScene: "approval",
        sceneTitle: "工单审批",
        starterId: "u1",
        rootBusinessType: "project",
        rootBusinessId: "19",
        projectId: "19",
      }),
    );
  });

  it("项目审批回调时同步审批上下文状态和参与人", async () => {
    const { service, repositories, approvalContextService } = createService();
    repositories.project.findOne.mockResolvedValue({
      id: "19",
      status: ProjectStatus.approvalPending,
    });

    await service.handleWorkflowCallback("wf-1", "completed", {
      businessKey: "project_19",
    });

    expect(approvalContextService.syncWorkflowStatus).toHaveBeenCalledWith(
      "wf-1",
      expect.objectContaining({
        status: "2",
        endedAt: expect.any(String),
      }),
    );
    expect(
      approvalContextService.syncParticipantsFromWorkflow,
    ).toHaveBeenCalledWith("wf-1");
  });

  it("发起上线审批前校验项目执行对象权限", async () => {
    const { service, repositories, projectsService, approvalContextService } =
      createService();
    repositories.goLive.findOne.mockResolvedValue({
      id: "go-1",
      projectId: "p1",
      status: GoLiveRecordStatus.draft,
    });

    await service.startGoLiveApproval("go-1", "u1");

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p1", "u1");
    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "goLive",
        businessId: "go-1",
        businessScene: "approval",
        sceneTitle: "上线审批",
        rootBusinessType: "project",
        rootBusinessId: "p1",
        projectId: "p1",
      }),
    );
  });

  it("仅允许草稿上线单发起审批", async () => {
    const { service, repositories, workflowService } = createService();
    repositories.goLive.findOne.mockResolvedValue({
      id: "go-2",
      projectId: "p1",
      status: GoLiveRecordStatus.approved,
    });

    await expect(service.startGoLiveApproval("go-2", "u1")).rejects.toThrow(
      "只有草稿状态的上线单才能提交审批",
    );
    expect(workflowService.startBusinessWorkflow).not.toHaveBeenCalled();
    expect(repositories.goLive.update).not.toHaveBeenCalled();
  });

  it("发起验收审批前校验项目执行对象权限", async () => {
    const { service, repositories, projectsService, approvalContextService } =
      createService();
    repositories.acceptance.findOne.mockResolvedValue({
      id: "acc-1",
      projectId: "p1",
      result: AcceptanceRecordResult.pending,
    });

    await service.startAcceptanceApproval("acc-1", "u1");

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p1", "u1");
    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "acceptance",
        businessId: "acc-1",
        businessScene: "approval",
        sceneTitle: "验收审批",
        rootBusinessType: "project",
        rootBusinessId: "p1",
        projectId: "p1",
      }),
    );
  });

  it("仅允许待验收或整改中验收单发起审批", async () => {
    const { service, repositories, workflowService } = createService();
    repositories.acceptance.findOne.mockResolvedValue({
      id: "acc-2",
      projectId: "p1",
      result: AcceptanceRecordResult.passed,
    });

    await expect(
      service.startAcceptanceApproval("acc-2", "u1"),
    ).rejects.toThrow("当前验收结果不允许提交审批");
    expect(workflowService.startBusinessWorkflow).not.toHaveBeenCalled();
    expect(repositories.acceptance.update).not.toHaveBeenCalled();
  });

  it("发起交接审批前校验项目执行对象权限", async () => {
    const { service, repositories, projectsService, approvalContextService } =
      createService();
    repositories.handover.findOne.mockResolvedValue({
      id: "handover-1",
      projectId: "p1",
      status: HandoverRecordStatus.draft,
    });

    await service.startHandoverApproval("handover-1", "u1");

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p1", "u1");
    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "handover",
        businessId: "handover-1",
        businessScene: "approval",
        sceneTitle: "交接审批",
        rootBusinessType: "project",
        rootBusinessId: "p1",
        projectId: "p1",
      }),
    );
  });

  it("发起客户审批后创建客户审批上下文", async () => {
    const { service, repositories, approvalContextService } = createService();
    repositories.customer.findOne.mockResolvedValue({
      id: "customer-1",
      salesId: "sales-1",
      name: "客户A",
    });

    await service.startCustomerApproval("customer-1", "u1");

    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "customer",
        businessId: "customer-1",
        businessScene: "approval",
        sceneTitle: "客户审批",
        rootBusinessType: "customer",
        rootBusinessId: "customer-1",
      }),
    );
  });

  it("仅允许草稿交接单发起审批", async () => {
    const { service, repositories, workflowService } = createService();
    repositories.handover.findOne.mockResolvedValue({
      id: "handover-2",
      projectId: "p1",
      status: HandoverRecordStatus.confirmed,
    });

    await expect(
      service.startHandoverApproval("handover-2", "u1"),
    ).rejects.toThrow("只有草稿状态的交接单才能提交审批");
    expect(workflowService.startBusinessWorkflow).not.toHaveBeenCalled();
    expect(repositories.handover.update).not.toHaveBeenCalled();
  });

  it("上线审批回调只更新待审批上线单", async () => {
    const { service, repositories } = createService();
    repositories.goLive.findOne.mockResolvedValue({
      id: "go-3",
      status: GoLiveRecordStatus.approved,
    });

    await service.handleWorkflowCallback("", "completed", {
      businessKey: "goLive_go-3",
    });

    expect(repositories.goLive.update).not.toHaveBeenCalled();
  });

  it("验收审批回调只更新待验收验收单", async () => {
    const { service, repositories } = createService();
    repositories.acceptance.findOne.mockResolvedValue({
      id: "acc-3",
      result: AcceptanceRecordResult.passed,
    });

    await service.handleWorkflowCallback("", "completed", {
      businessKey: "acceptance_acc-3",
    });

    expect(repositories.acceptance.update).not.toHaveBeenCalled();
  });

  it("交接审批回调只更新草稿交接单", async () => {
    const { service, repositories } = createService();
    repositories.handover.findOne.mockResolvedValue({
      id: "handover-3",
      status: HandoverRecordStatus.confirmed,
    });

    await service.handleWorkflowCallback("", "completed", {
      businessKey: "handover_handover-3",
    });

    expect(repositories.handover.update).not.toHaveBeenCalled();
  });

  it("知识借阅审批通过且开始时间未到时进入等待生效", async () => {
    const { service, repositories, tasksService } = createService();
    const requestedStartTime = "2999-05-16 10:00:00";
    repositories.articleBorrow.findOne.mockResolvedValue({
      id: "borrow-1",
      status: KnowledgeBorrowStatus.pending,
      requestedDays: 3,
      requestedStartTime,
    });

    await service.handleWorkflowCallback("wf-1", "completed", {
      businessKey: "articleBorrow_borrow-1",
    });

    expect(repositories.articleBorrow.update).toHaveBeenCalledWith(
      "borrow-1",
      expect.objectContaining({
        status: KnowledgeBorrowStatus.waitingStart,
        approvalStatus: "2",
        currentNodeName: "借阅审批已通过，等待开始借阅",
        borrowStartTime: requestedStartTime,
        borrowEndTime: "2999-05-19 10:00:00",
      }),
    );
    expect(tasksService.addTimeout).toHaveBeenCalledWith(
      "articleBorrowStart:borrow-1",
      requestedStartTime,
      expect.any(Function),
    );
  });

  it("知识借阅审批通过且开始时间已过时立即生效", async () => {
    const { service, repositories, tasksService } = createService();
    repositories.articleBorrow.findOne.mockResolvedValue({
      id: "borrow-2",
      status: KnowledgeBorrowStatus.pending,
      requestedDays: 2,
      requestedStartTime: "2000-01-01 00:00:00",
    });

    await service.handleWorkflowCallback("wf-2", "completed", {
      businessKey: "articleBorrow_borrow-2",
    });

    expect(repositories.articleBorrow.update).toHaveBeenCalledWith(
      "borrow-2",
      expect.objectContaining({
        status: KnowledgeBorrowStatus.active,
        approvalStatus: "2",
        currentNodeName: "借阅审批已通过，已开始借阅",
        borrowStartTime: expect.any(String),
        borrowEndTime: expect.any(String),
      }),
    );
    expect(tasksService.addTimeout).toHaveBeenCalledWith(
      "articleBorrow:borrow-2",
      expect.any(String),
      expect.any(Function),
    );
  });

  it("知识借阅审批拒绝时标记借阅申请为已拒绝", async () => {
    const { service, repositories } = createService();
    repositories.articleBorrow.findOne.mockResolvedValue({
      id: "borrow-3",
      status: KnowledgeBorrowStatus.pending,
      requestedDays: 2,
    });

    await service.handleWorkflowCallback("wf-3", "rejected", {
      businessKey: "articleBorrow_borrow-3",
    });

    expect(repositories.articleBorrow.update).toHaveBeenCalledWith(
      "borrow-3",
      expect.objectContaining({
        status: KnowledgeBorrowStatus.rejected,
        approvalStatus: "3",
        currentNodeName: "借阅审批已驳回",
      }),
    );
  });
});

describe("WorkflowIntegrationService 客户审批参与人可见性", () => {
  it("客户审批完成后会同步审批参与人到客户可见人列表", async () => {
    const customerRepository = { findOne: jest.fn(), update: jest.fn() };
    const customersService = {
      syncApprovalParticipants: jest.fn(),
    };
    const service = new WorkflowIntegrationService(
      { findOne: jest.fn(), update: jest.fn(), save: jest.fn() } as any,
      { findOne: jest.fn(), update: jest.fn() } as any,
      { update: jest.fn() } as any,
      { update: jest.fn() } as any,
      customerRepository as any,
      { findOne: jest.fn(), update: jest.fn() } as any,
      { findOne: jest.fn(), update: jest.fn() } as any,
      { findOne: jest.fn(), update: jest.fn() } as any,
      { startBusinessWorkflow: jest.fn() } as any,
      { ensureKnowledgeSpaceWhenProjectExecuting: jest.fn() } as any,
      customersService as any,
    );

    await service.handleWorkflowCallback("wf-1", "completed", {
      businessKey: "customer_c1",
    });

    expect(customersService.syncApprovalParticipants).toHaveBeenCalledWith(
      "c1",
      "wf-1",
    );
  });
});
