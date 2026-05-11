import { AcceptanceRecordsService } from "./service";
import { buildApprovalViewModel } from "src/modulesBusi/workflow/approval-view.helper";

describe("AcceptanceRecordsService approval view", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    const service = new AcceptanceRecordsService(repository as any);
    return { service, repository };
  };

  it("将验收单退回发起人状态映射为统一审批视图", () => {
    const { service } = createService();

    const result = buildApprovalViewModel({
      approvalStatus: "3",
      currentNodeName: "退回发起人-补充验收资料",
    });

    expect(result).toEqual({
      status: "returned",
      label: "已退回发起人",
      currentNodeName: "退回发起人-补充验收资料",
      canSubmit: false,
      canResubmit: true,
    });
  });

  it("验收单详情返回审批视图", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "a1",
      title: "验收单",
      approvalStatus: "1",
      currentNodeName: "验收审批中",
      project: null,
    });

    const result = await service.getOne({ id: "a1" });

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
