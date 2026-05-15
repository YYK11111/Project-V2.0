import { Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { SystemScheduledJobsService } from "./service";
import { TasksService } from "src/modulesBusi/tasks/service";
import { ProjectsService } from "src/modulesBusi/projects/service";
import { SysFileService } from "src/modules/sys/file/service";
import { ArticleBorrowsService } from "src/modulesBusi/articleBorrows/service";
import { NotificationScheduledJobsService } from "./notification-jobs.service";

@Controller("system/scheduled-jobs")
export class SystemScheduledJobsController {
  constructor(
    private readonly service: SystemScheduledJobsService,
    private readonly tasksService: TasksService,
    private readonly projectsService: ProjectsService,
    private readonly sysFileService: SysFileService,
    private readonly articleBorrowsService: ArticleBorrowsService,
    private readonly notificationScheduledJobsService: NotificationScheduledJobsService,
  ) {}

  @Get("list")
  list() {
    return this.service.listJobs();
  }

  @Get("logs")
  logs(
    @Query()
    query: {
      jobKey?: string;
      module?: string;
      status?: string;
    },
  ) {
    return this.service.listLogs(query);
  }

  @Get("logs/:id")
  logDetail(@Param("id") id: string) {
    return this.service.getLogDetail(id);
  }

  @Post("enable/:jobKey")
  enable(
    @Param("jobKey") jobKey: string,
    @Req() req: { user?: { id?: string; name?: string } },
  ) {
    return this.service.setJobEnabled(jobKey, "1", req.user || {});
  }

  @Post("disable/:jobKey")
  disable(
    @Param("jobKey") jobKey: string,
    @Req() req: { user?: { id?: string; name?: string } },
  ) {
    return this.service.setJobEnabled(jobKey, "0", req.user || {});
  }

  @Post("run/:jobKey")
  run(
    @Param("jobKey") jobKey: string,
    @Req() req: { user?: { id?: string; name?: string } },
  ) {
    const handlers: Record<string, () => Promise<any>> = {
      "tasks.dueSoonReminder": async () => {
        await this.tasksService.scanDueSoonTaskReminders();
        return { summary: "手工执行任务即将到期提醒扫描" };
      },
      "tasks.overdueReminder": async () => {
        await this.tasksService.scanOverdueTaskReminders();
        return { summary: "手工执行任务逾期提醒扫描" };
      },
      "tasks.reportStaleReminder": async () => {
        await this.tasksService.scanStaleReportTaskReminders();
        return { summary: "手工执行任务未汇报提醒扫描" };
      },
      "projects.dailyCockpitSnapshots": async () => {
        const result = await this.projectsService.generateCockpitSnapshots();
        return {
          summary: `生成 ${Number(result?.total || 0)} 个项目快照`,
          processedCount: Number(result?.total || 0),
          successCount: Number(result?.total || 0),
          failedCount: 0,
        };
      },
      "sysFile.orphanCleanup": async () => {
        const result = await this.sysFileService.cleanupOrphanFiles(24);
        return {
          summary: `清理 ${Number(result?.deletedCount || 0)} 个文件`,
          processedCount: Number(result?.deletedCount || 0),
          successCount: Number(result?.deletedCount || 0),
          failedCount: 0,
          payload: {
            totalSize: Number(result?.totalSize || 0),
          },
        };
      },
      "articleBorrows.syncExpired": async () => {
        await this.articleBorrowsService.syncExpiredBorrows();
        return { summary: "手工执行借阅过期同步", failedCount: 0 };
      },
      "notifications.retryPendingDelivery": async () => {
        const result =
          await this.notificationScheduledJobsService.runRetryPendingDelivery();
        return {
          ...result,
          summary: `补偿 ${Number(result?.processedCount || 0)} 条通知投递`,
        };
      },
      "notifications.cleanupMessages": async () => {
        const result =
          await this.notificationScheduledJobsService.runCleanupMessages();
        return {
          ...result,
          summary: `清理 ${Number(result?.processedCount || 0)} 条系统消息`,
        };
      },
      "notifications.cleanupDeliveryLogs": async () => {
        const result =
          await this.notificationScheduledJobsService.runCleanupDeliveryLogs();
        return {
          ...result,
          summary: `清理 ${Number(result?.processedCount || 0)} 条通知投递日志`,
        };
      },
    };

    const handler = handlers[jobKey];
    if (!handler) {
      throw new Error("任务不存在");
    }
    return this.service.runJob(jobKey, "manual", handler);
  }
}
