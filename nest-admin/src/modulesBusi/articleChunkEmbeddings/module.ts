import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleChunkEmbedding } from "./entity";
import { ArticleChunkEmbeddingsService } from "./service";
import { AiModule } from "src/modulesAi/ai/module";

@Module({
  imports: [TypeOrmModule.forFeature([ArticleChunkEmbedding]), AiModule],
  providers: [ArticleChunkEmbeddingsService],
  exports: [ArticleChunkEmbeddingsService, TypeOrmModule],
})
export class ArticleChunkEmbeddingsModule {}
