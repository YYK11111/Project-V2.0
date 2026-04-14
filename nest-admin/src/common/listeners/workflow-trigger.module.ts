import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowTriggerListener } from '../listeners/workflow-trigger.listener';
import { WorkflowModule } from '../../modulesBusi/workflow/module';

@Module({
  imports: [
    WorkflowModule,
  ],
  providers: [WorkflowTriggerListener],
})
export class WorkflowTriggerModule {}
