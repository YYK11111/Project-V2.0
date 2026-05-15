import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessApprovalContextController } from "./controller";
import { BusinessApprovalContextService } from "./service";
import { BusinessApprovalContext } from "./entity/business-approval-context.entity";
import { BusinessApprovalParticipant } from "./entity/business-approval-participant.entity";
import { WorkflowInstance } from "../workflow/entity/workflow-instance.entity";
import { ProjectChange } from "../changes/entity";
import { Task } from "../tasks/entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessApprovalContext,
      BusinessApprovalParticipant,
      WorkflowInstance,
      ProjectChange,
      Task,
    ]),
  ],
  controllers: [BusinessApprovalContextController],
  providers: [BusinessApprovalContextService],
  exports: [BusinessApprovalContextService],
})
export class BusinessApprovalContextsModule {}
