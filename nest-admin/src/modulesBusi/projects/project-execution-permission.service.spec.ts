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
      "business/projects/listAll",
    ]);

    expect(result).toEqual(["p1", "p2"]);
    expect(projectsService.getVisibleProjectIdsForUser).toHaveBeenCalledWith(
      "u1",
      ["business/projects/listAll"],
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
      "business/projects/listAll",
    ]);

    expect(
      projectsService.assertExecutionObjectPermission,
    ).toHaveBeenCalledWith("p1", "u1", ["business/projects/listAll"]);
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
});
