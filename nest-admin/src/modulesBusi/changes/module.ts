import { Module } from "@nestjs/common";
import { ChangesService } from "./service";
import { ChangesController } from "./controller";
import { ProjectChange } from "./entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/modules/users/users.module";
import { ProjectsModule } from "../projects/module";
import { SysFileModule } from "src/modules/sys/file/module";
import { Article } from "../articles/entity";
import { ChangeImpactConfirmHistory } from "./entities/change-impact-confirm-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectChange,
      Article,
      ChangeImpactConfirmHistory,
    ]),
    UsersModule,
    ProjectsModule,
    SysFileModule,
  ],
  controllers: [ChangesController],
  providers: [ChangesService],
  exports: [ChangesService],
})
export class ChangesModule {}
