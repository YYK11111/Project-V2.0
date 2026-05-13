import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AcceptanceRecord } from "./entity";
import { AcceptanceRecordsController } from "./controller";
import { AcceptanceRecordsService } from "./service";
import { ProjectsModule } from "../projects/module";

@Module({
  imports: [TypeOrmModule.forFeature([AcceptanceRecord]), ProjectsModule],
  controllers: [AcceptanceRecordsController],
  providers: [AcceptanceRecordsService],
  exports: [AcceptanceRecordsService],
})
export class AcceptanceRecordsModule {}
