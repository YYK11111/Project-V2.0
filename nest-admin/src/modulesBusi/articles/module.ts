import { Module } from "@nestjs/common";
import { ArticlesService } from "./service";
import { ArticlesController } from "./controller";
import { Article } from "./entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleCatalogsModule } from "../articleCatalogs/module";
import { TasksModule } from "src/common/tasks/tasks.module";
import { ArticleTag } from "../articleTags/entity";
import { ArticleTagsModule } from "../articleTags/module";
import { UsersModule } from "src/modules/users/users.module";
import { ArticleBorrowsModule } from "../articleBorrows/module";
import { ArticleSearchRecordsModule } from "../articleSearchRecords/module";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { Project } from "../projects/entity";
import { ProjectMember } from "../project-members/entity";
import { ArticleChunkEmbeddingsModule } from "../articleChunkEmbeddings/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      ArticleTag,
      ArticleCatalog,
      Project,
      ProjectMember,
    ]),
    ArticleCatalogsModule,
    ArticleTagsModule,
    ArticleBorrowsModule,
    ArticleSearchRecordsModule,
    UsersModule,
    TasksModule,
    ArticleChunkEmbeddingsModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
