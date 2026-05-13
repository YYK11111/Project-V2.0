import { HandoverRecordsService } from "./service";
import { HandoverRecordStatus } from "./entity";

describe("HandoverRecordsService 状态机", () => {
  const createService = (record: any) => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(record),
      save: jest.fn(),
    };
    const projectExecutionPermissionService = {
      assertWritableProject: jest.fn(),
      assertReadableProject: jest.fn(),
      getVisibleProjectIds: jest.fn(),
    };
    const service = new HandoverRecordsService(
      repository as any,
      projectExecutionPermissionService as any,
    );

    return { service, repository, projectExecutionPermissionService };
  };

  it("禁止已确认交接单回退为草稿", async () => {
    const { service, repository } = createService({
      id: "handover-1",
      projectId: "p1",
      status: HandoverRecordStatus.confirmed,
    });

    await expect(
      service.update({
        id: "handover-1",
        status: HandoverRecordStatus.draft,
      }),
    ).rejects.toThrow("交接单当前状态不允许变更为草稿");
    expect(repository.save).not.toHaveBeenCalled();
  });
});
