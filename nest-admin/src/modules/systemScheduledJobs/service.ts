import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { scheduledJobRegistry } from "src/common/scheduler/job-registry";
import { SystemScheduledJobConfig } from "./entity";
import { SystemScheduledJobExecutionLog } from "./log.entity";

type JobLogQuery = {
  jobKey?: string;
  module?: string;
  status?: string;
};

type JobOperator = {
  id?: string;
  name?: string;
};

type JobTriggerMode = "scheduled" | "manual";

type JobExecutionResult = {
  summary?: string;
  processedCount?: number;
  successCount?: number;
  failedCount?: number;
  payload?: Record<string, unknown>;
};

@Injectable()
export class SystemScheduledJobsService {
  constructor(
    @InjectRepository(SystemScheduledJobConfig)
    private configRepository: Repository<SystemScheduledJobConfig>,
    @InjectRepository(SystemScheduledJobExecutionLog)
    private logRepository: Repository<SystemScheduledJobExecutionLog>,
  ) {}

  async listJobs() {
    const [configs, logs] = await Promise.all([
      this.configRepository.find(),
      this.logRepository.find({
        order: { createTime: "DESC" as never },
      }),
    ]);
    const configMap = new Map(configs.map((item) => [item.jobKey, item]));
    const latestLogMap = new Map<string, SystemScheduledJobExecutionLog>();

    logs.forEach((item) => {
      if (!item?.jobKey || latestLogMap.has(item.jobKey)) {
        return;
      }
      latestLogMap.set(item.jobKey, item);
    });

    return scheduledJobRegistry.map((item) => {
      const config = configMap.get(item.jobKey);
      const log = latestLogMap.get(item.jobKey);

      return {
        ...item,
        enabled: config?.enabled || "1",
        lastOperatorId: config?.lastOperatorId || "",
        lastOperatorName: config?.lastOperatorName || "",
        lastRunTime: log?.endTime || log?.startTime || "",
        lastStatus: log?.status || "",
      };
    });
  }

  async listLogs(query: JobLogQuery = {}) {
    return this.logRepository.find({
      where: {
        jobKey: query.jobKey || undefined,
        module: query.module || undefined,
        status: query.status || undefined,
      },
      order: { createTime: "DESC" as never },
    });
  }

  async getLogDetail(id: string) {
    const log = await this.logRepository.findOne({
      where: { id },
    });
    if (!log) {
      throw new NotFoundException("日志不存在");
    }
    return log;
  }

  async isJobEnabled(jobKey: string) {
    const config = await this.configRepository.findOne({ where: { jobKey } });
    return config?.enabled !== "0";
  }

  async runJob<T extends JobExecutionResult>(
    jobKey: string,
    triggerMode: JobTriggerMode,
    handler: () => Promise<T>,
  ) {
    const job = scheduledJobRegistry.find((item) => item.jobKey === jobKey);
    if (!job) {
      throw new NotFoundException("任务不存在");
    }

    const startTime = new Date();
    const runningLog = await this.logRepository.save(
      new SystemScheduledJobExecutionLog({
        jobKey: job.jobKey,
        jobName: job.jobName,
        jobType: job.jobType,
        module: job.module,
        triggerMode,
        startTime: startTime.toISOString(),
        status: "running",
      }),
    );

    try {
      const result = await handler();
      const endTime = new Date();
      await this.logRepository.save(
        new SystemScheduledJobExecutionLog({
          ...runningLog,
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "success",
          summary: result?.summary || "",
          processedCount: Number(result?.processedCount || 0),
          successCount: Number(result?.successCount || 0),
          failedCount: Number(result?.failedCount || 0),
          payload: result?.payload,
        }),
      );
      return result;
    } catch (error) {
      const endTime = new Date();
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack || "" : "";
      await this.logRepository.save(
        new SystemScheduledJobExecutionLog({
          ...runningLog,
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "failure",
          errorMessage,
          errorStack,
          failedCount: 1,
        }),
      );
      throw error;
    }
  }

  async setJobEnabled(jobKey: string, enabled: string, operator: JobOperator) {
    const job = scheduledJobRegistry.find((item) => item.jobKey === jobKey);
    if (!job) {
      throw new NotFoundException("任务不存在");
    }

    const currentConfig = await this.configRepository.findOne({
      where: { jobKey },
    });
    if (currentConfig?.enabled === enabled) {
      return currentConfig;
    }
    if (!currentConfig && enabled === "1") {
      return {
        ...job,
        enabled: "1",
        lastOperatorId: "",
        lastOperatorName: "",
        lastRunTime: "",
        lastStatus: "",
      };
    }

    const nextConfig = new SystemScheduledJobConfig({
      ...(currentConfig || {}),
      jobKey,
      enabled,
      lastOperatorId: operator?.id || "",
      lastOperatorName: operator?.name || "",
    });

    return this.configRepository.save(nextConfig);
  }
}
