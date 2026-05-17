import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleBorrow } from "./entity";
import { Article } from "../articles/entity";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { ArticleCatalogManager } from "../articleCatalogManagers/entity";
import { ArticleBorrowsService } from "./service";
import { ArticleBorrowsController } from "./controller";
import { TasksModule } from "src/common/tasks/tasks.module";
import { UsersModule } from "src/modules/users/users.module";
import { SystemScheduledJobsModule } from "src/modules/systemScheduledJobs/module";
import { WorkflowModule } from "../workflow/module";
import { BusinessApprovalContextsModule } from "../approval-contexts/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleBorrow,
      Article,
      ArticleCatalog,
      ArticleCatalogManager,
    ]),
    TasksModule,
    forwardRef(() => UsersModule),
    forwardRef(() => SystemScheduledJobsModule),
    forwardRef(() => WorkflowModule),
    BusinessApprovalContextsModule,
  ],
  providers: [ArticleBorrowsService],
  controllers: [ArticleBorrowsController],
  exports: [ArticleBorrowsService],
})
export class ArticleBorrowsModule {}
