import { ForbiddenException } from "@nestjs/common";
import { MilestonesService } from "./service";

describe("MilestonesService project scope guards", () => {
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
    ).toHaveBeenCalledWith("old-p1", "u1", []);
    expect(
      projectExecutionPermissionService.assertReadableProject,
    ).not.toHaveBeenCalled();
  });
});
