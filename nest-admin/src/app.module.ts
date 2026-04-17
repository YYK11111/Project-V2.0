import { Dependencies, Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MenusModule } from './modules/menus/menus.module'
import { UsersModule } from './modules/users/users.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { database } from 'config'
import { CommonModule } from './modules/common/common.module'
import { AuthModule } from './modules/auth/auth.module'
import { DepstModule } from './modules/depts/depts.module'
import { RolesModule } from './modules/roles/module'
import { NoticesModule } from './modules/notices/module'
import { SystenConfigsModule } from './modules/configs/module'
import { LoginLogsModule } from './modules/loginLogs/module'
import { GlobalModule } from './modules/global/global.module'
import { ArticlesModule } from './modulesBusi/articles/module'
import { ArticleCatalogsModule } from './modulesBusi/articleCatalogs/module'
import { ArticleTagsModule } from './modulesBusi/articleTags/module'
import { ArticleBorrowsModule } from './modulesBusi/articleBorrows/module'
import { ProjectsModule } from './modulesBusi/projects/module'
import { ProjectMembersModule } from './modulesBusi/project-members/module'
import { TasksBusiModule } from './modulesBusi/tasks/module'
import { TaskCommentsModule } from './modulesBusi/task-comments/module'
import { TicketsModule } from './modulesBusi/tickets/module'
import { DocumentsModule } from './modulesBusi/documents/module'
import { WorkflowModule } from './modulesBusi/workflow/module'
import { ScheduleModule } from '@nestjs/schedule'
import { TasksModule } from './common/tasks/tasks.module'
import { HttpModule } from './common/http/module'
import { AiModule } from './modulesAi/ai/module'
import { SystemLogModule } from './modules/systemLog/module'
import { CrmModule } from './modulesBusi/crm/module'
import { MilestonesModule } from './modulesBusi/milestones/module'
import { RisksModule } from './modulesBusi/risks/module'
import { SprintsModule } from './modulesBusi/sprints/module'
import { ChangesModule } from './modulesBusi/changes/module'
import { SysFileModule } from './modules/sys/file/module'
import { WorkflowTriggerModule } from './common/listeners/workflow-trigger.module'
import { MessagesModule } from './modules/messages/module'

@Dependencies(DataSource)
@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: database }),
    ScheduleModule.forRoot(),
    TasksModule,
    HttpModule,
    MenusModule,
    UsersModule,
    CommonModule,
    AuthModule,
    DepstModule,
    RolesModule,
    NoticesModule,
    SystenConfigsModule,
    LoginLogsModule,
    GlobalModule,
    ArticlesModule,
    ArticleCatalogsModule,
    ArticleTagsModule,
    ArticleBorrowsModule,
    ProjectsModule,
    ProjectMembersModule,
    TasksBusiModule,
    TaskCommentsModule,
    TicketsModule,
    DocumentsModule,
    WorkflowModule,
    AiModule,
    SystemLogModule,
    CrmModule,
    MilestonesModule,
    RisksModule,
    SprintsModule,
    ChangesModule,
    SysFileModule,
    WorkflowTriggerModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) { }
}
