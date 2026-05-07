import { Module, forwardRef } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { CommonModule } from "../common/common.module";
import { DepstModule } from "../depts/depts.module";
import { SysFileModule } from "../sys/file/module";
import { SystenConfigsModule } from "../configs/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => CommonModule),
    DepstModule,
    forwardRef(() => SysFileModule),
    SystenConfigsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
