import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ExternalNotifyService } from "src/modules/external-notify/service";
import { MessagesService } from "src/modules/messages/service";
import { SystemScheduledJobsService } from "./service";

@Injectable()
export class NotificationScheduledJobsService {
  constructor(
    private readonly systemScheduledJobsService: SystemScheduledJobsService,
    private readonly externalNotifyService: ExternalNotifyService,
    private readonly messagesService: MessagesService,
  ) {}

  @Cron("0 */5 * * * *")
  async retryPendingDelivery(force = false) {
    if (
      !(await this.systemScheduledJobsService.isJobEnabled(
        "notifications.retryPendingDelivery",
      ))
    ) {
      return;
    }
    await this.systemScheduledJobsService.runJob(
      "notifications.retryPendingDelivery",
      "scheduled",
      () => this.runRetryPendingDelivery(force),
    );
  }

  @Cron("0 30 2 * * *")
  async cleanupMessages() {
    if (
      !(await this.systemScheduledJobsService.isJobEnabled(
        "notifications.cleanupMessages",
      ))
    ) {
      return;
    }
    await this.systemScheduledJobsService.runJob(
      "notifications.cleanupMessages",
      "scheduled",
      () => this.runCleanupMessages(),
    );
  }

  @Cron("0 40 2 * * *")
  async cleanupDeliveryLogs() {
    if (
      !(await this.systemScheduledJobsService.isJobEnabled(
        "notifications.cleanupDeliveryLogs",
      ))
    ) {
      return;
    }
    await this.systemScheduledJobsService.runJob(
      "notifications.cleanupDeliveryLogs",
      "scheduled",
      () => this.runCleanupDeliveryLogs(),
    );
  }

  runRetryPendingDelivery(force = false) {
    return this.externalNotifyService.retryPendingWorkflowTodoCardStatuses({
      limit: 100,
      force,
    });
  }

  runCleanupMessages() {
    return this.messagesService.cleanupExpiredMessages({
      retentionDays: 180,
      limit: 1000,
    });
  }

  runCleanupDeliveryLogs() {
    return this.externalNotifyService.cleanupDeliveryLogs({
      succeededDays: 90,
      failedDays: 180,
    });
  }
}
