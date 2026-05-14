import { WorkflowService } from "./service";
import {
  NodeType,
  ConditionOperator,
  TaskAction,
} from "./interface/node-type.enum";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { WorkflowDataLoaderService } from "./workflow-data-loader.service";

describe("WorkflowService 条件路由", () => {
  const createService = () => {
    return new WorkflowService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  };

  const createAccessService = () => {
    const definitionRepo = {
      findOne: jest.fn(),
    };
    const instanceRepo = {
      findOne: jest.fn(),
    };
    const taskRepo = {
      findOne: jest.fn(),
    };
    const historyRepo = {
      findOne: jest.fn(),
    };
    const service = new WorkflowService(
      definitionRepo as any,
      instanceRepo as any,
      taskRepo as any,
      historyRepo as any,
      {} as any,
      {} as any,
      {} as any,
      { getOne: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    jest
      .spyOn(service as any, "attachBusinessSummaryToInstance")
      .mockResolvedValue({ id: "wf-1" });
    return { service, definitionRepo, instanceRepo, taskRepo, historyRepo };
  };

  it("按 conditionId + 连线命中目标节点", async () => {
    const service = createService();
    const definition = {
      flows: [
        {
          id: "flow_cond_1",
          sourceNodeId: "cond_1",
          targetNodeId: "node_a",
          flowType: "condition",
          conditionId: "c1",
        },
        {
          id: "flow_default",
          sourceNodeId: "cond_1",
          targetNodeId: "node_default",
          flowType: "default",
        },
      ],
    } as any;
    const currentNode = {
      id: "cond_1",
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: "c1",
            field: "amount",
            operator: ConditionOperator.GT,
            value: 5,
          },
        ],
      },
    } as any;
    const instance = {
      variables: { amount: 10 },
    } as any;

    const result = await (service as any).findNextNodes(
      definition,
      currentNode,
      instance,
      [],
    );
    expect(result).toEqual(["node_a"]);
  });

  it("条件不命中时走默认分支连线", async () => {
    const service = createService();
    const definition = {
      flows: [
        {
          id: "flow_cond_1",
          sourceNodeId: "cond_1",
          targetNodeId: "node_a",
          flowType: "condition",
          conditionId: "c1",
        },
        {
          id: "flow_default",
          sourceNodeId: "cond_1",
          targetNodeId: "node_default",
          flowType: "default",
        },
      ],
    } as any;
    const currentNode = {
      id: "cond_1",
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: "c1",
            field: "amount",
            operator: ConditionOperator.GT,
            value: 100,
          },
        ],
      },
    } as any;
    const instance = {
      variables: { amount: 10 },
    } as any;

    const result = await (service as any).findNextNodes(
      definition,
      currentNode,
      instance,
      [],
    );
    expect(result).toEqual(["node_default"]);
  });

  it("人员属于部门命中条件分支", async () => {
    const service = createService();
    const definition = {
      flows: [
        {
          id: "flow_cond_1",
          sourceNodeId: "cond_1",
          targetNodeId: "node_member",
          flowType: "condition",
          conditionId: "c1",
        },
      ],
    } as any;
    const currentNode = {
      id: "cond_1",
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: "c1",
            field: "approverId",
            operator: ConditionOperator.MEMBER_OF,
            value: "dept_2",
          },
        ],
      },
    } as any;
    const instance = {
      variables: {
        approverId: "user_1",
        _businessData: {
          data: {
            approver: { id: "user_1", deptId: "dept_2" },
          },
        },
      },
    } as any;

    const result = await (service as any).findNextNodes(
      definition,
      currentNode,
      instance,
      [],
    );
    expect(result).toEqual(["node_member"]);
  });

  it("人员属于部门或子部门命中条件分支", async () => {
    const service = createService();
    const definition = {
      flows: [
        {
          id: "flow_cond_1",
          sourceNodeId: "cond_1",
          targetNodeId: "node_member",
          flowType: "condition",
          conditionId: "c1",
        },
      ],
    } as any;
    const currentNode = {
      id: "cond_1",
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: "c1",
            field: "approverId",
            operator: ConditionOperator.MEMBER_OF_OR_SUB,
            value: "dept_1",
          },
        ],
      },
    } as any;
    const instance = {
      variables: {
        approverId: "user_1",
        _businessData: {
          data: {
            approver: { id: "user_1", deptId: "dept_2" },
            deptTree: [
              { id: "dept_1", children: [{ id: "dept_2", children: [] }] },
            ],
          },
        },
      },
    } as any;

    const result = await (service as any).findNextNodes(
      definition,
      currentNode,
      instance,
      [],
    );
    expect(result).toEqual(["node_member"]);
  });

  it("数组包含人员命中条件分支", async () => {
    const service = createService();
    const definition = {
      flows: [
        {
          id: "flow_cond_1",
          sourceNodeId: "cond_1",
          targetNodeId: "node_contains",
          flowType: "condition",
          conditionId: "c1",
        },
      ],
    } as any;
    const currentNode = {
      id: "cond_1",
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: "c1",
            field: "memberIds",
            operator: ConditionOperator.CONTAINS_USER,
            value: "user_2",
          },
        ],
      },
    } as any;
    const instance = {
      variables: {
        memberIds: ["user_1", "user_2"],
      },
    } as any;

    const result = await (service as any).findNextNodes(
      definition,
      currentNode,
      instance,
      [],
    );
    expect(result).toEqual(["node_contains"]);
  });

  it("数组包含部门命中条件分支", async () => {
    const service = createService();
    const definition = {
      flows: [
        {
          id: "flow_cond_1",
          sourceNodeId: "cond_1",
          targetNodeId: "node_contains",
          flowType: "condition",
          conditionId: "c1",
        },
      ],
    } as any;
    const currentNode = {
      id: "cond_1",
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: "c1",
            field: "deptIds",
            operator: ConditionOperator.CONTAINS_DEPT,
            value: "dept_2",
          },
        ],
      },
    } as any;
    const instance = {
      variables: {
        deptIds: ["dept_1", "dept_2"],
      },
    } as any;

    const result = await (service as any).findNextNodes(
      definition,
      currentNode,
      instance,
      [],
    );
    expect(result).toEqual(["node_contains"]);
  });

  it("未命中任何条件且无默认分支时抛错", async () => {
    const service = createService();
    const definition = {
      flows: [
        {
          id: "flow_cond_1",
          sourceNodeId: "cond_1",
          targetNodeId: "node_a",
          flowType: "condition",
          conditionId: "c1",
        },
      ],
    } as any;
    const currentNode = {
      id: "cond_1",
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: "c1",
            field: "amount",
            operator: ConditionOperator.GT,
            value: 100,
          },
        ],
      },
    } as any;
    const instance = {
      variables: { amount: 10 },
    } as any;

    await expect(
      (service as any).findNextNodes(definition, currentNode, instance, []),
    ).rejects.toThrow("条件节点");
  });

  it("非条件节点存在多条流出连接线时抛错", async () => {
    const service = createService();
    const definition = {
      flows: [
        {
          id: "flow_1",
          sourceNodeId: "approval_1",
          targetNodeId: "node_a",
          flowType: "normal",
        },
        {
          id: "flow_2",
          sourceNodeId: "approval_1",
          targetNodeId: "node_b",
          flowType: "normal",
        },
      ],
    } as any;
    const currentNode = {
      id: "approval_1",
      name: "审批节点",
      type: NodeType.APPROVAL,
      properties: {},
    } as any;
    const instance = {
      variables: {},
    } as any;

    await expect(
      (service as any).findNextNodes(definition, currentNode, instance, []),
    ).rejects.toThrow("多条流出连接线");
  });

  it("实例详情仅允许发起人、参与人或工作流管理员查看", async () => {
    const { service, instanceRepo, taskRepo, historyRepo } =
      createAccessService();
    instanceRepo.findOne.mockResolvedValue({
      id: "wf-1",
      starterId: "starter-1",
    });
    taskRepo.findOne.mockResolvedValue(null);
    historyRepo.findOne.mockResolvedValue(null);

    await expect(service.getInstance("wf-1", "visitor-1", [])).rejects.toThrow(
      ForbiddenException,
    );

    await expect(
      service.getInstance("wf-1", "visitor-1", [
        "business/workflow/instances/manageAll",
      ]),
    ).resolves.toEqual({ id: "wf-1" });
  });

  it("实例作用域流程定义详情先校验实例可见性", async () => {
    const { service, definitionRepo, instanceRepo, taskRepo, historyRepo } =
      createAccessService();
    instanceRepo.findOne.mockResolvedValue({
      id: "wf-1",
      definitionId: "def-1",
      starterId: "starter-1",
    });
    taskRepo.findOne.mockResolvedValue({ id: "task-1" });
    historyRepo.findOne.mockResolvedValue(null);
    definitionRepo.findOne.mockResolvedValue({
      id: "def-1",
      nodes: [{ id: "start", name: "开始", type: NodeType.START }],
    });

    await expect(
      service.getInstanceDefinition("wf-1", "participant-1", []),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "def-1",
        nodes: [expect.objectContaining({ id: "start" })],
      }),
    );

    expect(definitionRepo.findOne).toHaveBeenCalledWith({
      where: { id: "def-1" },
    });
  });
});

describe("WorkflowService listInstances", () => {
  const createService = () => {
    const instanceQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const service = new WorkflowService(
      {} as any,
      {
        createQueryBuilder: jest.fn(() => instanceQb),
        query: jest.fn(),
      } as any,
      { createQueryBuilder: jest.fn() } as any,
      { createQueryBuilder: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      { getOne: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    jest
      .spyOn(service as any, "attachBusinessSummaryToInstance")
      .mockImplementation(async (instance) => instance);

    return { service, instanceQb };
  };

  it("participant 模式查询自己发起、参与和审批过的实例", async () => {
    const { service, instanceQb } = createService();
    instanceQb.getMany.mockResolvedValue([{ id: "ins_3" }, { id: "ins_1" }]);
    const taskQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ instanceId: "ins_2" }, { instanceId: "ins_1" }]),
    };
    const historyQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ instanceId: "ins_4" }, { instanceId: "ins_2" }]),
    };
    const finalInstanceQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { id: "ins_4", startTime: "2026-04-16 12:00:00" },
        { id: "ins_3", startTime: "2026-04-16 11:00:00" },
        { id: "ins_2", startTime: "2026-04-16 10:00:00" },
        { id: "ins_1", startTime: "2026-04-16 09:00:00" },
      ]),
    };
    (service as any).taskRepo.createQueryBuilder = jest.fn(() => taskQb);
    (service as any).historyRepo.createQueryBuilder = jest.fn(() => historyQb);
    (service as any).instanceRepo.createQueryBuilder = jest
      .fn()
      .mockReturnValueOnce(instanceQb)
      .mockReturnValueOnce(finalInstanceQb);

    const result = await service.listInstances("user_1", "1", "participant");

    expect(instanceQb.where).toHaveBeenCalledWith(
      "instance.starterId = :userId",
      { userId: "user_1" },
    );
    expect(instanceQb.andWhere).toHaveBeenCalledWith(
      "instance.status = :status",
      { status: "1" },
    );
    expect(taskQb.where).toHaveBeenCalledWith("task.assigneeId = :userId", {
      userId: "user_1",
    });
    expect(taskQb.orderBy).toHaveBeenCalledWith("task.createTime", "DESC");
    expect(historyQb.where).toHaveBeenCalledWith(
      "history.operatorId = :userId",
      { userId: "user_1" },
    );
    expect(historyQb.orderBy).toHaveBeenCalledWith(
      "history.createTime",
      "DESC",
    );
    expect(finalInstanceQb.where).toHaveBeenCalledWith(
      "instance.id IN (:...instanceIds)",
      { instanceIds: ["ins_3", "ins_1", "ins_2", "ins_4"] },
    );
    expect(finalInstanceQb.andWhere).toHaveBeenCalledWith(
      "instance.status = :status",
      { status: "1" },
    );
    expect(result).toEqual([
      { id: "ins_4", startTime: "2026-04-16 12:00:00" },
      { id: "ins_3", startTime: "2026-04-16 11:00:00" },
      { id: "ins_2", startTime: "2026-04-16 10:00:00" },
      { id: "ins_1", startTime: "2026-04-16 09:00:00" },
    ]);
  });

  it("starter 模式按发起人和状态查询实例", async () => {
    const { service, instanceQb } = createService();
    instanceQb.getMany.mockResolvedValue([{ id: "ins_3" }]);

    const result = await service.listInstances("starter_1", "2", "starter");

    expect(instanceQb.andWhere).toHaveBeenCalledWith(
      "instance.starterId = :userId",
      { userId: "starter_1" },
    );
    expect(instanceQb.andWhere).toHaveBeenCalledWith(
      "instance.status = :status",
      { status: "2" },
    );
    expect(result).toEqual([{ id: "ins_3" }]);
  });
});

describe("WorkflowService 会签状态机", () => {
  const createApprovalService = (task: any, pendingTasks: any[] = []) => {
    const nodeHandler = {
      execute: jest.fn().mockResolvedValue({ success: true, nextNodeIds: [] }),
      onEnter: jest.fn(),
      onExit: jest.fn(),
    };
    const nodeHandlerFactory = {
      getHandler: jest.fn(() => nodeHandler),
    };
    const definitionRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: "def-1",
        nodes: [
          {
            id: "approval-1",
            name: "审批",
            type: NodeType.APPROVAL,
            properties: {},
          },
          { id: "end-1", name: "结束", type: NodeType.END, properties: {} },
        ],
        flows: [
          {
            id: "flow-1",
            sourceNodeId: "approval-1",
            targetNodeId: "end-1",
            flowType: "normal",
          },
        ],
      }),
    };
    const instanceRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: "wf-1",
        definitionId: "def-1",
        businessKey: "project_p1",
        starterId: "starter-1",
        variables: {},
        startTime: new Date().toISOString(),
      }),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    const taskRepo = {
      findOne: jest.fn().mockResolvedValue(task),
      find: jest.fn().mockResolvedValue(pendingTasks),
      save: jest.fn((entity) => Promise.resolve(entity)),
      create: jest.fn((entity) => entity),
      update: jest.fn(),
    };
    const historyRepo = {
      create: jest.fn((entity) => entity),
      save: jest.fn(),
    };
    const messagesService = {
      deactivateWorkflowTaskMessages: jest.fn(),
      sendMessage: jest.fn(),
    };
    const workflowIntegrationService = {
      handleWorkflowCallback: jest.fn(),
    };
    const service = new WorkflowService(
      definitionRepo as any,
      instanceRepo as any,
      taskRepo as any,
      historyRepo as any,
      {} as any,
      nodeHandlerFactory as any,
      messagesService as any,
      { getOne: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      workflowIntegrationService as any,
    );

    return {
      service,
      definitionRepo,
      instanceRepo,
      taskRepo,
      historyRepo,
      messagesService,
      workflowIntegrationService,
      nodeHandlerFactory,
    };
  };

  it("全部会审模式下仍有同节点待办时不推进流程", async () => {
    const { service, taskRepo, workflowIntegrationService } =
      createApprovalService(
        {
          id: "task-1",
          instanceId: "wf-1",
          nodeId: "approval-1",
          nodeName: "审批",
          nodeType: NodeType.APPROVAL,
          assigneeId: "u1",
          status: "1",
          inputData: {
            multiInstanceType: "all",
            candidateIds: ["u1", "u2"],
          },
        },
        [{ id: "task-2" }],
      );

    await service.completeTask("task-1", "u1", { action: "approve" });

    expect(taskRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          instanceId: "wf-1",
          nodeId: "approval-1",
          status: "1",
        }),
      }),
    );
    expect(
      workflowIntegrationService.handleWorkflowCallback,
    ).not.toHaveBeenCalled();
  });

  it("完成审批任务时审批历史记录当前审批人为操作人", async () => {
    const { service, historyRepo } = createApprovalService({
      id: "task-1",
      instanceId: "wf-1",
      nodeId: "approval-1",
      nodeName: "审批",
      nodeType: NodeType.APPROVAL,
      assigneeId: "u1",
      status: "1",
      inputData: {
        multiInstanceType: "all",
        candidateIds: ["u1"],
      },
    });

    await service.completeTask("task-1", "u1", { action: "approve" });

    expect(historyRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "task-1",
        nodeId: "approval-1",
        action: TaskAction.APPROVE,
        operatorId: "u1",
      }),
    );
  });

  it("并行任一通过后取消同节点其他待办并推进流程", async () => {
    const { service, taskRepo, messagesService, workflowIntegrationService } =
      createApprovalService(
        {
          id: "task-1",
          instanceId: "wf-1",
          nodeId: "approval-1",
          nodeName: "审批",
          nodeType: NodeType.APPROVAL,
          assigneeId: "u1",
          status: "1",
          inputData: {
            multiInstanceType: "parallel",
            candidateIds: ["u1", "u2"],
          },
        },
        [{ id: "task-2" }],
      );

    await service.completeTask("task-1", "u1", { action: "approve" });

    expect(taskRepo.update).toHaveBeenCalledWith(
      {
        instanceId: "wf-1",
        nodeId: "approval-1",
        status: "1",
      },
      expect.objectContaining({
        status: "4",
      }),
    );
    expect(messagesService.deactivateWorkflowTaskMessages).toHaveBeenCalledWith(
      ["task-2"],
    );
    expect(
      workflowIntegrationService.handleWorkflowCallback,
    ).toHaveBeenCalledWith(
      "wf-1",
      "completed",
      expect.objectContaining({ businessKey: "project_p1" }),
    );
  });

  it("串行会签未到最后一人时创建下一位待办且不推进流程", async () => {
    const { service, taskRepo, workflowIntegrationService } =
      createApprovalService({
        id: "task-1",
        instanceId: "wf-1",
        nodeId: "approval-1",
        nodeName: "审批",
        nodeType: NodeType.APPROVAL,
        assigneeId: "u1",
        status: "1",
        inputData: {
          multiInstanceType: "sequential",
          candidateIds: ["u1", "u2"],
          candidateIndex: 0,
        },
      });

    await service.completeTask("task-1", "u1", { action: "approve" });

    expect(taskRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceId: "wf-1",
        nodeId: "approval-1",
        assigneeId: "u2",
        status: "1",
        inputData: expect.objectContaining({
          multiInstanceType: "sequential",
          candidateIds: ["u1", "u2"],
          candidateIndex: 1,
        }),
      }),
    );
    expect(
      workflowIntegrationService.handleWorkflowCallback,
    ).not.toHaveBeenCalled();
  });

  it("加签任务同意后不推进流程且保留原节点待办", async () => {
    const { service, taskRepo, workflowIntegrationService } =
      createApprovalService(
        {
          id: "task-sign-1",
          instanceId: "wf-1",
          nodeId: "approval-1",
          nodeName: "审批",
          nodeType: NodeType.APPROVAL,
          assigneeId: "u-sign",
          status: "1",
          action: "5",
          inputData: {
            taskKind: "addSign",
            parentTaskId: "task-1",
          },
        },
        [{ id: "task-1" }],
      );

    await service.completeTask("task-sign-1", "u-sign", {
      action: "approve",
    });

    expect(taskRepo.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        instanceId: "wf-1",
        nodeId: "approval-1",
        status: "1",
      }),
      expect.objectContaining({ status: "4" }),
    );
    expect(
      workflowIntegrationService.handleWorkflowCallback,
    ).not.toHaveBeenCalled();
  });
});

describe("WorkflowService 节点上下文与发布校验", () => {
  const createGraphService = (definition: any, handler?: any) => {
    const definitionRepo = {
      findOne: jest.fn().mockResolvedValue(definition),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    const historyRepo = {
      create: jest.fn((entity) => entity),
      save: jest.fn(),
    };
    const nodeHandler = handler || {
      execute: jest.fn().mockResolvedValue({ success: false }),
      onEnter: jest.fn(),
      onExit: jest.fn(),
    };
    const nodeHandlerFactory = {
      getHandler: jest.fn(() => nodeHandler),
    };
    const service = new WorkflowService(
      definitionRepo as any,
      { save: jest.fn() } as any,
      {} as any,
      historyRepo as any,
      {} as any,
      nodeHandlerFactory as any,
      {} as any,
      { getOne: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    return { service, definitionRepo, historyRepo, nodeHandler };
  };

  it("执行节点时把当前节点属性注入上下文变量", async () => {
    const nodeHandler = {
      execute: jest.fn().mockResolvedValue({ success: false }),
      onEnter: jest.fn(),
      onExit: jest.fn(),
    };
    const definition = {
      nodes: [
        {
          id: "notice-1",
          name: "通知",
          type: NodeType.NOTIFICATION,
          properties: { notificationTemplate: "项目通知" },
        },
      ],
      flows: [],
    } as any;
    const { service } = createGraphService(definition, nodeHandler);

    await (service as any).executeNode(
      { id: "wf-1", variables: { amount: 10 } },
      definition,
      0,
    );

    expect(nodeHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          amount: 10,
          _nodeProperties: { notificationTemplate: "项目通知" },
        }),
      }),
    );
  });

  it("发布缺少开始节点的流程时抛出明确错误", async () => {
    const { service } = createGraphService({
      id: "def-1",
      nodes: [
        { id: "end-1", name: "结束", type: NodeType.END, properties: {} },
      ],
      flows: [],
    });

    await expect(service.publishDefinition("def-1")).rejects.toThrow(
      "流程必须配置且只能配置一个开始节点",
    );
  });

  it("发布缺少结束节点的流程时抛出明确错误", async () => {
    const { service } = createGraphService({
      id: "def-1",
      nodes: [
        { id: "start-1", name: "开始", type: NodeType.START, properties: {} },
      ],
      flows: [],
    });

    await expect(service.publishDefinition("def-1")).rejects.toThrow(
      "流程必须且只能配置一个结束节点",
    );
  });

  it("发布包含多个结束节点的流程时抛出明确错误", async () => {
    const { service } = createGraphService({
      id: "def-1",
      nodes: [
        { id: "start-1", name: "开始", type: NodeType.START, properties: {} },
        {
          id: "condition-1",
          name: "条件",
          type: NodeType.CONDITION,
          properties: {
            conditions: [
              {
                id: "c1",
                field: "amount",
                operator: ConditionOperator.GT,
                value: 10,
              },
              {
                id: "c2",
                field: "amount",
                operator: ConditionOperator.LTE,
                value: 10,
              },
            ],
          },
        },
        { id: "end-1", name: "结束一", type: NodeType.END, properties: {} },
        { id: "end-2", name: "结束二", type: NodeType.END, properties: {} },
      ],
      flows: [
        { id: "f1", sourceNodeId: "start-1", targetNodeId: "condition-1" },
        {
          id: "f2",
          sourceNodeId: "condition-1",
          targetNodeId: "end-1",
          flowType: "condition",
          conditionId: "c1",
        },
        {
          id: "f3",
          sourceNodeId: "condition-1",
          targetNodeId: "end-2",
          flowType: "condition",
          conditionId: "c2",
        },
      ],
    });

    await expect(service.publishDefinition("def-1")).rejects.toThrow(
      "流程必须且只能配置一个结束节点",
    );
  });

  it("发布审批节点缺审批人配置的流程时抛出明确错误", async () => {
    const { service } = createGraphService({
      id: "def-1",
      nodes: [
        { id: "start-1", name: "开始", type: NodeType.START, properties: {} },
        {
          id: "approval-1",
          name: "审批",
          type: NodeType.APPROVAL,
          properties: {},
        },
        { id: "end-1", name: "结束", type: NodeType.END, properties: {} },
      ],
      flows: [
        { id: "f1", sourceNodeId: "start-1", targetNodeId: "approval-1" },
        { id: "f2", sourceNodeId: "approval-1", targetNodeId: "end-1" },
      ],
    });

    await expect(service.publishDefinition("def-1")).rejects.toThrow(
      "审批节点「审批」未配置审批人",
    );
  });

  it("发布条件节点无默认分支但条件分支完整的流程时不阻断", async () => {
    const { service, definitionRepo } = createGraphService({
      id: "def-1",
      nodes: [
        { id: "start-1", name: "开始", type: NodeType.START, properties: {} },
        {
          id: "condition-1",
          name: "条件",
          type: NodeType.CONDITION,
          properties: {
            conditions: [
              {
                id: "c1",
                field: "amount",
                operator: ConditionOperator.GT,
                value: 100,
              },
            ],
          },
        },
        { id: "end-1", name: "结束", type: NodeType.END, properties: {} },
      ],
      flows: [
        { id: "f1", sourceNodeId: "start-1", targetNodeId: "condition-1" },
        {
          id: "f2",
          sourceNodeId: "condition-1",
          targetNodeId: "end-1",
          flowType: "condition",
          conditionId: "c1",
        },
      ],
    });

    await expect(service.publishDefinition("def-1")).resolves.toBeDefined();
    expect(definitionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: "1" }),
    );
  });

  it("发布无接收人的通知节点时不阻断", async () => {
    const { service, definitionRepo } = createGraphService({
      id: "def-1",
      nodes: [
        { id: "start-1", name: "开始", type: NodeType.START, properties: {} },
        {
          id: "notice-1",
          name: "通知",
          type: NodeType.NOTIFICATION,
          properties: {},
        },
        { id: "end-1", name: "结束", type: NodeType.END, properties: {} },
      ],
      flows: [
        { id: "f1", sourceNodeId: "start-1", targetNodeId: "notice-1" },
        { id: "f2", sourceNodeId: "notice-1", targetNodeId: "end-1" },
      ],
    });

    await expect(service.publishDefinition("def-1")).resolves.toBeDefined();
    expect(definitionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: "1" }),
    );
  });
});

describe("WorkflowService 定义草稿与发布版本", () => {
  const createDefinitionVersionService = (definitionRepo: any) => {
    return new WorkflowService(
      definitionRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { getOne: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  };

  it("保存已发布定义时创建同编码的新草稿版本，不覆盖已发布版本", async () => {
    const publishedDefinition = {
      id: "def-published",
      name: "原发布流程",
      code: "WF_PROJECT_APPROVAL",
      version: 2,
      category: "project",
      description: "old",
      nodes: [{ id: "start-1", type: NodeType.START, properties: {} }],
      flows: [],
      globalConfig: { notify: true },
      businessType: "project",
      businessScene: "approval",
      triggerEvent: "manual",
      isActive: "1",
    };
    const draftDefinition = {
      id: "def-draft",
      code: "WF_PROJECT_APPROVAL",
      version: 3,
      isActive: "0",
    };
    const definitionRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(publishedDefinition)
        .mockResolvedValueOnce({ version: 2 }),
      create: jest.fn((entity) => ({ ...entity, id: "def-draft" })),
      save: jest.fn().mockResolvedValue(draftDefinition),
    };
    const service = createDefinitionVersionService(definitionRepo);

    const result = await service.saveDefinition({
      id: "def-published",
      name: "调整后的流程",
      businessType: "project",
      businessScene: "approval",
      nodes: [{ id: "start-2", type: NodeType.START, properties: {} }],
      flows: [],
    });

    expect(definitionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "调整后的流程",
        code: "WF_PROJECT_APPROVAL",
        version: 3,
        isActive: "0",
      }),
    );
    expect(definitionRepo.save).not.toHaveBeenCalledWith(publishedDefinition);
    expect(result).toEqual(draftDefinition);
  });

  it("发布草稿版本时停用同编码的旧发布版本", async () => {
    const draftDefinition = {
      id: "def-draft",
      name: "调整后的流程",
      code: "WF_PROJECT_APPROVAL",
      version: 3,
      businessType: "project",
      businessScene: "approval",
      isActive: "0",
      nodes: [
        { id: "start-1", name: "开始", type: NodeType.START, properties: {} },
        {
          id: "approval-1",
          name: "审批",
          type: NodeType.APPROVAL,
          properties: { assigneeType: "user", assigneeValue: "u1" },
        },
        { id: "end-1", name: "结束", type: NodeType.END, properties: {} },
      ],
      flows: [
        { id: "f1", sourceNodeId: "start-1", targetNodeId: "approval-1" },
        { id: "f2", sourceNodeId: "approval-1", targetNodeId: "end-1" },
      ],
    };
    const oldPublishedDefinition = {
      id: "def-published",
      code: "WF_PROJECT_APPROVAL",
      businessType: "project",
      businessScene: "approval",
      isActive: "1",
    };
    const definitionRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(draftDefinition)
        .mockResolvedValueOnce(oldPublishedDefinition),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    const service = createDefinitionVersionService(definitionRepo);

    await expect(service.publishDefinition("def-draft")).resolves.toEqual(
      expect.objectContaining({ id: "def-draft", isActive: "1" }),
    );
    expect(definitionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "def-published", isActive: "0" }),
    );
    expect(definitionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "def-draft", isActive: "1" }),
    );
  });

  it("按业务对象和场景发起时多条已发布流程取最高版本", async () => {
    const latestPublishedDefinition = {
      id: "def-v3",
      code: "WF_PROJECT_APPROVAL",
      version: 3,
      businessType: "project",
      businessScene: "approval",
      isActive: "1",
      nodes: [],
      flows: [],
    };
    const definitionRepo = {
      find: jest.fn().mockResolvedValue([
        latestPublishedDefinition,
        {
          id: "def-v2",
          code: "WF_PROJECT_APPROVAL",
          version: 2,
          businessType: "project",
          businessScene: "approval",
          isActive: "1",
          nodes: [],
          flows: [],
        },
      ]),
    };
    const service = createDefinitionVersionService(definitionRepo);

    await expect(
      service.getDefinitionByScene("project", "approval"),
    ).resolves.toEqual(expect.objectContaining({ id: "def-v3", version: 3 }));
    expect(definitionRepo.find).toHaveBeenCalledWith({
      where: {
        businessType: "project",
        businessScene: "approval",
        isActive: "1",
      },
      order: { version: "DESC" },
    });
  });
});

describe("WorkflowService 业务类型与自动触发", () => {
  it("数据加载器默认注册 handover 业务类型", () => {
    const service = new WorkflowDataLoaderService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { load: jest.fn(), getFields: jest.fn(() => []) } as any,
    );

    expect(service.getRegisteredTypes()).toContain("handover");
  });

  it("发起业务流程时拒绝同业务已有运行中实例", async () => {
    const definitionRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: "def-1",
          code: "WF_PROJECT_APPROVAL",
          businessType: "project",
          businessScene: "approval",
          nodes: [],
          flows: [],
        },
      ]),
    };
    const instanceRepo = {
      findOne: jest.fn().mockResolvedValue({ id: "wf-running" }),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    const service = new WorkflowService(
      definitionRepo as any,
      instanceRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { getOne: jest.fn() } as any,
      {} as any,
      { loadData: jest.fn() } as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.startBusinessWorkflow(
        {
          businessType: "project",
          businessScene: "approval",
          businessKey: "project_p1",
        },
        "u1",
      ),
    ).rejects.toThrow(BadRequestException);
    expect(instanceRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessKey: "project_p1",
          status: "1",
        }),
      }),
    );
  });

  it("发起业务流程时使用数据库锁防止多实例重复触发", async () => {
    const definitionRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: "def-1",
          code: "WF_PROJECT_APPROVAL",
          businessType: "project",
          businessScene: "approval",
          nodes: [],
          flows: [],
        },
      ]),
    };
    const instanceRepo = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ locked: 1 }])
        .mockResolvedValueOnce([{ released: 1 }]),
      findOne: jest.fn().mockResolvedValue({ id: "wf-running" }),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    const service = new WorkflowService(
      definitionRepo as any,
      instanceRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { getOne: jest.fn() } as any,
      {} as any,
      { loadData: jest.fn() } as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.startBusinessWorkflow(
        {
          businessType: "project",
          businessScene: "approval",
          businessKey: "project_p1",
        },
        "u1",
      ),
    ).rejects.toThrow(BadRequestException);

    expect(instanceRepo.query).toHaveBeenNthCalledWith(
      1,
      "SELECT GET_LOCK(?, 5) AS locked",
      ["workflow:start:project_p1"],
    );
    expect(instanceRepo.query).toHaveBeenNthCalledWith(
      2,
      "SELECT RELEASE_LOCK(?) AS released",
      ["workflow:start:project_p1"],
    );
  });
});
