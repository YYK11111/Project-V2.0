import { CustomersService } from "./service";

describe("CustomersService approval view", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };
    const service = new CustomersService(repository as any);
    return { service, repository };
  };

  it("将客户退回发起人状态映射为统一审批视图", () => {
    const { service } = createService();

    const result = (service as any).buildApprovalViewModel({
      approvalStatus: "3",
      currentNodeName: "退回发起人-补充客户资料",
    });

    expect(result).toEqual({
      status: "returned",
      label: "已退回发起人",
      currentNodeName: "退回发起人-补充客户资料",
      canSubmit: false,
      canResubmit: true,
    });
  });

  it("客户详情返回审批视图", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "c1",
      name: "客户A",
      approvalStatus: "1",
      currentNodeName: "客户审批中",
      sales: null,
    });

    const result = await service.getOne({ id: "c1" });

    expect(result).toEqual(
      expect.objectContaining({
        approvalView: expect.objectContaining({
          status: "pending",
          label: "审批中",
        }),
      }),
    );
  });
});
