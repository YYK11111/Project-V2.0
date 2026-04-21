import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleSearchRecord } from "./entity";
import { ArticleSearchRecordsService } from "./service";

@Module({
  imports: [TypeOrmModule.forFeature([ArticleSearchRecord])],
  providers: [ArticleSearchRecordsService],
  exports: [ArticleSearchRecordsService, TypeOrmModule],
})
export class ArticleSearchRecordsModule {}
