import { Module } from "@nestjs/common";
import { ProjectsService } from "./service";
import { ProjectsController } from "./controller";
import { Project } from "./entity";
import { UserStory } from "./entities/user-story.entity";
import { UserStoryService } from "./user-story.service";
import { UserStoryController } from "./user-story.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/modules/users/users.module";
import { CrmModule } from "../crm/module";
import { Task } from "../tasks/entity";
import { Ticket } from "../tickets/entity";
import { Document } from "../documents/entity";
import { SysFileModule } from "src/modules/sys/file/module";
import { ProjectMilestoneTemplateService } from "./milestone-template.service";
import { ProjectMember } from "../project-members/entity";
import { Milestone } from "../milestones/entity";
import { Risk } from "../risks/entity";
import { ProjectChange } from "../changes/entity";
import { Sprint } from "../sprints/entity";
import { Article } from "../articles/entity";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { MessagesModule } from "src/modules/messages/module";
import { SystenConfigsModule } from "src/modules/configs/module";
import { ProjectCockpitSnapshot } from "./entities/project-cockpit-snapshot.entity";
import { ChangeImpactConfirmHistory } from "../changes/entities/change-impact-confirm-history.entity";
import { ProjectFieldPermissionService } from "./project-field-permission.service";
import { GoLiveRecord } from "../go-live-records/entity";
import { AcceptanceRecord } from "../acceptance-records/entity";
import { HandoverRecord } from "../handover-records/entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Task,
      Ticket,
      Document,
      UserStory,
      ProjectMember,
      Milestone,
      Risk,
      ProjectChange,
      Sprint,
      Article,
      ArticleCatalog,
      ProjectCockpitSnapshot,
      ChangeImpactConfirmHistory,
      GoLiveRecord,
      AcceptanceRecord,
      HandoverRecord,
    ]),
    UsersModule,
    CrmModule,
    SysFileModule,
    MessagesModule,
    SystenConfigsModule,
  ],
  controllers: [ProjectsController, UserStoryController],
  providers: [
    ProjectsService,
    UserStoryService,
    ProjectMilestoneTemplateService,
    ProjectFieldPermissionService,
  ],
  exports: [
    ProjectsService,
    UserStoryService,
    ProjectMilestoneTemplateService,
    ProjectFieldPermissionService,
  ],
})
export class ProjectsModule {}
