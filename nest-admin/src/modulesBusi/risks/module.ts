import { Module } from "@nestjs/common";
import { RisksService } from "./service";
import { RisksController } from "./controller";
import { Risk } from "./entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/modules/users/users.module";
import { ProjectsModule } from "../projects/module";
import { Article } from "../articles/entity";
import { TasksBusiModule } from "../tasks/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Risk, Article]),
    UsersModule,
    ProjectsModule,
    TasksBusiModule,
  ],
  controllers: [RisksController],
  providers: [RisksService],
  exports: [RisksService],
})
export class RisksModule {}
