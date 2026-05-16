import { SystemScheduledJobsController } from "./controller";

describe("SystemScheduledJobsController", () => {
  it("手动运行通知补偿任务时应启用强制补偿", async () => {
    const service = {
      listJobs: jest.fn(),
      listLogs: jest.fn(),
      getLogDetail: jest.fn(),
      setJobEnabled: jest.fn(),
      runJob: jest.fn().mockImplementation(async (_jobKey, _triggerMode, handler) => handler()),
    };
    const tasksService = {
      scanDueSoonTaskReminders: jest.fn(),
      scanOverdueTaskReminders: jest.fn(),
      scanStaleReportTaskReminders: jest.fn(),
    };
    const projectsService = {
      generateCockpitSnapshots: jest.fn(),
    };
    const sysFileService = {
      cleanupOrphanFiles: jest.fn(),
    };
    const articleBorrowsService = {
      syncExpiredBorrows: jest.fn(),
    };
    const notificationScheduledJobsService = {
      runRetryPendingDelivery: jest.fn().mockResolvedValue({
        processedCount: 2,
        successCount: 2,
        failedCount: 0,
      }),
      runCleanupMessages: jest.fn(),
      runCleanupDeliveryLogs: jest.fn(),
    };
    const controller = new SystemScheduledJobsController(
      service as never,
      tasksService as never,
      projectsService as never,
      sysFileService as never,
      articleBorrowsService as never,
      notificationScheduledJobsService as never,
    );

    await expect(
      controller.run("notifications.retryPendingDelivery", {
        user: { id: "u1", name: "管理员" },
      } as never),
    ).resolves.toEqual(
      expect.objectContaining({
        processedCount: 2,
        successCount: 2,
        failedCount: 0,
      }),
    );
    expect(notificationScheduledJobsService.runRetryPendingDelivery).toHaveBeenCalledWith(true);
  });
});
