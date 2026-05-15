import { BusinessApprovalContextController } from "./controller";

describe("BusinessApprovalContextController", () => {
  it("触发历史审批参与人索引回填", async () => {
    const service = {
      backfillParticipants: jest.fn().mockResolvedValue({
        total: 2,
        processed: 2,
        skipped: 0,
        failed: 0,
        failures: [],
      }),
    };
    const controller = new BusinessApprovalContextController(service as any);

    const result = await controller.backfillParticipants({
      rootBusinessType: "project",
      businessType: "task",
      limit: "50",
      afterId: "ctx-10",
    });

    expect(service.backfillParticipants).toHaveBeenCalledWith({
      rootBusinessType: "project",
      businessType: "task",
      limit: 50,
      afterId: "ctx-10",
    });
    expect(result).toEqual({
      total: 2,
      processed: 2,
      skipped: 0,
      failed: 0,
      failures: [],
    });
  });
});
