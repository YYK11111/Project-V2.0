import { BusinessApprovalContextService } from "./service";

describe("BusinessApprovalContextService", () => {
  const createService = () => {
    const contextRepository = {
      update: jest.fn(),
      create: jest.fn((payload) => payload),
      save: jest.fn(async (payload) => ({ id: "ctx-1", ...payload })),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    const participantRepository = {
      create: jest.fn((payload) => payload),
      save: jest.fn(async (payload) => ({ id: "participant-1", ...payload })),
    };
    const workflowInstanceRepository = {
      find: jest.fn(),
    };
    const changeRepository = {
      find: jest.fn(),
    };
    const service = new BusinessApprovalContextService(
      contextRepository as any,
      participantRepository as any,
      workflowInstanceRepository as any,
      changeRepository as any,
    );
    return {
      service,
      contextRepository,
      participantRepository,
      workflowInstanceRepository,
      changeRepository,
    };
  };

  it("创建审批上下文时将同业务同场景旧记录置为非当前", async () => {
    const { service, contextRepository, participantRepository } =
      createService();

    const result = await service.createFromWorkflowStart({
      businessType: "project",
      businessId: "19",
      businessScene: "initiation",
      sceneTitle: "立项审批",
      workflowInstance: {
        id: "wf-1",
        definitionId: "def-1",
        definitionCode: "project-init",
        status: "1",
        currentNodeId: "node-1",
        startTime: "2026-05-15 10:00:00",
      },
      starterId: "u1",
      starterName: "张三",
      rootBusinessType: "project",
      rootBusinessId: "19",
      projectId: "19",
    });

    expect(contextRepository.update).toHaveBeenCalledWith(
      {
        businessType: "project",
        businessId: "19",
        businessScene: "initiation",
        isCurrent: "1",
      },
      { isCurrent: "0" },
    );
    expect(contextRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "project",
        businessId: "19",
        businessScene: "initiation",
        sceneTitle: "立项审批",
        workflowInstanceId: "wf-1",
        workflowDefinitionId: "def-1",
        workflowDefinitionCode: "project-init",
        status: "1",
        currentNodeId: "node-1",
        starterId: "u1",
        starterName: "张三",
        rootBusinessType: "project",
        rootBusinessId: "19",
        projectId: "19",
        isCurrent: "1",
        isActive: "1",
      }),
    );
    expect(participantRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalContextId: "ctx-1",
        workflowInstanceId: "wf-1",
        userId: "u1",
        roleType: "starter",
        businessType: "project",
        businessId: "19",
        rootBusinessType: "project",
        rootBusinessId: "19",
      }),
    );
    expect(result.workflowInstanceId).toBe("wf-1");
  });

  it("按聚合根业务对象查询审批上下文并按发起时间倒序返回", async () => {
    const { service, contextRepository } = createService();
    contextRepository.find.mockResolvedValue([
      {
        id: "ctx-2",
        businessScene: "closure",
        workflowInstanceId: "wf-2",
      },
    ]);

    const result = await service.findByRootBusiness("project", "19");

    expect(contextRepository.find).toHaveBeenCalledWith({
      where: {
        rootBusinessType: "project",
        rootBusinessId: "19",
        isActive: "1",
      },
      order: { startedAt: "DESC", createTime: "DESC" },
    });
    expect(result).toEqual([
      {
        id: "ctx-2",
        businessScene: "closure",
        workflowInstanceId: "wf-2",
      },
    ]);
  });

  it("同步流程结束状态时更新上下文状态和结束时间", async () => {
    const { service, contextRepository } = createService();

    await service.syncWorkflowStatus("wf-1", {
      status: "2",
      endedAt: "2026-05-15 11:00:00",
      currentNodeId: "end",
      currentNodeName: "结束",
    });

    expect(contextRepository.update).toHaveBeenCalledWith(
      { workflowInstanceId: "wf-1" },
      {
        status: "2",
        endedAt: "2026-05-15 11:00:00",
        currentNodeId: "end",
        currentNodeName: "结束",
      },
    );
  });

  it("项目审批上下文查询会自动回填历史立项结项和变更流程实例", async () => {
    const {
      service,
      contextRepository,
      workflowInstanceRepository,
      changeRepository,
    } = createService();
    contextRepository.find
      .mockResolvedValueOnce([
        {
          id: "ctx-existing",
          workflowInstanceId: "wf-project",
        },
      ])
      .mockResolvedValueOnce([
        { id: "ctx-existing", workflowInstanceId: "wf-project" },
        { id: "ctx-close", workflowInstanceId: "wf-close" },
        { id: "ctx-change", workflowInstanceId: "wf-change" },
      ]);
    changeRepository.find.mockResolvedValue([{ id: "change-1" }]);
    workflowInstanceRepository.find.mockResolvedValue([
      {
        id: "wf-project",
        businessKey: "project_19",
        definitionId: "def-1",
        definitionCode: "project-init",
        status: "2",
        currentNodeId: "end",
        starterId: "u1",
        startTime: "2026-05-15 10:00:00",
      },
      {
        id: "wf-close",
        businessKey: "project_close_19",
        definitionId: "def-2",
        definitionCode: "project-close",
        status: "1",
        currentNodeId: "node-close",
        starterId: "u2",
        startTime: "2026-05-15 11:00:00",
      },
      {
        id: "wf-change",
        businessKey: "change_change-1",
        definitionId: "def-3",
        definitionCode: "change-approval",
        status: "1",
        currentNodeId: "node-change",
        starterId: "u3",
        startTime: "2026-05-15 12:00:00",
      },
    ]);

    const result = await service.findProjectApprovalContexts("19");

    expect(changeRepository.find).toHaveBeenCalledWith({
      where: { projectId: "19" },
      select: ["id"],
    });
    expect(workflowInstanceRepository.find).toHaveBeenCalled();
    expect(contextRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "project",
        businessId: "19",
        businessScene: "closure",
        sceneTitle: "结项审批",
        workflowInstanceId: "wf-close",
        rootBusinessType: "project",
        rootBusinessId: "19",
        projectId: "19",
      }),
    );
    expect(contextRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "change",
        businessId: "change-1",
        businessScene: "approval",
        sceneTitle: "变更审批",
        workflowInstanceId: "wf-change",
        rootBusinessType: "project",
        rootBusinessId: "19",
        projectId: "19",
      }),
    );
    expect(result).toEqual([
      { id: "ctx-existing", workflowInstanceId: "wf-project" },
      { id: "ctx-close", workflowInstanceId: "wf-close" },
      { id: "ctx-change", workflowInstanceId: "wf-change" },
    ]);
  });
});
