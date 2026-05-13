import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HandoverRecord } from "./entity";
import { HandoverRecordsController } from "./controller";
import { HandoverRecordsService } from "./service";
import { ProjectsModule } from "../projects/module";

@Module({
  imports: [TypeOrmModule.forFeature([HandoverRecord]), ProjectsModule],
  controllers: [HandoverRecordsController],
  providers: [HandoverRecordsService],
  exports: [HandoverRecordsService],
})
export class HandoverRecordsModule {}
