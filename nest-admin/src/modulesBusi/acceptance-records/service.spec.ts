import { AcceptanceRecordsService } from "./service";
import { AcceptanceRecordResult } from "./entity";

describe("AcceptanceRecordsService 状态机", () => {
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
    const service = new AcceptanceRecordsService(
      repository as any,
      projectExecutionPermissionService as any,
    );

    return { service, repository, projectExecutionPermissionService };
  };

  it("禁止已通过验收单回退为整改中", async () => {
    const { service, repository } = createService({
      id: "acc-1",
      projectId: "p1",
      result: AcceptanceRecordResult.passed,
    });

    await expect(
      service.update({
        id: "acc-1",
        result: AcceptanceRecordResult.rectifying,
      }),
    ).rejects.toThrow("验收单当前结果不允许变更为整改中");
    expect(repository.save).not.toHaveBeenCalled();
  });
});
