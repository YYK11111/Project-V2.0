import { Module } from "@nestjs/common";
import { ArticleCatalogsService } from "./service";
import { ArticleCatalogsController } from "./controller";
import { ArticleCatalog } from "./entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Article } from "../articles/entity";
import { ArticleCatalogManager } from "../articleCatalogManagers/entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleCatalog, Article, ArticleCatalogManager]),
  ],
  controllers: [ArticleCatalogsController],
  providers: [ArticleCatalogsService],
  exports: [ArticleCatalogsService],
})
export class ArticleCatalogsModule {}
