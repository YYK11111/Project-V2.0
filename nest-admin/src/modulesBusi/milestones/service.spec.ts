import { ForbiddenException } from "@nestjs/common";
import { MilestonesService } from "./service";

describe("MilestonesService project scope guards", () => {
  it("基础访问权限允许查看本人相关里程碑列表", async () => {
    const repository = {
      findAndCount: jest.fn().mockResolvedValue([[{ id: "m1" }], 1]),
    };
    const taskRepository = { find: jest.fn().mockResolvedValue([]) };
    const projectExecutionPermissionService = {
      getVisibleProjectIds: jest.fn().mockResolvedValue([]),
    };
    const service = new MilestonesService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "u1",
      _operatorPermissions: ["business/milestones/access"],
    } as any);

    expect(result.total).toBe(1);
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.arrayContaining([
          expect.objectContaining({ ownerId: "u1" }),
          expect.objectContaining({ creatorId: "u1" }),
        ]),
      }),
    );
  });

  it("详情要求当前用户具备项目执行对象权限", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "m1",
        projectId: "p1",
      }),
    };
    const taskRepository = { find: jest.fn().mockResolvedValue([]) };
    const projectExecutionPermissionService = {
      assertReadableProject: jest
        .fn()
        .mockRejectedValue(new ForbiddenException("当前无该项目的操作权限")),
    };
    const service = new MilestonesService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    await expect(
      service.getOne({ id: "m1", _operatorId: "viewer-1" } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it("基础访问权限允许查看本人相关里程碑详情", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "m1",
        projectId: "p1",
        ownerId: "viewer-1",
      }),
    };
    const taskRepository = { find: jest.fn().mockResolvedValue([]) };
    const projectExecutionPermissionService = {
      assertReadableProject: jest
        .fn()
        .mockRejectedValue(new ForbiddenException("当前无该项目的操作权限")),
    };
    const service = new MilestonesService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    const result = await service.getOne({
      id: "m1",
      _operatorId: "viewer-1",
      _operatorPermissions: ["business/milestones/access"],
    } as any);

    expect(result).toEqual(expect.objectContaining({ id: "m1" }));
  });

  it("更新仅传 id 时按旧项目校验可写权限", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "m1",
        projectId: "old-p1",
      }),
      save: jest.fn(),
      update: jest.fn(),
    };
    const taskRepository = { find: jest.fn().mockResolvedValue([]) };
    const projectExecutionPermissionService = {
      assertReadableProject: jest.fn(),
      assertWritableProject: jest.fn(),
    };
    const service = new MilestonesService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    await service.update({ id: "m1", _operatorId: "u1" } as any);

    expect(
      projectExecutionPermissionService.assertWritableProject,
    ).toHaveBeenCalledWith("old-p1", "u1", [], "business/milestones/manageAll");
    expect(
      projectExecutionPermissionService.assertReadableProject,
    ).not.toHaveBeenCalled();
  });
});
