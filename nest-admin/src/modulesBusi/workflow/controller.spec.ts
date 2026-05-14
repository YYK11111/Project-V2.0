import { WorkflowController } from "./controller";

describe("WorkflowController", () => {
  const workflowService = {
    getInstance: jest.fn(),
    getInstanceHistory: jest.fn(),
    getInstanceTasks: jest.fn(),
    startWorkflow: jest.fn(),
    listInstances: jest.fn(),
    getPendingTasks: jest.fn(),
    completeTask: jest.fn(),
    transferTask: jest.fn(),
    addSignTask: jest.fn(),
    withdrawWorkflow: jest.fn(),
    cancelInstance: jest.fn(),
    closeReturnedInstance: jest.fn(),
    resubmitReturnedInstance: jest.fn(),
    updateDefinition: jest.fn(),
  };

  const businessFieldService = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("启动流程时只使用服务端认证用户 ID", async () => {
    const controller = new WorkflowController(
      workflowService as any,
      businessFieldService,
    );
    workflowService.startWorkflow.mockResolvedValue({ success: true });

    await controller.startWorkflow({ definitionId: "def_1" } as any, {
      user: { id: "server-user-id" },
      query: { userId: "forged-user-id" },
    });

    expect(workflowService.startWorkflow).toHaveBeenCalledWith(
      { definitionId: "def_1" },
      "server-user-id",
    );
  });

  it("获取我的待办时只使用服务端认证用户 ID", async () => {
    const controller = new WorkflowController(
      workflowService as any,
      businessFieldService,
    );
    workflowService.getPendingTasks.mockResolvedValue([]);

    await controller.getMyTasks({
      user: { sub: "server-user-sub" },
      query: { userId: "forged-user-id" },
    });

    expect(workflowService.getPendingTasks).toHaveBeenCalledWith(
      "server-user-sub",
    );
  });

  it("缺少认证用户时拒绝执行敏感操作", async () => {
    const controller = new WorkflowController(
      workflowService as any,
      businessFieldService,
    );

    await expect(
      controller.completeTask("task_1", { action: "approve" } as any, {
        user: null,
      }),
    ).rejects.toThrow("当前用户不存在");
    expect(workflowService.completeTask).not.toHaveBeenCalled();
  });

  it("获取实例详情、历史和任务时透传服务端认证用户 ID 与权限", async () => {
    const controller = new WorkflowController(
      workflowService as any,
      businessFieldService,
    );
    workflowService.getInstance.mockResolvedValue({});
    workflowService.getInstanceHistory.mockResolvedValue([]);
    workflowService.getInstanceTasks.mockResolvedValue([]);
    const req = {
      user: { id: "server-user-id" },
      permissions: ["business/workflow/instances/getOne"],
    };

    await controller.getInstance("wf-1", req as any);
    await controller.getInstanceHistory("wf-1", req as any);
    await controller.getInstanceTasks("wf-1", req as any);

    expect(workflowService.getInstance).toHaveBeenCalledWith(
      "wf-1",
      "server-user-id",
      ["business/workflow/instances/getOne"],
    );
    expect(workflowService.getInstanceHistory).toHaveBeenCalledWith(
      "wf-1",
      "server-user-id",
      ["business/workflow/instances/getOne"],
    );
    expect(workflowService.getInstanceTasks).toHaveBeenCalledWith(
      "wf-1",
      "server-user-id",
      ["business/workflow/instances/getOne"],
    );
  });

  it("按 ID 更新流程定义时只使用服务端认证用户作为更新人", async () => {
    const controller = new WorkflowController(
      workflowService as any,
      businessFieldService,
    );
    workflowService.updateDefinition.mockResolvedValue({ id: "wf-1" });

    await controller.updateDefinition(
      "wf-1",
      { businessScene: "approval" } as any,
      {
        user: { name: "server-user-name" },
      } as any,
    );

    expect(workflowService.updateDefinition).toHaveBeenCalledWith(
      "wf-1",
      expect.objectContaining({
        businessScene: "approval",
        updateUser: "server-user-name",
      }),
    );
  });
});
