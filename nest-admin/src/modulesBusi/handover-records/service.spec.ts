import { HandoverRecordsService } from "./service";

describe("HandoverRecordsService approval view", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    const service = new HandoverRecordsService(repository as any);
    return { service, repository };
  };

  it("将交接单退回发起人状态映射为统一审批视图", () => {
    const { service } = createService();

    const result = (service as any).buildApprovalViewModel({
      approvalStatus: "3",
      currentNodeName: "退回发起人-补充交接说明",
    });

    expect(result).toEqual({
      status: "returned",
      label: "已退回发起人",
      currentNodeName: "退回发起人-补充交接说明",
      canSubmit: false,
      canResubmit: true,
    });
  });

  it("交接单详情返回审批视图", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "h1",
      title: "运维交接单",
      approvalStatus: "1",
      currentNodeName: "交接审批中",
      project: null,
    });

    const result = await service.getOne({ id: "h1" });

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
