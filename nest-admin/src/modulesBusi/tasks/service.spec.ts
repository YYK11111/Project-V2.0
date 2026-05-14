import { readFileSync } from "fs";
import { resolve } from "path";
import { TasksService } from "./service";
import { TaskStatus } from "./entity";
import { MessageType } from "src/modules/messages/entity";

describe("Tasks source guards", () => {
  it("定义待完成审批状态并暴露状态映射", () => {
    const source = readFileSync(resolve(__dirname, "entity.ts"), "utf-8");

    expect(source).toContain('pendingCompletionApproval = "6"');
    expect(source).toContain(
      '[TaskStatus.pendingCompletionApproval]: "待完成审批"',
    );
  });

  it("声明任务延期记录实体并注册到任务模块", () => {
    const entitySource = readFileSync(
      resolve(__dirname, "entities/task-delay-record.entity.ts"),
      "utf-8",
    );
    const moduleSource = readFileSync(resolve(__dirname, "module.ts"), "utf-8");

    expect(entitySource).toContain('@Entity("task_delay_record")');
    expect(entitySource).toContain("taskId: string");
    expect(entitySource).toContain("beforeEndDate: string");
    expect(entitySource).toContain("afterEndDate: string");
    expect(entitySource).toContain("reason: string");
    expect(entitySource).toContain("operatorId: string");
    expect(entitySource).toContain("operatorName: string");
    expect(moduleSource).toMatch(
      /TypeOrmModule\.forFeature\(\[[\s\S]*TaskDelayRecord[\s\S]*\]\)/,
    );
  });
});

describe("TasksService lifecycle actions", () => {
  const createService = () => {
    const repository = {
      save: jest.fn(async (entity) => ({
        ...entity,
        id: entity.id || "task-new",
      })),
      findOne: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const dependencyRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const delayRecordRepository = {
      create: jest.fn((payload) => payload),
      save: jest.fn(),
      find: jest.fn(),
    };
    const timeLogRepository = {
      find: jest.fn(),
      query: jest.fn(),
    };
    const taskCommentRepository = {
      find: jest.fn().mockResolvedValue([]),
      query: jest.fn(),
    };
    const userRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const projectsService = {
      getProjectPermissionContext: jest.fn(),
      assertProjectPermission: jest.fn(),
      assertExecutionObjectPermission: jest.fn(),
      getVisibleProjectIdsForUser: jest.fn(),
      assertProjectNotArchived: jest.fn(),
      recalculateProjectProgress: jest.fn(),
      recalculateProjectSpentHours: jest.fn(),
    };
    const messagesService = {
      sendMessage: jest.fn(),
    };
    const systemScheduledJobsService = {
      isJobEnabled: jest.fn(),
      runJob: jest.fn(),
    };
    const sysFileService = {
      associateFiles: jest.fn(),
      repository: { find: jest.fn() },
    };
    const service = new TasksService(
      repository as any,
      dependencyRepository as any,
      delayRecordRepository as any,
      timeLogRepository as any,
      taskCommentRepository as any,
      userRepository as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      sysFileService as any,
      projectsService as any,
      messagesService as any,
      systemScheduledJobsService as any,
    );
    (service as any).delayRecordRepository = delayRecordRepository;

    return {
      service,
      repository,
      dependencyRepository,
      delayRecordRepository,
      timeLogRepository,
      taskCommentRepository,
      userRepository,
      projectsService,
      messagesService,
      sysFileService,
      systemScheduledJobsService,
    };
  };

  it("经办人可以开始任务且写入实际开始日期", async () => {
    const { service, repository, projectsService } = createService();
    const queueStartedReminders = jest
      .spyOn(service as any, "queueStartedReminders")
      .mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      leaderId: "leader-1",
      createUser: "creator-1",
      executorIds: ["executor-1"],
      status: TaskStatus.pending,
      actualStartDate: null,
    });
    projectsService.getProjectPermissionContext.mockResolvedValue({
      isManager: false,
      isDeliveryManager: false,
      isFunctionalLead: false,
    });

    await (service as any).startTask("task-1", "executor-1");

    expect(repository.update).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        status: TaskStatus.inProgress,
        actualStartDate: expect.any(String),
      }),
    );
    expect(queueStartedReminders).toHaveBeenCalledWith(
      expect.objectContaining({ id: "task-1" }),
    );
  });

  it("提交完成审批后进入待完成审批而不是直接已完成", async () => {
    const { service, repository, projectsService, messagesService } =
      createService();
    const queueAssignmentReminders = jest
      .spyOn(service as any, "queueAssignmentReminders")
      .mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({
      id: "task-2",
      projectId: "project-1",
      leaderId: "leader-1",
      createUser: "creator-1",
      executorIds: ["executor-1"],
      status: TaskStatus.inProgress,
      approvalStatus: "0",
    });
    projectsService.getProjectPermissionContext.mockResolvedValue({
      isManager: false,
      isDeliveryManager: false,
      isFunctionalLead: false,
    });

    await (service as any).submitCompletionApproval("task-2", "executor-1");

    expect(repository.update).toHaveBeenCalledWith(
      "task-2",
      expect.objectContaining({
        status: TaskStatus.pendingCompletionApproval,
        approvalStatus: "1",
      }),
    );
    expect(repository.update).not.toHaveBeenCalledWith(
      "task-2",
      expect.objectContaining({
        status: TaskStatus.completed,
      }),
    );
    expect(queueAssignmentReminders).not.toHaveBeenCalled();
    expect(messagesService.sendMessage).not.toHaveBeenCalled();
  });

  it("非执行人或管理者不能更新任务进度", async () => {
    const { service, repository, projectsService } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-4",
      projectId: "project-1",
      leaderId: "leader-1",
      createUser: "creator-1",
      executorIds: ["executor-1"],
      status: TaskStatus.inProgress,
    });
    projectsService.getProjectPermissionContext.mockResolvedValue({
      isManager: false,
      isDeliveryManager: false,
      isFunctionalLead: false,
    });

    await expect(
      service.updateProgress("task-4", 60, "viewer-1"),
    ).rejects.toThrow("当前无执行该任务的权限");
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("任务全量管理权限在列表行上返回可操作权限", async () => {
    const {
      service,
      repository,
      projectsService,
      timeLogRepository,
      taskCommentRepository,
      userRepository,
    } = createService() as any;
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: "task-1",
            projectId: "project-1",
            leaderId: "leader-1",
            createUser: "creator-1",
            executorIds: ["executor-1"],
          },
        ],
        1,
      ]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder);
    projectsService.getVisibleProjectIdsForUser.mockResolvedValue(null);
    projectsService.getProjectPermissionContext.mockImplementation(
      async (_projectId, _operatorId, permissions = []) => ({
        isManager: permissions.includes("business/projects/manageAll"),
        isDeliveryManager: false,
        isFunctionalLead: false,
      }),
    );
    userRepository.find.mockResolvedValue([]);
    taskCommentRepository.query.mockResolvedValue([]);
    timeLogRepository.query.mockResolvedValue([]);

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "admin-1",
      _operatorPermissions: ["business/tasks/manageAll"],
    });

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        canEdit: true,
        canDelete: true,
        canManage: true,
        canExecute: true,
      }),
    );
    expect(projectsService.getProjectPermissionContext).toHaveBeenCalledWith(
      "project-1",
      "admin-1",
      expect.arrayContaining(["business/projects/manageAll"]),
    );
  });

  it("完成审批驳回后回退到处理中", async () => {
    const { service, repository } = createService();
    const queueCompletionRejectedReminders = jest
      .spyOn(service as any, "queueCompletionRejectedReminders")
      .mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({
      id: "task-3",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.pendingCompletionApproval,
      approvalStatus: "1",
    });

    await (service as any).handleCompletionApprovalRejected("task-3");

    expect(repository.update).toHaveBeenCalledWith(
      "task-3",
      expect.objectContaining({
        status: TaskStatus.inProgress,
        approvalStatus: "3",
      }),
    );
    expect(queueCompletionRejectedReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-3",
        status: TaskStatus.pendingCompletionApproval,
        approvalStatus: "1",
      }),
    );
  });

  it("处理中任务延期时更新截止日期并保存延期记录", async () => {
    const { service, repository, delayRecordRepository } = createService();
    const queueDelayReminders = jest
      .spyOn(service as any, "queueDelayReminders")
      .mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({
      id: "task-5",
      projectId: "project-1",
      leaderId: "user-1",
      status: TaskStatus.inProgress,
      endDate: "2026-05-10",
      plannedEndDate: "2026-05-10",
      actualStartDate: null,
    });
    delayRecordRepository.save.mockResolvedValue({ id: "delay-1" });

    await (service as any).delayTask(
      "task-5",
      {
        afterEndDate: "2026-05-15",
        reason: "排期调整",
      },
      {
        id: "user-1",
        name: "测试用户",
      },
    );

    expect(repository.update).toHaveBeenCalledWith(
      "task-5",
      expect.objectContaining({
        endDate: "2026-05-15",
        plannedEndDate: "2026-05-15",
      }),
    );
    expect(delayRecordRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "task-5",
        beforeEndDate: "2026-05-10",
        afterEndDate: "2026-05-15",
        reason: "排期调整",
        operatorId: "user-1",
        operatorName: "测试用户",
      }),
    );
    expect(delayRecordRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "task-5",
        afterEndDate: "2026-05-15",
      }),
    );
    expect(queueDelayReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-5",
        endDate: "2026-05-10",
      }),
    );
  });

  it("queueAssignmentReminders 会向负责人和经办人去重后触发提醒准备", async () => {
    const { service } = createService();
    const queueTaskReminder = jest
      .spyOn(service as any, "queueTaskReminder")
      .mockResolvedValue(undefined);

    await (service as any).queueAssignmentReminders({
      id: "task-11",
      leaderId: "user-1",
      executorIds: ["user-1", "user-2", "", null, "user-2"],
    });

    expect(queueTaskReminder).toHaveBeenCalledTimes(2);
    expect(queueTaskReminder).toHaveBeenNthCalledWith(1, {
      taskId: "task-11",
      recipientId: "user-1",
      reminderType: "taskAssigned",
      messageType: MessageType.todo,
    });
    expect(queueTaskReminder).toHaveBeenNthCalledWith(2, {
      taskId: "task-11",
      recipientId: "user-2",
      reminderType: "taskAssigned",
      messageType: MessageType.todo,
    });
  });

  it("queueAssignmentReminders 会向消息中心写入任务分配提醒", async () => {
    const { service, repository, messagesService } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-12",
      name: "任务分配提醒",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["leader-1", "executor-1"],
      status: TaskStatus.pending,
      approvalStatus: "0",
    });

    await (service as any).queueAssignmentReminders({
      id: "task-12",
      leaderId: "leader-1",
      executorIds: ["leader-1", "executor-1"],
    });

    expect(messagesService.sendMessage).toHaveBeenCalledTimes(2);
    expect(messagesService.sendMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        receiverId: "leader-1",
        messageType: MessageType.todo,
        sourceType: "task",
        sourceId: "task-12",
        linkUrl: "/taskManage/form?id=task-12&action=view",
        extraData: expect.objectContaining({
          businessType: "task",
          taskId: "task-12",
          projectId: "project-1",
          reminderType: "taskAssigned",
          status: TaskStatus.pending,
          approvalStatus: "0",
          channels: ["messageCenter"],
        }),
      }),
    );
    expect(messagesService.sendMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        receiverId: "executor-1",
        messageType: MessageType.todo,
      }),
    );
  });

  it("开始任务后向消息中心发送已开始通知", async () => {
    const { service, repository, messagesService } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-13",
      name: "开始中的任务",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.inProgress,
      approvalStatus: "0",
    });

    await (service as any).queueStartedReminders({
      id: "task-13",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
    });

    expect(messagesService.sendMessage).toHaveBeenCalledTimes(2);
    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: MessageType.cc,
        linkUrl: "/taskManage/form?id=task-13&action=view",
        extraData: expect.objectContaining({
          reminderType: "taskStarted",
          status: TaskStatus.inProgress,
        }),
      }),
    );
  });

  it("即将到期任务每天最多发送一次 cc 提醒", async () => {
    const { service, repository, messagesService } = createService();
    repository.find.mockResolvedValue([
      {
        id: "task-due-1",
        name: "即将到期任务",
        projectId: "project-1",
        leaderId: "leader-1",
        executorIds: ["executor-1"],
        endDate: "2099-05-03",
        status: TaskStatus.inProgress,
        approvalStatus: "0",
      },
    ]);
    jest
      .spyOn(service as never, "getTodayDate" as never)
      .mockReturnValue("2099-05-01");
    jest
      .spyOn(service as never, "hasRecentReminder" as never)
      .mockResolvedValue(false);

    await (service as never).scanDueSoonTaskReminders();

    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: MessageType.cc,
        sourceType: "task_reminder",
        sourceId: "task-due-1",
        extraData: expect.objectContaining({ reminderType: "taskDueSoon" }),
      }),
    );
  });

  it("即将到期任务在 24 小时内已提醒时不重复发送 cc 提醒", async () => {
    const { service, repository, messagesService } = createService();
    repository.find.mockResolvedValue([
      {
        id: "task-due-2",
        name: "已提醒任务",
        projectId: "project-1",
        leaderId: "leader-1",
        executorIds: ["executor-1"],
        endDate: "2099-05-03",
        status: TaskStatus.inProgress,
        approvalStatus: "0",
      },
    ]);
    jest
      .spyOn(service as never, "getTodayDate" as never)
      .mockReturnValue("2099-05-01");
    jest
      .spyOn(service as never, "hasRecentReminder" as never)
      .mockResolvedValue(true);

    await (service as never).scanDueSoonTaskReminders();

    expect(messagesService.sendMessage).not.toHaveBeenCalled();
  });

  it("已逾期任务每天最多发送一次 todo 提醒", async () => {
    const { service, repository, messagesService } = createService();
    repository.find.mockResolvedValue([
      {
        id: "task-overdue-1",
        name: "逾期任务",
        projectId: "project-1",
        leaderId: "leader-1",
        executorIds: ["executor-1"],
        endDate: "2099-05-01",
        status: TaskStatus.inProgress,
        approvalStatus: "0",
      },
    ]);
    jest
      .spyOn(service as never, "getTodayDate" as never)
      .mockReturnValue("2099-05-03");
    jest
      .spyOn(service as never, "hasRecentReminder" as never)
      .mockResolvedValue(false);

    await (service as never).scanOverdueTaskReminders();

    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: MessageType.todo,
        extraData: expect.objectContaining({ reminderType: "taskOverdue" }),
      }),
    );
  });

  it("已逾期任务在 24 小时内已提醒时不重复发送 todo 提醒", async () => {
    const { service, repository, messagesService } = createService();
    repository.find.mockResolvedValue([
      {
        id: "task-overdue-2",
        name: "已提醒逾期任务",
        projectId: "project-1",
        leaderId: "leader-1",
        executorIds: ["executor-1"],
        endDate: "2099-05-01",
        status: TaskStatus.inProgress,
        approvalStatus: "0",
      },
    ]);
    jest
      .spyOn(service as never, "getTodayDate" as never)
      .mockReturnValue("2099-05-03");
    jest
      .spyOn(service as never, "hasRecentReminder" as never)
      .mockResolvedValue(true);

    await (service as never).scanOverdueTaskReminders();

    expect(messagesService.sendMessage).not.toHaveBeenCalled();
  });

  it("未汇报任务每两天最多发送一次 todo 提醒", async () => {
    const { service, repository, timeLogRepository, messagesService } =
      createService();
    repository.find.mockResolvedValue([
      {
        id: "task-report-1",
        name: "未汇报任务",
        projectId: "project-1",
        leaderId: "leader-1",
        executorIds: ["executor-1"],
        status: TaskStatus.inProgress,
        approvalStatus: "0",
      },
    ]);
    timeLogRepository.query.mockResolvedValue([]);
    jest
      .spyOn(service as never, "hasRecentReminder" as never)
      .mockResolvedValue(false);

    await (service as never).scanStaleReportTaskReminders();

    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: MessageType.todo,
        sourceType: "task_reminder",
        sourceId: "task-report-1",
        extraData: expect.objectContaining({
          reminderType: "taskReportStale",
        }),
      }),
    );
  });

  it("未汇报任务在 48 小时内已提醒时不重复发送 todo 提醒", async () => {
    const { service, repository, timeLogRepository, messagesService } =
      createService();
    repository.find.mockResolvedValue([
      {
        id: "task-report-2",
        name: "已提醒未汇报任务",
        projectId: "project-1",
        leaderId: "leader-1",
        executorIds: ["executor-1"],
        status: TaskStatus.inProgress,
        approvalStatus: "0",
      },
    ]);
    timeLogRepository.query.mockResolvedValue([]);
    jest
      .spyOn(service as never, "hasRecentReminder" as never)
      .mockResolvedValue(true);

    await (service as never).scanStaleReportTaskReminders();

    expect(messagesService.sendMessage).not.toHaveBeenCalled();
  });

  it("最近 2 天内已有汇报时不发送 stale reminder", async () => {
    const { service, repository, timeLogRepository, messagesService } =
      createService();
    repository.find.mockResolvedValue([
      {
        id: "task-report-3",
        name: "最近已汇报任务",
        projectId: "project-1",
        leaderId: "leader-1",
        executorIds: ["executor-1"],
        status: TaskStatus.inProgress,
        approvalStatus: "0",
      },
    ]);
    timeLogRepository.query.mockResolvedValue([
      {
        taskId: "task-report-3",
        latestReportTime: new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ]);

    await (service as never).scanStaleReportTaskReminders();

    expect(messagesService.sendMessage).not.toHaveBeenCalled();
  });

  it("每日扫描入口顺序执行三类定时提醒", async () => {
    const { service } = createService();
    const callOrder: string[] = [];
    const dueSoon = jest
      .spyOn(service as never, "scanDueSoonTaskReminders" as never)
      .mockImplementation(async () => {
        callOrder.push("dueSoon");
      });
    const overdue = jest
      .spyOn(service as never, "scanOverdueTaskReminders" as never)
      .mockImplementation(async () => {
        callOrder.push("overdue");
      });
    const stale = jest
      .spyOn(service as never, "scanStaleReportTaskReminders" as never)
      .mockImplementation(async () => {
        callOrder.push("stale");
      });

    await (service as never).runScheduledTaskReminders();

    expect(dueSoon).toHaveBeenCalledTimes(1);
    expect(overdue).toHaveBeenCalledTimes(1);
    expect(stale).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["dueSoon", "overdue", "stale"]);
  });

  it("审批通过后发送业务通知", async () => {
    const { service, repository } = createService();
    const queueCompletionApprovedReminders = jest
      .spyOn(service as any, "queueCompletionApprovedReminders")
      .mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({
      id: "task-14",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.pendingCompletionApproval,
      approvalStatus: "1",
      actualEndDate: null,
    });

    await (service as any).handleCompletionApprovalApproved("task-14");

    expect(queueCompletionApprovedReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-14",
        approvalStatus: "1",
      }),
    );
  });

  it("重复通过回调不重复发送通过消息", async () => {
    const { service, repository } = createService();
    const queueCompletionApprovedReminders = jest
      .spyOn(service as any, "queueCompletionApprovedReminders")
      .mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({
      id: "task-14-repeat",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.completed,
      approvalStatus: "2",
      actualEndDate: "2026-05-01",
    });

    await (service as any).handleCompletionApprovalApproved("task-14-repeat");

    expect(repository.update).not.toHaveBeenCalled();
    expect(queueCompletionApprovedReminders).not.toHaveBeenCalled();
  });

  it("queueCompletionApprovedReminders 向消息中心发送通过通知", async () => {
    const { service, repository, messagesService } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-15",
      name: "审批通过任务",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.completed,
      approvalStatus: "2",
    });

    await (service as any).queueCompletionApprovedReminders({
      id: "task-15",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
    });

    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: MessageType.cc,
        extraData: expect.objectContaining({
          reminderType: "taskCompletionApproved",
          approvalStatus: "2",
          status: TaskStatus.completed,
        }),
      }),
    );
  });

  it("queueCompletionRejectedReminders 向消息中心发送驳回通知", async () => {
    const { service, repository, messagesService } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-16",
      name: "审批驳回任务",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.inProgress,
      approvalStatus: "3",
    });

    await (service as any).queueCompletionRejectedReminders({
      id: "task-16",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
    });

    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: MessageType.todo,
        extraData: expect.objectContaining({
          reminderType: "taskCompletionRejected",
          approvalStatus: "3",
          status: TaskStatus.inProgress,
        }),
      }),
    );
  });

  it("重复驳回回调不重复发送驳回消息", async () => {
    const { service, repository } = createService();
    const queueCompletionRejectedReminders = jest
      .spyOn(service as any, "queueCompletionRejectedReminders")
      .mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({
      id: "task-16-repeat",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.inProgress,
      approvalStatus: "3",
    });

    await (service as any).handleCompletionApprovalRejected("task-16-repeat");

    expect(repository.update).not.toHaveBeenCalled();
    expect(queueCompletionRejectedReminders).not.toHaveBeenCalled();
  });

  it("queueDelayReminders 向消息中心发送延期通知", async () => {
    const { service, repository, messagesService } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-17",
      name: "延期任务",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.inProgress,
      approvalStatus: "0",
    });

    await (service as any).queueDelayReminders({
      id: "task-17",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
    });

    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: MessageType.cc,
        extraData: expect.objectContaining({
          reminderType: "taskDelayed",
          status: TaskStatus.inProgress,
          approvalStatus: "0",
        }),
      }),
    );
  });

  it("创建任务成功后触发提醒骨架", async () => {
    const { service, repository, projectsService } = createService();
    const queueAssignmentReminders = jest
      .spyOn(service as any, "queueAssignmentReminders")
      .mockResolvedValue(undefined);
    projectsService.assertProjectNotArchived.mockResolvedValue(undefined);
    repository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });

    await service.add({
      name: "新任务",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1", "leader-1"],
    } as any);

    expect(queueAssignmentReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-new",
        leaderId: "leader-1",
        executorIds: ["executor-1", "leader-1"],
      }),
    );
  });

  it("save 新增任务时触发提醒骨架", async () => {
    const { service, repository, projectsService } = createService();
    const queueAssignmentReminders = jest
      .spyOn(service as any, "queueAssignmentReminders")
      .mockResolvedValue(undefined);
    projectsService.assertProjectNotArchived.mockResolvedValue(undefined);
    repository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });

    await service.save({
      name: "新任务-save",
      projectId: "project-1",
      leaderId: "leader-2",
      executorIds: ["executor-2"],
    } as any);

    expect(queueAssignmentReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-new",
        leaderId: "leader-2",
        executorIds: ["executor-2"],
      }),
    );
  });

  it("save 更新已有任务时不触发创建提醒", async () => {
    const { service, repository, projectsService } = createService();
    const queueAssignmentReminders = jest
      .spyOn(service as any, "queueAssignmentReminders")
      .mockResolvedValue(undefined);
    projectsService.assertProjectNotArchived.mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({
      id: "task-existing",
      projectId: "project-1",
    });

    await service.save({
      id: "task-existing",
      name: "已存在任务",
      projectId: "project-1",
      leaderId: "leader-3",
      executorIds: ["executor-3"],
    } as any);

    expect(queueAssignmentReminders).not.toHaveBeenCalled();
  });

  it("非允许状态拒绝延期", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-6",
      projectId: "project-1",
      leaderId: "user-1",
      status: TaskStatus.completed,
      endDate: "2026-05-10",
    });

    await expect(
      (service as any).delayTask(
        "task-6",
        { afterEndDate: "2026-05-15", reason: "延期" },
        { id: "user-1", name: "测试用户" },
      ),
    ).rejects.toThrow("当前任务状态不允许延期");
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("缺少当前截止时间拒绝延期", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-7",
      projectId: "project-1",
      leaderId: "user-1",
      status: TaskStatus.inProgress,
      endDate: null,
    });

    await expect(
      (service as any).delayTask(
        "task-7",
        { afterEndDate: "2026-05-15", reason: "延期" },
        { id: "user-1", name: "测试用户" },
      ),
    ).rejects.toThrow("当前任务缺少截止日期，无法延期");
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("延期后截止日期为空时拒绝延期", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-8",
      projectId: "project-1",
      leaderId: "user-1",
      status: TaskStatus.inProgress,
      endDate: "2026-05-10",
    });

    await expect(
      (service as any).delayTask(
        "task-8",
        { afterEndDate: "", reason: "延期" },
        { id: "user-1", name: "测试用户" },
      ),
    ).rejects.toThrow("延期后截止日期不能为空");
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("延期后截止日期不晚于当前截止日期时拒绝延期", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-9",
      projectId: "project-1",
      leaderId: "user-1",
      status: TaskStatus.inProgress,
      endDate: "2026-05-10",
    });

    await expect(
      (service as any).delayTask(
        "task-9",
        { afterEndDate: "2026-05-10", reason: "延期" },
        { id: "user-1", name: "测试用户" },
      ),
    ).rejects.toThrow("延期后截止日期必须晚于当前截止日期");
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("getDelayRecords 按任务ID倒序查询并原样返回结果", async () => {
    const { service, repository, delayRecordRepository } = createService();
    const records = [
      { id: "delay-2", taskId: "task-10" },
      { id: "delay-1", taskId: "task-10" },
    ];
    repository.findOne.mockResolvedValue({
      id: "task-10",
      projectId: "project-1",
    });
    delayRecordRepository.find.mockResolvedValue(records);

    const result = await (service as any).getDelayRecords("task-10");

    expect(delayRecordRepository.find).toHaveBeenCalledWith({
      where: { taskId: "task-10" },
      order: { createTime: "DESC" },
    });
    expect(result).toBe(records);
  });

  it("getOne 返回结果包含任务权限字段", async () => {
    const { service, repository, projectsService } = createService();
    repository.findOne.mockResolvedValue({
      id: "task-4",
      code: "TSK-001",
      projectId: "project-1",
      leaderId: "leader-1",
      createUser: "creator-1",
      executorIds: ["executor-1"],
      status: TaskStatus.inProgress,
      project: null,
      milestone: null,
      leader: null,
      parent: null,
    });
    projectsService.assertExecutionObjectPermission.mockResolvedValue({});
    projectsService.getProjectPermissionContext.mockResolvedValue({
      isManager: false,
      isDeliveryManager: false,
      isFunctionalLead: false,
    });

    const result = await service.getOne({
      id: "task-4",
      _operatorId: "executor-1",
    } as any);

    expect(result).toEqual(
      expect.objectContaining({
        canEdit: false,
        canManage: false,
        canExecute: true,
      }),
    );
  });
});
