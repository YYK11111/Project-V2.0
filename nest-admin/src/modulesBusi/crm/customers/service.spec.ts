import { CustomersService } from "./service";

describe("CustomersService", () => {
  function createRepository() {
    return {
      save: jest.fn().mockImplementation(async (data) => data),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      count: jest.fn(),
      findAndCount: jest.fn(),
      manager: {
        query: jest.fn(),
      },
    };
  }

  it("新增客户时应把空字符串销售负责人归一化为 null", async () => {
    const repository = createRepository();
    const service = new CustomersService(repository as never);

    await service.save({
      name: "测试客户",
      contactPerson: "张三",
      contactPhone: "13800138000",
      salesId: "",
    } as never);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        salesId: null,
      }),
    );
  });

  it("通过 add 新增客户时也应把空字符串销售负责人归一化为 null", async () => {
    const repository = createRepository();
    const service = new CustomersService(repository as never);

    await service.add({
      name: "测试客户",
      contactPerson: "李四",
      contactPhone: "13900139000",
      salesId: "",
    } as never);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        salesId: null,
      }),
    );
  });
});
