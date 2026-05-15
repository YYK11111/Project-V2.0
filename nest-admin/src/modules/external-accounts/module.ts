import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserExternalAccountsController } from "./controller";
import { UserExternalAccount } from "./entity";
import { UserExternalAccountsService } from "./service";

@Module({
  imports: [TypeOrmModule.forFeature([UserExternalAccount])],
  controllers: [UserExternalAccountsController],
  providers: [UserExternalAccountsService],
  exports: [UserExternalAccountsService],
})
export class UserExternalAccountsModule {}
