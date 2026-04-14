import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowService } from './service';
import { WorkflowController } from './controller';
import { WorkflowDefinition } from './entity/workflow-definition.entity';
import { WorkflowInstance } from './entity/workflow-instance.entity';
import { WorkflowTask } from './entity/workflow-task.entity';
import { WorkflowHistory } from './entity/workflow-history.entity';
import { WorkflowBusinessConfig } from './entity/workflow-business-config.entity';
import { WfFieldMapping } from './entity/wf-field-mapping.entity';
import { WorkflowDataLoaderService } from './workflow-data-loader.service';
import { WorkflowAssigneeResolverService } from '../../common/services/workflow-assignee-resolver.service';
import { BusinessFieldService } from '../../common/services/business-field.service';
import { ProjectLoader } from './loaders/project.loader';
import { CustomerLoader } from './loaders/customer.loader';
import { TicketLoader } from './loaders/ticket.loader';
import { TaskLoader } from './loaders/task.loader';
import { ChangeLoader } from './loaders/change.loader';
import { NodeHandlerFactory } from './handler/node-handler.factory';
import { StartNodeHandler } from './handler/impl/start-node.handler';
import { EndNodeHandler } from './handler/impl/end-node.handler';
import { ApprovalNodeHandler } from './handler/impl/approval-node.handler';
import { ConditionNodeHandler } from './handler/impl/condition-node.handler';
import { NotificationNodeHandler } from './handler/impl/notification-node.handler';
import { CcNodeHandler } from './handler/impl/cc-node.handler';
import { DelayNodeHandler } from './handler/impl/delay-node.handler';
import { FormNodeHandler } from './handler/impl/form-node.handler';
import { NoticesModule } from '../../modules/notices/module';
import { UsersModule } from '../../modules/users/users.module';
import { DepstModule } from '../../modules/depts/depts.module';
import { ProjectsModule } from '../projects/module';
import { CrmModule } from '../crm/module';
import { TicketsModule } from '../tickets/module';
import { ChangesModule } from '../changes/module';
import { User } from '../../modules/users/entities/user.entity';
import { Dept } from '../../modules/depts/entities/dept.entity';
import { Project } from '../projects/entity';
import { ProjectMember } from '../project-members/entity';
import { Customer } from '../crm/customers/entity';
import { Ticket } from '../tickets/entity';
import { Task } from '../tasks/entity';
import { ProjectChange } from '../changes/entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowDefinition,
      WorkflowInstance,
      WorkflowTask,
      WorkflowHistory,
      WorkflowBusinessConfig,
      WfFieldMapping,
      User,
      Dept,
      Project,
      ProjectMember,
      Customer,
      Ticket,
      Task,
      ProjectChange,
    ]),
    NoticesModule,
    UsersModule,
    DepstModule,
    forwardRef(() => ProjectsModule),
    CrmModule,
    TicketsModule,
    ChangesModule,
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowDataLoaderService,
    WorkflowAssigneeResolverService,
    BusinessFieldService,
    NodeHandlerFactory,
    StartNodeHandler,
    EndNodeHandler,
    ApprovalNodeHandler,
    ConditionNodeHandler,
    NotificationNodeHandler,
    CcNodeHandler,
    DelayNodeHandler,
    FormNodeHandler,
    ProjectLoader,
    CustomerLoader,
    TicketLoader,
    TaskLoader,
    ChangeLoader,
  ],
  exports: [WorkflowService, WorkflowDataLoaderService, WorkflowAssigneeResolverService, BusinessFieldService],
})
export class WorkflowModule {}
