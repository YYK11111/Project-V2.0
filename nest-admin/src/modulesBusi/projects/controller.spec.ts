import { ProjectsController } from "./controller";

describe("ProjectsController", () => {
  it("项目列表应向服务透传当前登录用户名", async () => {
    const service = {
      list: jest.fn().mockResolvedValue({ list: [], total: 0 }),
    };
    const controller = new ProjectsController(
      service as any,
      {} as any,
      {} as any,
    );

    await controller.list({ pageNum: 1, pageSize: 10 } as any, {
      user: {
        id: "1",
        name: "NestAdmin",
        deptId: "dept-1",
        roles: ["admin"],
        permissions: ["business/projects/list"],
      },
    });

    expect(service.list).toHaveBeenCalledWith({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "1",
      _operatorName: "NestAdmin",
      _operatorDeptId: "dept-1",
      _operatorPermissions: ["business/projects/list"],
      _operatorRoles: ["admin"],
    });
  });
});
