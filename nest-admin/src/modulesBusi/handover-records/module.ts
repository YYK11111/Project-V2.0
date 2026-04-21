import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HandoverRecord } from "./entity";
import { HandoverRecordsController } from "./controller";
import { HandoverRecordsService } from "./service";

@Module({
  imports: [TypeOrmModule.forFeature([HandoverRecord])],
  controllers: [HandoverRecordsController],
  providers: [HandoverRecordsService],
  exports: [HandoverRecordsService],
})
export class HandoverRecordsModule {}
