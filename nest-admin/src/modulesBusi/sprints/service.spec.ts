import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { SprintsService } from "./service";

describe("SprintsService completeSprint guards", () => {
  it("未完成任务存在时不允许直接完成 Sprint", async () => {
    const repository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const taskRepository = {
      find: jest.fn().mockResolvedValue([
        { id: "t1", storyPoints: 3, status: "3" },
        { id: "t2", storyPoints: 5, status: "2" },
      ]),
    };

    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      {} as any,
    );
    jest
      .spyOn(service, "getOne")
      .mockResolvedValue({ id: "s1", status: "2" } as any);

    await expect(service.completeSprint("s1")).rejects.toThrow(
      new BadRequestException("Sprint 下仍有 1 个未完成任务，不能直接完成"),
    );
  });

  it("可将未完成任务结转到 backlog", async () => {
    const repository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const taskRepository = {
      find: jest.fn().mockResolvedValue([
        { id: "t1", storyPoints: 3, status: "3" },
        { id: "t2", storyPoints: 5, status: "2" },
      ]),
      update: jest.fn(),
    };

    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      {} as any,
    );
    jest
      .spyOn(service, "getOne")
      .mockResolvedValue({ id: "s1", status: "2" } as any);

    const result = await service.completeSprint("s1", {
      carryOverMode: "backlog",
    } as any);

    expect(taskRepository.update).toHaveBeenCalledWith("t2", {
      sprintId: null,
    });
    expect(result.carryOverCount).toBe(1);
  });

  it("列表按当前用户可见项目过滤", async () => {
    const repository = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      getVisibleProjectIds: jest.fn().mockResolvedValue(["p1", "p2"]),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "u1",
      _operatorPermissions: [],
    } as any);

    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: expect.objectContaining({
            _value: ["p1", "p2"],
          }),
        }),
      }),
    );
  });

  it("显式项目不在可见项目内时列表返回空", async () => {
    const repository = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      getVisibleProjectIds: jest.fn().mockResolvedValue(["p1", "p2"]),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      projectId: "p3",
      _operatorId: "u1",
      _operatorPermissions: [],
    } as any);

    expect(result).toEqual({ data: [], total: 0, _flag: true });
    expect(repository.findAndCount).not.toHaveBeenCalled();
  });

  it("基础访问权限允许查看本人相关 Sprint 列表", async () => {
    const repository = {
      findAndCount: jest.fn().mockResolvedValue([[{ id: "s1" }], 1]),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      getVisibleProjectIds: jest.fn().mockResolvedValue([]),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "u1",
      _operatorPermissions: ["business/sprints/access"],
    } as any);

    expect(result.total).toBe(1);
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.arrayContaining([
          expect.objectContaining({ ownerId: "u1" }),
          expect.objectContaining({ scrumMasterId: "u1" }),
        ]),
      }),
    );
  });

  it("详情要求当前用户具备项目执行对象权限", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "s1",
        projectId: "p1",
      }),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      assertReadableProject: jest
        .fn()
        .mockRejectedValue(new ForbiddenException("当前无该项目的操作权限")),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    await expect(
      service.getOne({ id: "s1", _operatorId: "viewer-1" } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it("基础访问权限允许查看本人相关 Sprint 详情", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "s1",
        projectId: "p1",
        ownerId: "viewer-1",
      }),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      assertReadableProject: jest
        .fn()
        .mockRejectedValue(new ForbiddenException("当前无该项目的操作权限")),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    const result = await service.getOne({
      id: "s1",
      _operatorId: "viewer-1",
      _operatorPermissions: ["business/sprints/access"],
    } as any);

    expect(result).toEqual(expect.objectContaining({ id: "s1" }));
  });

  it("详情会透传当前用户权限给项目执行对象权限校验", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "s1",
        projectId: "p1",
      }),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      assertReadableProject: jest.fn(),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    await service.getOne({
      id: "s1",
      _operatorId: "viewer-1",
      _operatorPermissions: ["business/projects/manageAll"],
    } as any);

    expect(
      projectExecutionPermissionService.assertReadableProject,
    ).toHaveBeenCalledWith(
      "p1",
      "viewer-1",
      ["business/projects/manageAll"],
      "business/sprints/manageAll",
    );
  });

  it("详情查询不会把内部权限字段传入 where", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "s1",
        projectId: "p1",
      }),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      assertReadableProject: jest.fn(),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    await service.getOne({
      id: "s1",
      _operatorId: "viewer-1",
      _operatorPermissions: ["business/projects/manageAll"],
    } as any);

    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        relations: ["project", "scrumMaster", "owner"],
      }),
    );
    expect(
      projectExecutionPermissionService.assertReadableProject,
    ).toHaveBeenCalledWith(
      "p1",
      "viewer-1",
      ["business/projects/manageAll"],
      "business/sprints/manageAll",
    );
  });

  it("更新仅传 id 时按旧项目校验可写权限", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "s1",
        projectId: "old-p1",
      }),
      save: jest.fn(),
      update: jest.fn(),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      assertReadableProject: jest.fn(),
      assertWritableProject: jest.fn(),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    await service.update({ id: "s1", _operatorId: "u1" } as any);

    expect(
      projectExecutionPermissionService.assertWritableProject,
    ).toHaveBeenCalledWith("old-p1", "u1", [], "business/sprints/manageAll");
    expect(
      projectExecutionPermissionService.assertReadableProject,
    ).not.toHaveBeenCalled();
  });

  it("旧记录项目为空且更新仅传 id 时不校验空项目可写", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "s1",
        projectId: "",
      }),
      save: jest.fn(),
      update: jest.fn(),
    };
    const taskRepository = { find: jest.fn() };
    const projectExecutionPermissionService = {
      assertWritableProject: jest.fn(),
    };
    const service = new SprintsService(
      repository as any,
      taskRepository as any,
      projectExecutionPermissionService as any,
    );

    await service.update({ id: "s1", _operatorId: "u1" } as any);

    expect(
      projectExecutionPermissionService.assertWritableProject,
    ).not.toHaveBeenCalled();
  });
});
