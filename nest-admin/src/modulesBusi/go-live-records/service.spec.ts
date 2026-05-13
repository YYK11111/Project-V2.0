import { GoLiveRecordsService } from "./service";
import { GoLiveRecordStatus } from "./entity";

describe("GoLiveRecordsService 状态机", () => {
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
    const service = new GoLiveRecordsService(
      repository as any,
      projectExecutionPermissionService as any,
    );

    return { service, repository, projectExecutionPermissionService };
  };

  it("禁止已成功上线单回退为草稿", async () => {
    const { service, repository } = createService({
      id: "go-1",
      projectId: "p1",
      status: GoLiveRecordStatus.succeeded,
    });

    await expect(
      service.update({
        id: "go-1",
        status: GoLiveRecordStatus.draft,
      }),
    ).rejects.toThrow("上线单当前状态不允许变更为草稿");
    expect(repository.save).not.toHaveBeenCalled();
  });
});
