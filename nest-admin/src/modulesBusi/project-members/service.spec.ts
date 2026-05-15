import { ForbiddenException } from "@nestjs/common";
import { ProjectMembersService } from "./service";

describe("ProjectMembersService project role permissions", () => {
  const createService = (permissionContext: Record<string, any>) => {
    const repository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const projectsService = {
      getProjectPermissionContext: jest
        .fn()
        .mockResolvedValue(permissionContext),
    };
    const service = new ProjectMembersService(
      repository as any,
      projectsService as any,
    );
    jest.spyOn(service, "add").mockResolvedValue({ id: "new-member" } as any);
    jest.spyOn(service, "update").mockResolvedValue({ id: "m1" } as any);
    jest.spyOn(service, "del").mockResolvedValue({ affected: 1 } as any);
    jest.spyOn(service, "getOne").mockResolvedValue({ id: "m1" } as any);
    return { service, repository, projectsService };
  };

  it("项目经理可以维护自己项目成员", async () => {
    const { service, projectsService } = createService({
      canManageMembers: true,
    });

    await service.addMember({
      projectId: "p1",
      userId: "u1",
      _operatorId: "manager-1",
      _operatorPermissions: ["business/projects/access"],
    } as any);

    expect(projectsService.getProjectPermissionContext).toHaveBeenCalledWith(
      "p1",
      "manager-1",
      ["business/projects/access"],
    );
  });

  it("非成员管理员角色不能维护项目成员", async () => {
    const { service } = createService({ canManageMembers: false });

    await expect(
      service.addMember({
        projectId: "p1",
        userId: "u1",
        _operatorId: "member-1",
        _operatorPermissions: ["business/projects/access"],
      } as any),
    ).rejects.toThrow(new ForbiddenException("当前无维护项目成员的权限"));
  });

  it("编辑和移除成员时按成员所属项目校验项目内角色", async () => {
    const { service, repository, projectsService } = createService({
      canManageMembers: true,
    });
    repository.findOne.mockResolvedValue({
      id: "m1",
      projectId: "p1",
    });

    await service.updateMember("m1", {
      role: "2",
      _operatorId: "manager-1",
      _operatorPermissions: ["business/projects/access"],
    } as any);
    await service.removeMember("m1", {
      _operatorId: "manager-1",
      _operatorPermissions: ["business/projects/access"],
    } as any);

    expect(projectsService.getProjectPermissionContext).toHaveBeenCalledTimes(
      2,
    );
  });
});
