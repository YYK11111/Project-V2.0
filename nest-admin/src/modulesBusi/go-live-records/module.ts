import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GoLiveRecord } from "./entity";
import { GoLiveRecordsController } from "./controller";
import { GoLiveRecordsService } from "./service";
import { ProjectsModule } from "../projects/module";

@Module({
  imports: [TypeOrmModule.forFeature([GoLiveRecord]), ProjectsModule],
  controllers: [GoLiveRecordsController],
  providers: [GoLiveRecordsService],
  exports: [GoLiveRecordsService],
})
export class GoLiveRecordsModule {}
