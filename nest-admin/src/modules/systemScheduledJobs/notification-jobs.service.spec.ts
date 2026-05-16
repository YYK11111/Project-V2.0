import { NotificationScheduledJobsService } from "./notification-jobs.service";

describe("NotificationScheduledJobsService", () => {
  function createService() {
    const systemScheduledJobsService = {
      isJobEnabled: jest.fn().mockResolvedValue(true),
      runJob: jest
        .fn()
        .mockImplementation(async (_jobKey, _triggerMode, handler) =>
          handler(),
        ),
    };
    const externalNotifyService = {
      retryPendingWorkflowTodoCardStatuses: jest.fn().mockResolvedValue({
        processedCount: 1,
        successCount: 1,
        failedCount: 0,
      }),
    };
    const messagesService = {
      cleanupExpiredMessages: jest.fn(),
    };
    const service = new NotificationScheduledJobsService(
      systemScheduledJobsService as never,
      externalNotifyService as never,
      messagesService as never,
    );
    return { service, systemScheduledJobsService, externalNotifyService };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("手动补偿时会强制处理待补偿日志", async () => {
    const { service, externalNotifyService } = createService();

    const result = await service.runRetryPendingDelivery(true);

    expect(
      externalNotifyService.retryPendingWorkflowTodoCardStatuses,
    ).toHaveBeenCalledWith({
      limit: 100,
      force: true,
    });
    expect(result).toEqual({
      processedCount: 1,
      successCount: 1,
      failedCount: 0,
    });
  });

  it("定时补偿时仍按默认方式执行", async () => {
    const { service, externalNotifyService } = createService();

    await service.runRetryPendingDelivery();

    expect(
      externalNotifyService.retryPendingWorkflowTodoCardStatuses,
    ).toHaveBeenCalledWith({
      limit: 100,
      force: false,
    });
  });
});
