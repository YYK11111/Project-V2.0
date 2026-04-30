import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleChunkEmbedding } from "./entity";
import { ArticleChunkEmbeddingsService } from "./service";

@Module({
  imports: [TypeOrmModule.forFeature([ArticleChunkEmbedding])],
  providers: [ArticleChunkEmbeddingsService],
  exports: [ArticleChunkEmbeddingsService, TypeOrmModule],
})
export class ArticleChunkEmbeddingsModule {}
