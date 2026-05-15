import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SystemScheduledJobConfig } from "./entity";
import { SystemScheduledJobExecutionLog } from "./log.entity";
import { SystemScheduledJobsService } from "./service";
import { SystemScheduledJobsController } from "./controller";
import { TasksBusiModule } from "src/modulesBusi/tasks/module";
import { ProjectsModule } from "src/modulesBusi/projects/module";
import { SysFileModule } from "src/modules/sys/file/module";
import { ArticleBorrowsModule } from "src/modulesBusi/articleBorrows/module";
import { Menu } from "src/modules/menus/menu.entity";
import { MenuSyncService } from "./menu-sync.service";
import { MessagesModule } from "../messages/module";
import { ExternalNotifyModule } from "../external-notify/module";
import { NotificationScheduledJobsService } from "./notification-jobs.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemScheduledJobConfig,
      SystemScheduledJobExecutionLog,
      Menu,
    ]),
    forwardRef(() => TasksBusiModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => SysFileModule),
    forwardRef(() => ArticleBorrowsModule),
    forwardRef(() => MessagesModule),
    forwardRef(() => ExternalNotifyModule),
  ],
  providers: [
    SystemScheduledJobsService,
    MenuSyncService,
    NotificationScheduledJobsService,
  ],
  controllers: [SystemScheduledJobsController],
  exports: [SystemScheduledJobsService],
})
export class SystemScheduledJobsModule {}
