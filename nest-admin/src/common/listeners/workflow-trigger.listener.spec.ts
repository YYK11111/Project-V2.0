import { WorkflowTriggerListener } from "./workflow-trigger.listener";

describe("WorkflowTriggerListener", () => {
  const dataLoader = {
    getTriggerConfig: jest.fn(),
  };
  const workflowService = {
    startBusinessWorkflow: jest.fn(),
  };
  const dataSource = {
    subscribers: [],
  };

  const createListener = () =>
    new WorkflowTriggerListener(
      dataLoader as any,
      workflowService as any,
      dataSource as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    dataLoader.getTriggerConfig.mockResolvedValue(null);
  });

  it("非业务实体插入且没有 id 时不应触发工作流", async () => {
    const listener = createListener();

    await expect(
      listener.afterInsert({
        entity: { role_id: "1", menu_id: "211" },
        metadata: { name: "sys_role_menu" },
      } as any),
    ).resolves.toBeUndefined();

    expect(dataLoader.getTriggerConfig).not.toHaveBeenCalled();
    expect(workflowService.startBusinessWorkflow).not.toHaveBeenCalled();
  });

  it.each([
    ["GoLiveRecord", "goLive"],
    ["AcceptanceRecord", "acceptance"],
    ["HandoverRecord", "handover"],
  ])("%s 插入时按业务类型触发创建流程", async (entityName, businessType) => {
    dataLoader.getTriggerConfig.mockResolvedValue({
      businessScene: "approval",
    });
    const listener = createListener();

    await listener.afterInsert({
      entity: { id: "biz-1" },
      metadata: { name: entityName },
    } as any);

    expect(dataLoader.getTriggerConfig).toHaveBeenCalledWith(
      businessType,
      "onCreate",
    );
    expect(workflowService.startBusinessWorkflow).toHaveBeenCalledWith(
      {
        businessType,
        businessScene: "approval",
        businessKey: `${businessType}_biz-1`,
        variables: { triggerEvent: "onCreate", businessType },
      },
      "system",
    );
  });
});
