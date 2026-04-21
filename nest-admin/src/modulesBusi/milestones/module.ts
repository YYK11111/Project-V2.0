import { Module } from "@nestjs/common";
import { MilestonesService } from "./service";
import { MilestonesController } from "./controller";
import { Milestone } from "./entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/modules/users/users.module";
import { Task } from "../tasks/entity";

@Module({
  imports: [TypeOrmModule.forFeature([Milestone, Task]), UsersModule],
  controllers: [MilestonesController],
  providers: [MilestonesService],
  exports: [MilestonesService],
})
export class MilestonesModule {}
