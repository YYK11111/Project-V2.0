import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessApprovalContextController } from "./controller";
import { BusinessApprovalContextService } from "./service";
import { BusinessApprovalContext } from "./entity/business-approval-context.entity";
import { BusinessApprovalParticipant } from "./entity/business-approval-participant.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessApprovalContext,
      BusinessApprovalParticipant,
    ]),
  ],
  controllers: [BusinessApprovalContextController],
  providers: [BusinessApprovalContextService],
  exports: [BusinessApprovalContextService],
})
export class BusinessApprovalContextsModule {}
