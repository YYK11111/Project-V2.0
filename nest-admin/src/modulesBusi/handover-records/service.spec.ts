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

  it("全量管理权限在列表行上返回可操作权限", async () => {
    const { service, projectExecutionPermissionService } = createService({
      id: "handover-1",
    });
    jest.spyOn(service as any, "listBy").mockResolvedValue({
      data: [{ id: "handover-1", projectId: "p1" }],
      total: 1,
    });
    projectExecutionPermissionService.getVisibleProjectIds.mockResolvedValue(
      null,
    );
    projectExecutionPermissionService.assertWritableProject = jest
      .fn()
      .mockResolvedValue({});

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "admin-1",
      _operatorPermissions: ["business/handover-records/manageAll"],
    } as any);

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        canEdit: true,
        canDelete: true,
      }),
    );
    expect(
      projectExecutionPermissionService.assertWritableProject,
    ).toHaveBeenCalledWith(
      "p1",
      "admin-1",
      expect.arrayContaining(["business/handover-records/manageAll"]),
      "business/handover-records/manageAll",
    );
  });
});
