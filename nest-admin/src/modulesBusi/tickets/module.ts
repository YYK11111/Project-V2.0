import { Module, forwardRef } from "@nestjs/common";
import { TicketsService } from "./service";
import { TicketsController } from "./controller";
import { Ticket } from "./entity";
import { TicketActionLog } from "./entities/ticket-action-log.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/modules/users/users.module";
import { ProjectsModule } from "../projects/module";
import { TasksBusiModule } from "../tasks/module";
import { SysFileModule } from "src/modules/sys/file/module";
import { Article } from "../articles/entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketActionLog, Article]),
    forwardRef(() => UsersModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => TasksBusiModule),
    forwardRef(() => SysFileModule),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
