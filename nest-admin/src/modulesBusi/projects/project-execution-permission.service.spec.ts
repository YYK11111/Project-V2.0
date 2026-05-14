import { ProjectExecutionPermissionService } from "./project-execution-permission.service";

describe("ProjectExecutionPermissionService", () => {
  function createService() {
    const projectsService = {
      getVisibleProjectIdsForUser: jest.fn(),
      assertExecutionObjectPermission: jest.fn(),
      assertProjectNotArchived: jest.fn(),
    };
    return {
      projectsService,
      service: new ProjectExecutionPermissionService(projectsService as any),
    };
  }

  it("透传当前用户可见项目权限", async () => {
    const { service, projectsService } = createService();
    projectsService.getVisibleProjectIdsForUser.mockResolvedValue(["p1", "p2"]);
    projectsService.assertExecutionObjectPermission.mockResolvedValue({});

    const result = await service.getVisibleProjectIds("u1", [
      "business/projects/manageAll",
    ]);

    expect(result).toEqual(["p1", "p2"]);
    expect(projectsService.getVisibleProjectIdsForUser).toHaveBeenCalledWith(
      "u1",
      ["business/projects/manageAll"],
    );
  });

  it("模块全量查看权限应按项目全量查看权限计算执行对象可见范围", async () => {
    const { service, projectsService } = createService();
    projectsService.getVisibleProjectIdsForUser.mockResolvedValue(null);

    const result = await service.getVisibleProjectIds(
      "u1",
      ["business/tasks/manageAll"],
      "business/tasks/manageAll",
    );

    expect(result).toBeNull();
    expect(projectsService.getVisibleProjectIdsForUser).toHaveBeenCalledWith(
      "u1",
      ["business/tasks/manageAll", "business/projects/manageAll"],
    );
  });

  it("过滤不可读或访客项目", async () => {
    const { service, projectsService } = createService();
    projectsService.getVisibleProjectIdsForUser.mockResolvedValue(["p1", "p2"]);
    projectsService.assertExecutionObjectPermission.mockImplementation(
      async (projectId: string) => {
        if (projectId === "p2") {
          throw new Error("访客角色不可查看项目内执行对象");
        }
        return {};
      },
    );

    const result = await service.getVisibleProjectIds("u1", []);

    expect(result).toEqual(["p1"]);
    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p1", "u1", []);
    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p2", "u1", []);
  });

  it("详情读权限校验会透传当前用户权限", async () => {
    const { service, projectsService } = createService();
    projectsService.assertExecutionObjectPermission.mockResolvedValue({});

    await service.assertReadableProject("p1", "u1", [
      "business/projects/manageAll",
    ]);

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p1", "u1", ["business/projects/manageAll"]);
  });

  it("写入时先校验项目未归档再校验执行对象权限", async () => {
    const { service, projectsService } = createService();
    const calls: string[] = [];
    projectsService.assertProjectNotArchived.mockImplementation(async () => {
      calls.push("notArchived");
    });
    projectsService.assertExecutionObjectPermission.mockImplementation(
      async () => {
        calls.push("executionPermission");
      },
    );

    await service.assertWritableProject("p1", "u1");

    expect(calls).toEqual(["notArchived", "executionPermission"]);
    expect(projectsService.assertProjectNotArchived).toHaveBeenCalledWith("p1");
    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p1", "u1", []);
  });

  it("模块全量管理权限应允许写入项目执行对象", async () => {
    const { service, projectsService } = createService();
    projectsService.assertProjectNotArchived.mockResolvedValue(undefined);
    projectsService.assertExecutionObjectPermission.mockResolvedValue({});

    await service.assertWritableProject(
      "p1",
      "u1",
      ["business/sprints/manageAll"],
      "business/sprints/manageAll",
    );

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p1", "u1", [
      "business/sprints/manageAll",
      "business/projects/manageAll",
    ]);
  });
});
