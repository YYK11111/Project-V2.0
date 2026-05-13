import { ChangesController } from "./controller";

describe("ChangesController", () => {
  const createController = () => {
    const service = {
      approve: jest.fn(),
      reject: jest.fn(),
    };
    const workflowService = {};
    const controller = new ChangesController(
      service as any,
      workflowService as any,
    );

    return { controller, service };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("直接审批时只使用服务端认证用户 ID 并传递用户权限", async () => {
    const { controller, service } = createController();
    service.approve.mockResolvedValue({ affected: 1 });

    await controller.approve(
      "c1",
      { approverId: "evil", comment: "同意" } as any,
      { user: { id: "u1", permissions: ["business/projects/manageAll"] } },
    );

    expect(service.approve).toHaveBeenCalledWith("c1", "u1", "同意", [
      "business/projects/manageAll",
    ]);
  });

  it("直接拒绝时传递用户权限", async () => {
    const { controller, service } = createController();
    service.reject.mockResolvedValue({ affected: 1 });

    await controller.reject(
      "c1",
      { comment: "拒绝" },
      { user: { id: "u1", permissions: ["business/projects/manageAll"] } },
    );

    expect(service.reject).toHaveBeenCalledWith("c1", "u1", "拒绝", [
      "business/projects/manageAll",
    ]);
  });

  it("直接审批时用户 ID 为空则使用用户名", async () => {
    const { controller, service } = createController();
    service.approve.mockResolvedValue({ affected: 1 });

    await controller.approve(
      "c1",
      { comment: "同意" },
      { user: { name: "nameUser", permissions: [] } },
    );

    expect(service.approve).toHaveBeenCalledWith("c1", "nameUser", "同意", []);
  });
});
