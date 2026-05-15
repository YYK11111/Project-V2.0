import { Global, Module, forwardRef } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { LoginLogsModule } from "../loginLogs/module";
import { MenusModule } from "../menus/menus.module";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "src/modulesBusi/projects/entity";
import { WorkflowModule } from "src/modulesBusi/workflow/module";
import { MilestonesModule } from "src/modulesBusi/milestones/module";
import { ProjectsModule } from "src/modulesBusi/projects/module";
import { Task } from "src/modulesBusi/tasks/entity";
import { Ticket } from "src/modulesBusi/tickets/entity";
import { ProjectChange } from "src/modulesBusi/changes/entity";
import { Customer } from "src/modulesBusi/crm/customers/entity";
import { GoLiveRecord } from "src/modulesBusi/go-live-records/entity";
import { AcceptanceRecord } from "src/modulesBusi/acceptance-records/entity";
import { HandoverRecord } from "src/modulesBusi/handover-records/entity";
import { SystenConfigsModule } from "../configs/module";
import { CrmModule } from "src/modulesBusi/crm/module";
import { BusinessApprovalContextsModule } from "src/modulesBusi/approval-contexts/module";
import { ArticleBorrow } from "src/modulesBusi/articleBorrows/entity";
import { TasksModule } from "src/common/tasks/tasks.module";

@Global()
@Module({
  imports: [
    LoginLogsModule,
    MenusModule,
    SystenConfigsModule,
    TypeOrmModule.forFeature([
      Project,
      Task,
      Ticket,
      ProjectChange,
      Customer,
      GoLiveRecord,
      AcceptanceRecord,
      HandoverRecord,
      ArticleBorrow,
    ]),
    TasksModule,
    WorkflowModule,
    MilestonesModule,
    CrmModule,
    BusinessApprovalContextsModule,
    forwardRef(() => ProjectsModule),
  ],
  controllers: [],
  providers: [RedisService, WorkflowIntegrationService],
  exports: [RedisService, WorkflowIntegrationService],
})
export class GlobalModule {}
