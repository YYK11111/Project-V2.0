export type ScheduledJobRegistryItem = {
  jobKey: string;
  jobName: string;
  jobType: "cron";
  module: string;
  description: string;
  scheduleExpression: string;
  supportsManualRun: boolean;
  sourceMode: "static";
  owner: string;
};

export const scheduledJobRegistry: ScheduledJobRegistryItem[] = [
  {
    jobKey: "tasks.dueSoonReminder",
    jobName: "任务即将到期提醒扫描",
    jobType: "cron",
    module: "tasks",
    description: "扫描距离截止时间 3 天内的任务并发送提醒。",
    scheduleExpression: "0 0 9 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "TasksService",
  },
  {
    jobKey: "tasks.overdueReminder",
    jobName: "任务逾期提醒扫描",
    jobType: "cron",
    module: "tasks",
    description: "扫描已逾期任务并发送待办提醒。",
    scheduleExpression: "0 5 9 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "TasksService",
  },
  {
    jobKey: "tasks.reportStaleReminder",
    jobName: "任务未汇报提醒扫描",
    jobType: "cron",
    module: "tasks",
    description: "扫描最近 2 天缺少汇报的任务并发送待办提醒。",
    scheduleExpression: "0 10 9 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "TasksService",
  },
  {
    jobKey: "projects.dailyCockpitSnapshots",
    jobName: "项目驾驶舱快照生成",
    jobType: "cron",
    module: "projects",
    description: "每日生成项目驾驶舱快照。",
    scheduleExpression: "0 0 2 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "ProjectsService",
  },
  {
    jobKey: "sysFile.orphanCleanup",
    jobName: "孤儿文件清理",
    jobType: "cron",
    module: "sysFile",
    description: "清理超过 24 小时未关联业务的孤儿文件。",
    scheduleExpression: "0 0 2 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "SysFileService",
  },
  {
    jobKey: "articleBorrows.syncExpired",
    jobName: "借阅过期同步",
    jobType: "cron",
    module: "articleBorrows",
    description: "同步更新已到期的知识借阅记录。",
    scheduleExpression: "0 */5 * * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "ArticleBorrowsService",
  },
  {
    jobKey: "notifications.retryPendingDelivery",
    jobName: "通知待处理投递补偿",
    jobType: "cron",
    module: "notifications",
    description: "补偿飞书卡片状态等待处理通知投递。",
    scheduleExpression: "0 */5 * * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "NotificationScheduledJobsService",
  },
  {
    jobKey: "notifications.cleanupMessages",
    jobName: "系统消息清理",
    jobType: "cron",
    module: "notifications",
    description: "清理过期已读待阅和已失效待办消息。",
    scheduleExpression: "0 30 2 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "NotificationScheduledJobsService",
  },
  {
    jobKey: "notifications.cleanupDeliveryLogs",
    jobName: "通知投递日志清理",
    jobType: "cron",
    module: "notifications",
    description: "清理过期成功、跳过和失败通知投递日志。",
    scheduleExpression: "0 40 2 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "NotificationScheduledJobsService",
  },
];
