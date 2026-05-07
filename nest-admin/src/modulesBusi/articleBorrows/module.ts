import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleBorrow } from "./entity";
import { Article } from "../articles/entity";
import { ArticleBorrowsService } from "./service";
import { ArticleBorrowsController } from "./controller";
import { TasksModule } from "src/common/tasks/tasks.module";
import { UsersModule } from "src/modules/users/users.module";
import { SystemScheduledJobsModule } from "src/modules/systemScheduledJobs/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleBorrow, Article]),
    TasksModule,
    forwardRef(() => UsersModule),
    forwardRef(() => SystemScheduledJobsModule),
  ],
  providers: [ArticleBorrowsService],
  controllers: [ArticleBorrowsController],
  exports: [ArticleBorrowsService],
})
export class ArticleBorrowsModule {}
