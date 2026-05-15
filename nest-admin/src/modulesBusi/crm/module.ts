import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomersService } from "./customers/service";
import { CustomersController } from "./customers/controller";
import { Customer } from "./customers/entity";
import { CustomerViewer } from "./customers/entities/customer-viewer.entity";
import { CustomerInteractionService } from "./interactions/service";
import { CustomerInteractionsController } from "./interactions/controller";
import { CustomerInteraction } from "./interactions/entity";
import { OpportunitiesService } from "./opportunities/service";
import { OpportunitiesController } from "./opportunities/controller";
import { SalesOpportunity } from "./opportunities/entity";
import { ContractsService } from "./contracts/service";
import { ContractsController } from "./contracts/controller";
import { Contract } from "./contracts/entity";
import { UsersModule } from "../../modules/users/users.module";
import { Project } from "../projects/entity";
import { BusinessApprovalContextsModule } from "../approval-contexts/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerViewer,
      CustomerInteraction,
      SalesOpportunity,
      Contract,
      Project,
    ]),
    forwardRef(() => UsersModule),
    BusinessApprovalContextsModule,
  ],
  controllers: [
    CustomersController,
    CustomerInteractionsController,
    OpportunitiesController,
    ContractsController,
  ],
  providers: [
    CustomersService,
    CustomerInteractionService,
    OpportunitiesService,
    ContractsService,
  ],
  exports: [CustomersService, OpportunitiesService, ContractsService],
})
export class CrmModule {}
