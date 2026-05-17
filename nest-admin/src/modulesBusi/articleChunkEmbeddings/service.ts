import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ArticleChunkEmbedding, ArticleChunkEmbeddingStatus } from "./entity";
import { CustomAiService } from "src/modulesAi/ai/custom-ai";

type ArticleChunkEmbeddingInput = {
  id?: string;
  order: number;
  title: string;
  headingPath?: string[];
  text: string;
  tokenEstimate?: number;
};

@Injectable()
export class ArticleChunkEmbeddingsService {
  constructor(
    @InjectRepository(ArticleChunkEmbedding)
    private repository: Repository<ArticleChunkEmbedding>,
    private readonly customAiService: CustomAiService,
  ) {}

  async embedTexts(texts: string[]) {
    const model = this.customAiService.getDefaultEmbeddingModel();
    return this.customAiService.embedTexts(texts, model);
  }

  getEmbeddingModel() {
    return this.customAiService.getDefaultEmbeddingModel();
  }

  async rebuildArticleChunkEmbeddings(input: {
    articleId: string;
    embeddingVersion: number;
    chunks: ArticleChunkEmbeddingInput[];
  }) {
    const chunks = input.chunks || [];
    if (!chunks.length) {
      await this.repository.delete({ articleId: input.articleId });
      return { status: ArticleChunkEmbeddingStatus.ready, count: 0 };
    }

    const embedResult = await this.embedTexts(
      chunks.map((chunk) => chunk.text || ""),
    );
    await this.repository.delete({ articleId: input.articleId });
    const vectors = embedResult.vectors || [];
    const records = chunks.map(
      (chunk, index) =>
        new ArticleChunkEmbedding({
          articleId: input.articleId,
          chunkId:
            chunk.id ||
            `${input.articleId}:${input.embeddingVersion}:${chunk.order}`,
          chunkOrder: chunk.order,
          chunkTitle: chunk.title,
          headingPath: chunk.headingPath || [],
          chunkText: chunk.text || "",
          tokenEstimate: Number(chunk.tokenEstimate || 0),
          embeddingProvider: "openai-compatible",
          embeddingModel: embedResult.model || this.getEmbeddingModel(),
          embeddingVector: vectors[index],
          embeddingVersion: input.embeddingVersion,
          status: ArticleChunkEmbeddingStatus.ready,
          errorMessage: "",
        }),
    );
    await this.repository.save(records);
    return { status: ArticleChunkEmbeddingStatus.ready, count: records.length };
  }

  async findByArticles(articleIds: string[]) {
    if (!articleIds?.length) {
      return [];
    }
    return this.repository.find({
      where: articleIds.map((articleId) => ({ articleId })) as any,
      order: {
        articleId: "ASC",
        chunkOrder: "ASC",
      },
    });
  }
}
