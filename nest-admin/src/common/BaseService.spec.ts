import { BaseService } from "./BaseService";

class DemoEntity {}

describe("BaseService", () => {
  it("批量删除时应逐个校验所有 id", async () => {
    const repository = {
      update: jest.fn().mockResolvedValue({ affected: 2 }),
    };
    const service = new BaseService(DemoEntity, repository as any);
    const dataValidate = jest
      .spyOn(service, "dataValidate")
      .mockResolvedValue(true);

    await service.del("normal-id,protected-id", "operator", [], "operator");

    expect(dataValidate).toHaveBeenCalledTimes(2);
    expect(dataValidate).toHaveBeenNthCalledWith(1, {
      id: "normal-id",
      updateUser: "operator",
      permissions: [],
      operatorName: "operator",
    });
    expect(dataValidate).toHaveBeenNthCalledWith(2, {
      id: "protected-id",
      updateUser: "operator",
      permissions: [],
      operatorName: "operator",
    });
    expect(repository.update).toHaveBeenCalledWith(
      ["normal-id", "protected-id"],
      {
        isDelete: "1",
        updateUser: "operator",
      },
    );
  });
});
