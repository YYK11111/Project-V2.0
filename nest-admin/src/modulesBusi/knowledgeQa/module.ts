import { Module } from "@nestjs/common";
import { KnowledgeQaController } from "./controller";
import { KnowledgeQaService } from "./service";
import { ArticlesModule } from "../articles/module";
import { ArticleChunkEmbeddingsModule } from "../articleChunkEmbeddings/module";
import { AiModule } from "src/modulesAi/ai/module";

@Module({
  imports: [
    ArticlesModule,
    ArticleChunkEmbeddingsModule,
    AiModule,
  ],
  controllers: [KnowledgeQaController],
  providers: [KnowledgeQaService],
})
export class KnowledgeQaModule {}
