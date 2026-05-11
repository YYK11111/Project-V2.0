import { GoLiveRecordsService } from "./service";
import { buildApprovalViewModel } from "src/modulesBusi/workflow/approval-view.helper";

describe("GoLiveRecordsService approval view", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    const service = new GoLiveRecordsService(repository as any);
    return { service, repository };
  };

  it("将上线单退回发起人状态映射为统一审批视图", () => {
    const { service } = createService();

    const result = buildApprovalViewModel({
      approvalStatus: "3",
      currentNodeName: "退回发起人-补充上线方案",
    });

    expect(result).toEqual({
      status: "returned",
      label: "已退回发起人",
      currentNodeName: "退回发起人-补充上线方案",
      canSubmit: false,
      canResubmit: true,
    });
  });

  it("上线单详情返回审批视图", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "g1",
      title: "上线单",
      approvalStatus: "1",
      currentNodeName: "上线审批中",
      project: null,
      owner: null,
    });

    const result = await service.getOne({ id: "g1" });

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
