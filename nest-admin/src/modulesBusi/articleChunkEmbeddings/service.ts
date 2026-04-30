import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ArticleChunkEmbedding, ArticleChunkEmbeddingStatus } from "./entity";

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
  ) {}

  async embedTexts(texts: string[]) {
    return texts.map((text) => this.createMockVector(text));
  }

  async rebuildArticleChunkEmbeddings(input: {
    articleId: string;
    embeddingVersion: number;
    chunks: ArticleChunkEmbeddingInput[];
  }) {
    const chunks = input.chunks || [];
    await this.repository.delete({ articleId: input.articleId });
    if (!chunks.length) {
      return { status: ArticleChunkEmbeddingStatus.ready, count: 0 };
    }

    const vectors = await this.embedTexts(
      chunks.map((chunk) => chunk.text || ""),
    );
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
          embeddingProvider: "mock",
          embeddingModel: "mock-hash-16",
          embeddingVector: vectors[index],
          embeddingVersion: input.embeddingVersion,
          status: ArticleChunkEmbeddingStatus.ready,
          errorMessage: "",
        }),
    );
    await this.repository.save(records);
    return { status: ArticleChunkEmbeddingStatus.ready, count: records.length };
  }

  private createMockVector(text: string) {
    const vector = Array.from({ length: 16 }, () => 0);
    const source = String(text || "");
    for (let index = 0; index < source.length; index += 1) {
      vector[index % vector.length] += source.charCodeAt(index) % 97;
    }
    const magnitude =
      Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0)) || 1;
    return vector.map((item) => Number((item / magnitude).toFixed(6)));
  }
}
