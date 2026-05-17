import { KnowledgeQaService } from "./service";

describe("KnowledgeQaService", () => {
  function createService() {
    const articlesService = {
      retrieveForAi: jest.fn().mockResolvedValue({
        total: 1,
        data: [
          {
            articleId: "article-1",
            articleTitle: "项目复盘",
            chunkOrder: 1,
            chunkTitle: "风险总结",
            chunkText: "风险处理过程",
            chunkSummary: "风险处理过程",
            score: 8,
            catalog: {
              id: "catalog-1",
              name: "项目复盘",
            },
            retrievalWeight: 2,
            aiPreferred: "1",
            authorityLevel: "1",
            scoreBreakdown: {
              keywordScore: 8,
            },
            matchedTerms: ["风险"],
            matchedFields: ["title"],
          },
        ],
      }),
    };
    const articleChunkEmbeddingsService = {
      findByArticles: jest.fn().mockResolvedValue([
        {
          articleId: "article-1",
          chunkId: "article-1:1:1",
          chunkOrder: 1,
          chunkTitle: "风险总结",
          chunkText: "风险处理过程",
          headingPath: ["项目复盘", "风险总结"],
          embeddingVector: [0.1, 0.2, 0.3],
          embeddingModel: "text-embedding-3-small",
        },
      ]),
    };
    const customAiService = {
      embedTexts: jest.fn().mockResolvedValue({
        model: "text-embedding-3-small",
        vectors: [[0.1, 0.2, 0.3]],
      }),
      chatNoStream: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "答案" } }],
      }),
      getDefaultChatModel: jest.fn().mockReturnValue("gpt-5.4"),
      getDefaultModel: jest.fn().mockReturnValue("gpt-5.4"),
      getDefaultEmbeddingModel: jest
        .fn()
        .mockReturnValue("text-embedding-3-small"),
    };
    const service = new KnowledgeQaService(
      articlesService as never,
      articleChunkEmbeddingsService as never,
      customAiService as never,
    );
    return {
      service,
      articlesService,
      articleChunkEmbeddingsService,
      customAiService,
    };
  }

  it("问答必须复用 retrieveForAi 召回候选", async () => {
    const { service, articlesService } = createService();

    await service.ask(
      {
        question: "风险怎么处理",
        limit: 3,
      },
      undefined,
    );

    expect(articlesService.retrieveForAi).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: "风险怎么处理",
        limit: 9,
      }),
      undefined,
    );
  });

  it("embed-preview 返回 embedding 向量", async () => {
    const { service, customAiService } = createService();

    const result = await service.embedPreview({
      text: "项目复盘风险",
    });

    expect(customAiService.embedTexts).toHaveBeenCalledWith(
      ["项目复盘风险"],
      "text-embedding-3-small",
    );
    expect(result.provider).toBe("openai-compatible");
    expect(result.dimension).toBe(3);
    expect(result.model).toBe("text-embedding-3-small");
  });

  it("问答返回 answer/references/matchedChunks/model/elapsedMs", async () => {
    const { service } = createService();

    const result = await service.ask(
      {
        question: "风险怎么处理",
        limit: 3,
      },
      undefined,
    );

    expect(result.answer).toBe("答案");
    expect(result.references).toHaveLength(1);
    expect(result.matchedChunks).toHaveLength(1);
    expect(result.model).toBe("gpt-5.4");
    expect(typeof result.elapsedMs).toBe("number");
    expect(result.references[0]).toEqual(
      expect.objectContaining({
        articleId: "article-1",
        articleTitle: "项目复盘",
        chunkId: "article-1:1:1",
        catalog: {
          id: "catalog-1",
          name: "项目复盘",
        },
      }),
    );
    expect(Object.keys(result).sort()).toEqual(
      ["answer", "elapsedMs", "matchedChunks", "model", "references"].sort(),
    );
  });

  it("无候选知识时返回兜底答案", async () => {
    const { service, articlesService, customAiService } = createService();
    articlesService.retrieveForAi.mockResolvedValueOnce({ total: 0, data: [] });

    const result = await service.ask(
      {
        question: "完全不存在的问题",
      },
      undefined,
    );

    expect(result.references).toEqual([]);
    expect(result.matchedChunks).toEqual([]);
    expect(result.answer).toContain("当前知识库中没有找到足够信息");
    expect(customAiService.chatNoStream).not.toHaveBeenCalled();
  });

  it("问答结果在 retrieveForAi 未返回 chunkId 时回填真实 chunkId", async () => {
    const { service } = createService();

    const result = await service.ask(
      {
        question: "风险怎么处理",
        limit: 3,
      },
      undefined,
    );

    expect(result.references[0].chunkId).toBe("article-1:1:1");
    expect(result.matchedChunks[0].chunkId).toBe("article-1:1:1");
  });

  it("embedding 失败时返回明确错误码", async () => {
    const { service, customAiService } = createService();
    customAiService.embedTexts.mockRejectedValueOnce(
      new Error("embedding failed"),
    );

    await expect(
      service.ask(
        {
          question: "风险怎么处理",
        },
        undefined,
      ),
    ).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "KNOWLEDGE_QA_EMBEDDING_FAILED",
        }),
      }),
    );
  });

  it("chat 失败时返回明确错误码", async () => {
    const { service, customAiService } = createService();
    customAiService.chatNoStream.mockRejectedValueOnce(
      new Error("chat failed"),
    );

    await expect(
      service.ask(
        {
          question: "风险怎么处理",
        },
        undefined,
      ),
    ).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "KNOWLEDGE_QA_CHAT_FAILED",
        }),
      }),
    );
  });

  it("retrieveForAi 失败时返回明确错误码", async () => {
    const { service, articlesService } = createService();
    articlesService.retrieveForAi.mockRejectedValueOnce(
      new Error("retrieve failed"),
    );

    await expect(
      service.ask(
        {
          question: "风险怎么处理",
        },
        undefined,
      ),
    ).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "KNOWLEDGE_QA_RETRIEVE_FAILED",
        }),
      }),
    );
  });

  it("读取候选切片向量失败时返回明确错误码", async () => {
    const { service, articleChunkEmbeddingsService } = createService();
    articleChunkEmbeddingsService.findByArticles.mockRejectedValueOnce(
      new Error("load references failed"),
    );

    await expect(
      service.ask(
        {
          question: "风险怎么处理",
        },
        undefined,
      ),
    ).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "KNOWLEDGE_QA_REFERENCE_LOAD_FAILED",
        }),
      }),
    );
  });

  it("embed-preview 失败时返回明确错误码", async () => {
    const { service, customAiService } = createService();
    customAiService.embedTexts.mockRejectedValueOnce(
      new Error("preview failed"),
    );

    await expect(
      service.embedPreview({
        text: "项目复盘风险",
      }),
    ).rejects.toMatchObject(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "KNOWLEDGE_QA_EMBED_PREVIEW_FAILED",
        }),
      }),
    );
  });

  it("问答按融合得分重排候选顺序", async () => {
    const {
      service,
      articlesService,
      articleChunkEmbeddingsService,
      customAiService,
    } = createService();
    articlesService.retrieveForAi.mockResolvedValueOnce({
      total: 2,
      data: [
        {
          articleId: "article-1",
          articleTitle: "关键词更强",
          chunkOrder: 1,
          chunkTitle: "片段一",
          chunkText: "风险处理过程",
          chunkSummary: "风险处理过程",
          score: 8,
          retrievalWeight: 0,
          aiPreferred: "0",
          authorityLevel: "0",
          scoreBreakdown: {
            keywordScore: 4,
          },
        },
        {
          articleId: "article-2",
          articleTitle: "向量更相近",
          chunkOrder: 1,
          chunkTitle: "片段二",
          chunkText: "风险处理过程",
          chunkSummary: "风险处理过程",
          score: 2,
          retrievalWeight: 0,
          aiPreferred: "0",
          authorityLevel: "0",
          scoreBreakdown: {
            keywordScore: 0,
          },
        },
      ],
    });
    articleChunkEmbeddingsService.findByArticles.mockResolvedValueOnce([
      {
        articleId: "article-1",
        chunkId: "article-1:1:1",
        chunkOrder: 1,
        embeddingVector: [0, 1, 0],
      },
      {
        articleId: "article-2",
        chunkId: "article-2:1:1",
        chunkOrder: 1,
        embeddingVector: [1, 0, 0],
      },
    ]);
    customAiService.embedTexts.mockResolvedValueOnce({
      model: "text-embedding-3-small",
      vectors: [[1, 0, 0]],
    });

    const result = await service.ask(
      {
        question: "风险怎么处理",
        limit: 2,
      },
      undefined,
    );

    expect(result.references.map((item) => item.articleId)).toEqual([
      "article-2",
      "article-1",
    ]);
    expect(result.references[0].score).toBeGreaterThan(
      result.references[1].score,
    );
  });
});
