import { CustomerViewerTimeoutService } from "./customer-viewer-timeout.service";

describe("CustomerViewerTimeoutService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-16T08:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("应将已过期的临时授权按 id 集合禁用", async () => {
    const viewerRepository = {
      find: jest.fn().mockResolvedValue([{ id: "v1" }, { id: "v2" }]),
      update: jest.fn().mockResolvedValue({ affected: 2 }),
    };
    const service = new CustomerViewerTimeoutService(
      viewerRepository as never,
      {} as never,
    );

    await service.handleViewerExpiration();

    expect(viewerRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "1",
          grantType: "temporary",
          isDelete: null,
        }),
      }),
    );
    expect(viewerRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.objectContaining({
          _type: "in",
          _value: ["v1", "v2"],
        }),
      }),
      expect.objectContaining({
        status: "0",
        updateUser: "system",
      }),
    );
  });

  it("应查询未来到期的临时授权区间", async () => {
    const viewerRepository = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    const service = new CustomerViewerTimeoutService(
      viewerRepository as never,
      {} as never,
    );

    await service.getExpiringViewers(7);

    expect(viewerRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "1",
          grantType: "temporary",
          endTime: expect.objectContaining({
            _type: "between",
          }),
        }),
      }),
    );
  });
});
