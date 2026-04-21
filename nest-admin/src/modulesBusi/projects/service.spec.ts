import { BadRequestException } from "@nestjs/common";
import { ProjectsService } from "./service";

describe("ProjectsService closure guards", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const service = new ProjectsService(
      repository as any,
      { count: jest.fn(), find: jest.fn() } as any,
      { count: jest.fn(), find: jest.fn() } as any,
      { count: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn(), findDescendants: jest.fn(), save: jest.fn() } as any,
      { findOne: jest.fn(), save: jest.fn() } as any,
      { update: jest.fn() } as any,
      { getProjectWorkspacePrefs: jest.fn(), getOne: jest.fn() } as any,
      { getProjectFieldPermissions: jest.fn() } as any,
      { getOne: jest.fn() } as any,
      { getRepository: jest.fn(), transaction: jest.fn() } as any,
    );

    return { service, repository };
  };

  it("发起结项审批前要求至少存在一条成功上线单", async () => {
    const { service } = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "p1",
      closeSummary: "验收通过",
      closeDeliverables: "交付清单",
      closeReview: "项目复盘",
      acceptanceDate: "2026-04-21",
    } as any);
    (service as any).goLiveRecordRepository = {
      count: jest.fn().mockResolvedValue(0),
    };
    (service as any).acceptanceRecordRepository = {
      count: jest.fn().mockResolvedValue(1),
    };

    await expect(service.validateClosePlan("p1")).rejects.toThrow(
      new BadRequestException("发起结项审批前，请至少维护一条已成功的上线记录"),
    );
  });

  it("发起结项审批前要求至少存在一条已通过验收单", async () => {
    const { service } = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "p1",
      closeSummary: "验收通过",
      closeDeliverables: "交付清单",
      closeReview: "项目复盘",
      acceptanceDate: "2026-04-21",
    } as any);
    (service as any).goLiveRecordRepository = {
      count: jest.fn().mockResolvedValue(1),
    };
    (service as any).acceptanceRecordRepository = {
      count: jest.fn().mockResolvedValue(0),
    };

    await expect(service.validateClosePlan("p1")).rejects.toThrow(
      new BadRequestException("发起结项审批前，请至少维护一条已通过的验收记录"),
    );
  });

  it("归档前要求至少存在一条已确认的运维交接单", async () => {
    const { service, repository } = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "p1",
      status: "6",
      closeSummary: "验收通过",
      closeDeliverables: "交付清单",
      closeReview: "项目复盘",
      acceptanceDate: "2026-04-21",
    } as any);
    repository.update.mockResolvedValue({ affected: 1 });
    (service as any).goLiveRecordRepository = {
      count: jest.fn().mockResolvedValue(1),
    };
    (service as any).acceptanceRecordRepository = {
      count: jest.fn().mockResolvedValue(1),
    };
    (service as any).handoverRecordRepository = {
      count: jest.fn().mockResolvedValue(0),
    };

    await expect(service.archive("p1")).rejects.toThrow(
      new BadRequestException("归档前，请至少维护一条已确认的运维交接记录"),
    );
  });
});
