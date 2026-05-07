import { scheduledJobRegistry } from "src/common/scheduler/job-registry";
import { getMetadataArgsStorage } from "typeorm";
import { SystemScheduledJobsService } from "./service";
import { SystemScheduledJobConfig } from "./entity";
import { SystemScheduledJobExecutionLog } from "./log.entity";

describe("scheduled job registry", () => {
  it("注册现有 cron 任务元数据", () => {
    expect(Array.isArray(scheduledJobRegistry)).toBe(true);
    expect(scheduledJobRegistry.map((item) => item.jobKey)).toEqual(
      expect.arrayContaining([
        "tasks.dueSoonReminder",
        "tasks.overdueReminder",
        "tasks.reportStaleReminder",
        "projects.dailyCockpitSnapshots",
        "sysFile.orphanCleanup",
        "articleBorrows.syncExpired",
      ]),
    );
    expect(scheduledJobRegistry).toHaveLength(6);
    expect(scheduledJobRegistry).toContainEqual(
      expect.objectContaining({
        jobKey: "tasks.dueSoonReminder",
        jobType: "cron",
        module: "tasks",
        scheduleExpression: "0 0 9 * * *",
      }),
    );
  });

  it("声明任务配置表与执行日志表", () => {
    const config = new SystemScheduledJobConfig({
      jobKey: "tasks.dueSoonReminder",
      enabled: "1",
    });
    const log = new SystemScheduledJobExecutionLog({
      jobKey: "tasks.dueSoonReminder",
      triggerMode: "manual",
      processedCount: 1,
      payload: { source: "test" },
    });
    const tableNames = getMetadataArgsStorage()
      .tables.filter(
        (item) =>
          item.target === SystemScheduledJobConfig ||
          item.target === SystemScheduledJobExecutionLog,
      )
      .map((item) => item.name);

    expect(SystemScheduledJobConfig).toBeDefined();
    expect(SystemScheduledJobExecutionLog).toBeDefined();
    expect(tableNames).toEqual(
      expect.arrayContaining(["system_job_config", "system_job_execution_log"]),
    );
    expect(config).toMatchObject({
      jobKey: "tasks.dueSoonReminder",
      enabled: "1",
    });
    expect(log).toMatchObject({
      jobKey: "tasks.dueSoonReminder",
      triggerMode: "manual",
      processedCount: 1,
      payload: { source: "test" },
    });
  });
});

describe("SystemScheduledJobsService", () => {
  function createService() {
    const configRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const logRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = new SystemScheduledJobsService(
      configRepository as never,
      logRepository as never,
      {
        scanDueSoonTaskReminders: jest.fn().mockResolvedValue({}),
        scanOverdueTaskReminders: jest.fn().mockResolvedValue({}),
        scanStaleReportTaskReminders: jest.fn().mockResolvedValue({}),
      } as never,
      {
        generateCockpitSnapshots: jest.fn().mockResolvedValue({}),
      } as never,
      {
        cleanupOrphanFiles: jest.fn().mockResolvedValue({}),
      } as never,
      {
        syncExpiredBorrows: jest.fn().mockResolvedValue(0),
      } as never,
    );

    return { service, configRepository, logRepository };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("合并注册表和配置生成任务清单", async () => {
    const { service, configRepository, logRepository } = createService();
    configRepository.find.mockResolvedValue([
      {
        jobKey: "tasks.dueSoonReminder",
        enabled: "0",
        lastOperatorId: "u1",
        lastOperatorName: "管理员",
      },
    ]);
    logRepository.find.mockResolvedValue([
      {
        jobKey: "tasks.dueSoonReminder",
        endTime: "2026-05-01 09:00:00",
        status: "success",
      },
    ]);

    const result = await service.listJobs();

    expect(
      result.some(
        (item) =>
          item.jobKey === "tasks.dueSoonReminder" &&
          item.enabled === "0" &&
          item.lastRunTime === "2026-05-01 09:00:00" &&
          item.lastStatus === "success",
      ),
    ).toBe(true);
    expect(
      result.some(
        (item) =>
          item.jobKey === "tasks.overdueReminder" && item.enabled === "1",
      ),
    ).toBe(true);
  });

  it("启用与停用任务会保存配置状态", async () => {
    const { service, configRepository } = createService();

    await service.setJobEnabled("tasks.dueSoonReminder", "0", {
      id: "u1",
      name: "管理员",
    } as never);

    expect(configRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        jobKey: "tasks.dueSoonReminder",
        enabled: "0",
        lastOperatorId: "u1",
        lastOperatorName: "管理员",
      }),
    );
  });

  it("已有配置且状态未变化时直接返回当前配置", async () => {
    const { service, configRepository } = createService();
    const currentConfig = {
      id: "cfg-1",
      jobKey: "tasks.dueSoonReminder",
      enabled: "0",
      lastOperatorId: "u0",
      lastOperatorName: "旧管理员",
    };
    configRepository.findOne.mockResolvedValue(currentConfig);

    const result = await service.setJobEnabled("tasks.dueSoonReminder", "0", {
      id: "u1",
      name: "管理员",
    } as never);

    expect(result).toBe(currentConfig);
    expect(configRepository.save).not.toHaveBeenCalled();
  });

  it("无配置且目标状态为默认启用时返回默认态视图", async () => {
    const { service, configRepository } = createService();

    const result = await service.setJobEnabled("tasks.dueSoonReminder", "1", {
      id: "u1",
      name: "管理员",
    } as never);

    expect(result).toMatchObject({
      jobKey: "tasks.dueSoonReminder",
      enabled: "1",
      lastOperatorId: "",
      lastOperatorName: "",
    });
    expect(configRepository.save).not.toHaveBeenCalled();
  });

  it("isJobEnabled 在无配置时返回启用且停用配置时返回关闭", async () => {
    const { service, configRepository } = createService();

    await expect(service.isJobEnabled("tasks.dueSoonReminder")).resolves.toBe(
      true,
    );

    configRepository.findOne.mockResolvedValue({
      jobKey: "tasks.dueSoonReminder",
      enabled: "0",
    });

    await expect(service.isJobEnabled("tasks.dueSoonReminder")).resolves.toBe(
      false,
    );
  });

  it("runJob 会先写入 running 日志并在成功后更新为 success", async () => {
    const { service, logRepository } = createService();
    const runningLog = {
      id: "log-1",
      jobKey: "tasks.dueSoonReminder",
      status: "running",
    };
    logRepository.find = jest.fn();
    (logRepository as any).save = jest
      .fn()
      .mockResolvedValueOnce(runningLog)
      .mockImplementationOnce(async (value) => value);

    const result = await service.runJob(
      "tasks.dueSoonReminder",
      "scheduled",
      async () => ({
        summary: "扫描完成",
        processedCount: 3,
        successCount: 3,
      }),
    );

    expect(result).toEqual({
      summary: "扫描完成",
      processedCount: 3,
      successCount: 3,
    });
    expect((logRepository as any).save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        jobKey: "tasks.dueSoonReminder",
        triggerMode: "scheduled",
        status: "running",
        startTime: expect.any(String),
      }),
    );
    expect((logRepository as any).save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: "log-1",
        status: "success",
        summary: "扫描完成",
        processedCount: 3,
        successCount: 3,
        failedCount: 0,
        endTime: expect.any(String),
      }),
    );
  });

  it("runJob 失败时更新 failure 日志并抛出原错误", async () => {
    const { service, logRepository } = createService();
    const runningLog = {
      id: "log-2",
      jobKey: "tasks.overdueReminder",
      status: "running",
    };
    const error = new Error("执行失败");
    (logRepository as any).save = jest
      .fn()
      .mockResolvedValueOnce(runningLog)
      .mockImplementationOnce(async (value) => value);

    await expect(
      service.runJob("tasks.overdueReminder", "scheduled", async () => {
        throw error;
      }),
    ).rejects.toThrow("执行失败");

    expect((logRepository as any).save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: "log-2",
        status: "failure",
        errorMessage: "执行失败",
        errorStack: expect.any(String),
        failedCount: 1,
        endTime: expect.any(String),
      }),
    );
  });

  it("getLogDetail 按 id 返回完整日志详情", async () => {
    const { service, logRepository } = createService();
    logRepository.findOne.mockResolvedValue({
      id: "log-1",
      jobKey: "sysFile.orphanCleanup",
      summary: "清理 3 个文件",
      processedCount: 3,
      successCount: 3,
      failedCount: 0,
      errorMessage: "",
      errorStack: "",
      payload: { totalSize: 2048 },
      operatorId: "u1",
      operatorName: "管理员",
    });

    await expect(service.getLogDetail("log-1")).resolves.toMatchObject({
      id: "log-1",
      jobKey: "sysFile.orphanCleanup",
      payload: { totalSize: 2048 },
      operatorName: "管理员",
    });
    expect(logRepository.findOne).toHaveBeenCalledWith({
      where: { id: "log-1" },
    });
  });

  it("getLogDetail 在日志不存在时抛 NotFoundException", async () => {
    const { service, logRepository } = createService();
    logRepository.findOne.mockResolvedValue(null);

    await expect(service.getLogDetail("missing-log")).rejects.toThrow(
      "日志不存在",
    );
  });
});
