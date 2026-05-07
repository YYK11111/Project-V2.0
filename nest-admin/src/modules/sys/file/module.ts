import { Module, forwardRef } from "@nestjs/common";
import { SysFileService } from "./service";
import { SysFileController } from "./controller";
import { SysFile } from "./entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SystemScheduledJobsModule } from "src/modules/systemScheduledJobs/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SysFile]),
    forwardRef(() => SystemScheduledJobsModule),
  ],
  controllers: [SysFileController],
  providers: [SysFileService],
  exports: [SysFileService],
})
export class SysFileModule {}
