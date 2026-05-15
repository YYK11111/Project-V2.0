import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Message } from "./entity";
import { MessagesService } from "./service";
import { MessagesController } from "./controller";
import { WorkflowTask } from "src/modulesBusi/workflow/entity/workflow-task.entity";
import { WorkflowInstance } from "src/modulesBusi/workflow/entity/workflow-instance.entity";
import { SystenConfigsModule } from "../configs/module";
import { ExternalNotifyModule } from "../external-notify/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, WorkflowTask, WorkflowInstance]),
    SystenConfigsModule,
    ExternalNotifyModule,
  ],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
