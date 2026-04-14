import { Global, Module, forwardRef } from '@nestjs/common'
import { RedisService } from './redis.service'
import { LoginLogsModule } from '../loginLogs/module'
import { MenusModule } from '../menus/menus.module'
import { WorkflowIntegrationService } from 'src/common/services/workflow-integration.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from 'src/modulesBusi/projects/entity'
import { WorkflowModule } from 'src/modulesBusi/workflow/module'
import { MilestonesModule } from 'src/modulesBusi/milestones/module'
import { ProjectsModule } from 'src/modulesBusi/projects/module'
import { Task } from 'src/modulesBusi/tasks/entity'
import { Ticket } from 'src/modulesBusi/tickets/entity'
import { ProjectChange } from 'src/modulesBusi/changes/entity'
import { Customer } from 'src/modulesBusi/crm/customers/entity'

@Global()
@Module({
  imports: [LoginLogsModule, MenusModule, TypeOrmModule.forFeature([Project, Task, Ticket, ProjectChange, Customer]), WorkflowModule, MilestonesModule, forwardRef(() => ProjectsModule)],
  controllers: [],
  providers: [RedisService, WorkflowIntegrationService],
  exports: [RedisService, WorkflowIntegrationService],
})
export class GlobalModule {}
