import { RisksService } from "./service";

describe("RisksService convert to task", () => {
  it("可将风险转换为任务并写入来源字段", async () => {
    const repository = { findOne: jest.fn(), update: jest.fn() };
    const tasksService = {
      add: jest
        .fn()
        .mockResolvedValue({ id: "t1", name: "风险应对：接口性能风险" }),
    };
    const service = new RisksService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      tasksService as any,
    );

    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "r1",
      name: "接口性能风险",
      projectId: "p1",
      description: "性能存在不确定性",
      mitigation: "压测并优化",
      riskOwnerId: "u1",
      dueDate: "2026-05-01",
    } as any);

    const result = await service.convertToTask("r1", {
      id: "u1",
      name: "tester",
    });

    expect(tasksService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "p1",
        sourceType: "risk",
        sourceId: "r1",
      }),
    );
    expect(result.taskId).toBe("t1");
  });

  it("返回风险对象权限上下文", async () => {
    const repository = { findOne: jest.fn(), update: jest.fn() };
    const projectsService = {
      buildExecutionPermissionContext: jest.fn(
        ({ context, operatorId, ownerIds, createUser }) => {
          const normalizedOperatorId = String(operatorId || "");
          const isOwner = (ownerIds || [])
            .map((item) => String(item || ""))
            .includes(normalizedOperatorId);
          const isCreator = String(createUser || "") === normalizedOperatorId;
          return {
            canEdit:
              Boolean(context?.isManager) ||
              Boolean(context?.isDeliveryManager) ||
              Boolean(context?.isFunctionalLead) ||
              isOwner ||
              isCreator,
            canDelete:
              Boolean(context?.isManager) ||
              Boolean(context?.isDeliveryManager) ||
              isOwner ||
              isCreator,
          };
        },
      ),
      getProjectPermissionContext: jest.fn().mockResolvedValue({
        isManager: false,
        isDeliveryManager: true,
        isFunctionalLead: false,
      }),
    };
    const service = new RisksService(
      repository as any,
      {} as any,
      {} as any,
      projectsService as any,
      { add: jest.fn() } as any,
    );

    const result = await (service as any).getRiskPermissions(
      {
        projectId: "p1",
        riskOwnerId: "u2",
        createUser: "creator-1",
      },
      "u1",
    );

    expect(result).toEqual(
      expect.objectContaining({
        canEdit: true,
        canDelete: true,
        permissionContext: expect.objectContaining({
          canEdit: true,
          canDelete: true,
        }),
      }),
    );
  });
});
