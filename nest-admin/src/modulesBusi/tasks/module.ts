import { Module, forwardRef } from "@nestjs/common";
import { TasksService } from "./service";
import { TasksController } from "./controller";
import { Task } from "./entity";
import { TaskDependency } from "./entities/task-dependency.entity";
import { TaskTimeLog } from "./entities/task-time-log.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectsModule } from "../projects/module";
import { SysFileModule } from "src/modules/sys/file/module";
import { User } from "src/modules/users/entities/user.entity";
import { TaskComment } from "../task-comments/entity";
import { Milestone } from "../milestones/entity";
import { UserStory } from "../projects/entities/user-story.entity";
import { Risk } from "../risks/entity";
import { Ticket } from "../tickets/entity";
import { TaskDelayRecord } from "./entities/task-delay-record.entity";
import { MessagesModule } from "src/modules/messages/module";
import { SystemScheduledJobsModule } from "src/modules/systemScheduledJobs/module";
import { BusinessApprovalContextsModule } from "../approval-contexts/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskDependency,
      TaskTimeLog,
      TaskComment,
      User,
      Milestone,
      UserStory,
      Risk,
      Ticket,
      TaskDelayRecord,
    ]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => SysFileModule),
    MessagesModule,
    forwardRef(() => SystemScheduledJobsModule),
    BusinessApprovalContextsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksBusiModule {}
