import { Module } from "@nestjs/common";
import { SystenConfigsService } from "./service";
import { SystenConfigsController } from "./controller";
import { SystenConfig } from "./entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SysFileModule } from "src/modules/sys/file/module";

@Module({
  imports: [TypeOrmModule.forFeature([SystenConfig]), SysFileModule],
  controllers: [SystenConfigsController],
  providers: [SystenConfigsService],
  exports: [SystenConfigsService],
})
export class SystenConfigsModule {}
