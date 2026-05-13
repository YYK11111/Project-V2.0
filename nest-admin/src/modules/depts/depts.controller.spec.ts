import { DeptController } from "./depts.controller";

describe("DeptController", () => {
  it("部门选项接口应委托服务返回轻量部门数据", async () => {
    const service = {
      getOptions: jest.fn().mockResolvedValue([
        {
          id: "dept-1",
          name: "研发部",
          parentId: "0",
        },
      ]),
    };
    const controller = new DeptController(service as any);
    const query = {
      pageNum: 1,
      pageSize: 1000,
    };

    await expect(controller.getOptions(query)).resolves.toEqual([
      {
        id: "dept-1",
        name: "研发部",
        parentId: "0",
      },
    ]);

    expect(service.getOptions).toHaveBeenCalledWith(query);
  });
});
