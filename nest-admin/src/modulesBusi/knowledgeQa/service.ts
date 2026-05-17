import { Injectable } from "@nestjs/common";
import { ArticlesService } from "../articles/service";
import { ArticleChunkEmbeddingsService } from "../articleChunkEmbeddings/service";
import { CustomAiService } from "src/modulesAi/ai/custom-ai";
import { KnowledgeQaAskDto, KnowledgeQaEmbedPreviewDto } from "./dto";

@Injectable()
export class KnowledgeQaService {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly articleChunkEmbeddingsService: ArticleChunkEmbeddingsService,
    private readonly customAiService: CustomAiService,
  ) {}

  async ask(
    query: KnowledgeQaAskDto,
    currentUser?: Record<string, any>,
  ) {
    const startedAt = Date.now();
    const question = String(query.question || "").trim();
    const limit = Math.min(Math.max(Number(query.limit || 5), 1), 5);
    const model = this.customAiService.getDefaultModel();

    if (!question) {
      return this.buildEmptyAnswer(model, startedAt);
    }

    const queryEmbeddingResult = await this.customAiService.embedTexts(
      [question],
      this.customAiService.getDefaultEmbeddingModel(),
    );
    const queryVector = queryEmbeddingResult.vectors?.[0] || [];

    const retrieval = await this.articlesService.retrieveForAi(
      {
        keyword: question,
        limit,
        catalogId: query.catalogId,
        knowledgeType: query.knowledgeType,
      } as any,
      currentUser,
    );
    const matchedChunks = Array.isArray(retrieval?.data) ? retrieval.data : [];
    if (!matchedChunks.length) {
      return this.buildEmptyAnswer(model, startedAt);
    }

    const articleIds = [...new Set(matchedChunks.map((item) => item.articleId))];
    const chunkEmbeddings =
      await this.articleChunkEmbeddingsService.findByArticles(articleIds);
    const chunkEmbeddingMap = new Map(
      chunkEmbeddings.map((item) => [
        this.getChunkLookupKey(item.articleId, item.chunkOrder),
        item,
      ]),
    );
    const rankedChunks = matchedChunks
      .map((item) => {
        const embeddingRecord = chunkEmbeddingMap.get(
          this.getChunkLookupKey(item.articleId, item.chunkOrder),
        );
        const cosineScore = this.cosineSimilarity(
          queryVector,
          embeddingRecord?.embeddingVector || [],
        );
        const keywordScore = Number(item.score || 0);
        const retrievalWeightBonus =
          Number(item.retrievalWeight || 0) * 0.1;
        const authorityOrAiPreferredBonus =
          String(item.authorityLevel || "0") === "1" ||
          String(item.aiPreferred || "0") === "1"
            ? 0.05
            : 0;
        const finalScore = Number(
          (
            cosineScore * 0.7 +
            keywordScore * 0.15 +
            retrievalWeightBonus +
            authorityOrAiPreferredBonus
          ).toFixed(6),
        );
        return {
          ...item,
          score: finalScore,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);

    if (!rankedChunks.length) {
      return this.buildEmptyAnswer(model, startedAt);
    }

    const prompt = this.buildPrompt(question, rankedChunks);
    const response = await this.customAiService.chatNoStream({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是企业知识库问答助手。只能基于提供的知识片段回答，不知道就明确说明当前知识不足，不得编造事实。",
        },
        { role: "user", content: question },
        { role: "system", content: prompt },
      ],
    });
    const answer =
      response?.choices?.[0]?.message?.content ||
      response?.choices?.[0]?.delta?.content ||
      "当前知识库中没有找到足够信息，请换个问法或补充更多上下文。";

    return {
      answer,
      references: rankedChunks.map((item) => ({
        articleId: item.articleId,
        articleTitle: item.articleTitle,
        chunkId: item.chunkId,
        chunkOrder: item.chunkOrder,
        chunkTitle: item.chunkTitle,
        chunkSummary: item.chunkSummary,
        catalog: item.catalog || null,
        score: item.score,
      })),
      matchedChunks: rankedChunks.map((item) => ({
        chunkId:
          item.chunkId ||
          this.getChunkLookupKey(item.articleId, item.chunkOrder),
        chunkText: item.chunkText,
        score: item.score,
      })),
      model,
      elapsedMs: Date.now() - startedAt,
    };
  }

  async embedPreview(query: KnowledgeQaEmbedPreviewDto) {
    const embeddingResult = await this.customAiService.embedTexts(
      [String(query.text || "")],
      query.model || this.customAiService.getDefaultEmbeddingModel(),
    );
    return {
      provider: "openai-compatible",
      model:
        embeddingResult.model ||
        query.model ||
        this.customAiService.getDefaultEmbeddingModel(),
      dimension: embeddingResult.vectors?.[0]?.length || 0,
    };
  }

  private buildPrompt(question: string, chunks: any[]) {
    const context = chunks
      .map(
        (item, index) =>
          [
            `片段 ${index + 1}`,
            `标题：${item.articleTitle}`,
            `分类：${item.catalog?.name || "-"}`,
            `片段序号：${item.chunkOrder}`,
            `内容：${item.chunkText || item.chunkSummary || ""}`,
          ].join("\n"),
      )
      .join("\n\n");
    return `问题：${question}\n\n候选知识：\n${context}`;
  }

  private buildEmptyAnswer(model: string, startedAt: number) {
    return {
      answer:
        "当前知识库中没有找到足够信息，请换个问法或补充更多上下文。",
      references: [],
      matchedChunks: [],
      model,
      elapsedMs: Date.now() - startedAt,
    };
  }

  private cosineSimilarity(left: number[] = [], right: number[] = []) {
    if (!left.length || !right.length || left.length !== right.length) {
      return 0;
    }

    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for (let index = 0; index < left.length; index += 1) {
      dot += Number(left[index] || 0) * Number(right[index] || 0);
      leftNorm += Number(left[index] || 0) * Number(left[index] || 0);
      rightNorm += Number(right[index] || 0) * Number(right[index] || 0);
    }
    const divisor = Math.sqrt(leftNorm) * Math.sqrt(rightNorm) || 1;
    return Number((dot / divisor).toFixed(6));
  }

  private getChunkLookupKey(articleId: string, chunkOrder: number) {
    return `${articleId || ""}:${Number(chunkOrder || 0)}`;
  }
}
