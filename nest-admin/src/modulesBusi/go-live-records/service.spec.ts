import { GoLiveRecordsService } from "./service";
import { GoLiveRecord, GoLiveRecordStatus } from "./entity";
import { getMetadataArgsStorage } from "typeorm";

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

  it("基础访问权限允许查看本人相关上线单列表", async () => {
    const { service, repository, projectExecutionPermissionService } =
      createService({ id: "go-1" });
    repository["findAndCount"] = jest
      .fn()
      .mockResolvedValue([[{ id: "go-1" }], 1]);
    projectExecutionPermissionService.getVisibleProjectIds.mockResolvedValue(
      [],
    );

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "u1",
      _operatorPermissions: ["business/go-live-records/access"],
    } as any);

    expect(result.total).toBe(1);
    expect(repository["findAndCount"]).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ownerId: "u1" }),
      }),
    );
  });

  it("基础访问权限允许查看本人相关上线单详情", async () => {
    const { service, projectExecutionPermissionService } = createService({
      id: "go-1",
      projectId: "p1",
      ownerId: "viewer-1",
    });
    projectExecutionPermissionService.assertReadableProject.mockRejectedValue(
      new Error("当前无该项目的操作权限"),
    );

    const result = await service.getOne({
      id: "go-1",
      _operatorId: "viewer-1",
      _operatorPermissions: ["business/go-live-records/access"],
    } as any);

    expect(result).toEqual(expect.objectContaining({ id: "go-1" }));
  });

  it("用户不能通过状态字段把已成功上线单回退为草稿", async () => {
    const { service, repository } = createService({
      id: "go-1",
      projectId: "p1",
      status: GoLiveRecordStatus.succeeded,
    });
    repository.save.mockImplementation(async (data) => data);

    await service.update({
      id: "go-1",
      title: "用户修改",
      status: GoLiveRecordStatus.draft,
    } as any);

    expect(repository.save).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: GoLiveRecordStatus.draft }),
    );
  });

  it("用户新增和修改上线单时不能写入状态字段", async () => {
    const { service, repository } = createService({
      id: "go-1",
      projectId: "p1",
      status: GoLiveRecordStatus.draft,
    });
    repository.save.mockImplementation(async (data) => data);

    await service.add({
      title: "上线单",
      projectId: "p1",
      status: GoLiveRecordStatus.succeeded,
    } as any);
    await service.update({
      id: "go-1",
      title: "上线单更新",
      status: GoLiveRecordStatus.succeeded,
    } as any);

    expect(repository.save).toHaveBeenNthCalledWith(
      1,
      expect.not.objectContaining({ status: GoLiveRecordStatus.succeeded }),
    );
    expect(repository.save).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({ status: GoLiveRecordStatus.succeeded }),
    );
  });

  it("用户新增和修改上线单时不能写入实际上线时间", async () => {
    const { service, repository } = createService({
      id: "go-1",
      projectId: "p1",
      status: GoLiveRecordStatus.draft,
    });
    repository.save.mockImplementation(async (data) => data);

    await service.add({
      title: "上线单",
      projectId: "p1",
      actualGoLiveTime: "2026-05-01 10:00:00",
    } as any);
    await service.update({
      id: "go-1",
      title: "上线单更新",
      actualGoLiveTime: "2026-05-01 10:00:00",
    } as any);

    expect(repository.save).toHaveBeenNthCalledWith(
      1,
      expect.not.objectContaining({ actualGoLiveTime: expect.anything() }),
    );
    expect(repository.save).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({ actualGoLiveTime: expect.anything() }),
    );
  });

  it("上线单系统动作按状态推进并写入实际上线时间", async () => {
    const { service, repository } = createService({
      id: "go-1",
      projectId: "p1",
      status: GoLiveRecordStatus.approved,
    });
    repository.update = jest.fn().mockResolvedValue({ affected: 1 });

    await service.startGoLive("go-1", "u1", []);
    expect(repository.update).toHaveBeenCalledWith("go-1", {
      status: GoLiveRecordStatus.executing,
    });

    repository.findOne.mockResolvedValueOnce({
      id: "go-1",
      projectId: "p1",
      status: GoLiveRecordStatus.executing,
    });
    await service.confirmSuccess("go-1", "u1", []);
    expect(repository.update).toHaveBeenLastCalledWith(
      "go-1",
      expect.objectContaining({
        status: GoLiveRecordStatus.succeeded,
        actualGoLiveTime: expect.any(String),
      }),
    );

    repository.findOne.mockResolvedValueOnce({
      id: "go-2",
      projectId: "p1",
      status: GoLiveRecordStatus.executing,
    });
    await service.confirmRollback("go-2", "u1", []);
    expect(repository.update).toHaveBeenLastCalledWith(
      "go-2",
      expect.objectContaining({
        status: GoLiveRecordStatus.rolledBack,
        actualGoLiveTime: expect.any(String),
      }),
    );
  });
});

describe("GoLiveRecord 时间字段", () => {
  it("读取实际上线时间时保留日期和时分秒", () => {
    const actualColumn = getMetadataArgsStorage().columns.find(
      (item) =>
        item.target === GoLiveRecord &&
        item.propertyName === "actualGoLiveTime",
    );
    const plannedColumn = getMetadataArgsStorage().columns.find(
      (item) =>
        item.target === GoLiveRecord &&
        item.propertyName === "plannedGoLiveTime",
    );

    expect(
      actualColumn?.options.transformer?.["from"](
        new Date("2026-05-15T10:20:30"),
      ),
    ).toBe("2026-05-15 10:20:30");
    expect(
      plannedColumn?.options.transformer?.["from"](
        new Date("2026-05-15T10:20:30"),
      ),
    ).toBe("2026-05-15");
  });
});
