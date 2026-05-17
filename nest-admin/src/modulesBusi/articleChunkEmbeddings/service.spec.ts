import { ArticleChunkEmbeddingsService } from "./service";

describe("ArticleChunkEmbeddingsService", () => {
  function createService() {
    const repository = {
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      save: jest.fn().mockImplementation(async (value) => value),
      find: jest.fn().mockResolvedValue([]),
    };
    const customAiService = {
      embedTexts: jest.fn().mockResolvedValue({
        model: "text-embedding-3-small",
        vectors: [[0.12, 0.34, 0.56]],
      }),
      getDefaultEmbeddingModel: jest
        .fn()
        .mockReturnValue("text-embedding-3-small"),
    };
    const service = new ArticleChunkEmbeddingsService(
      repository as never,
      customAiService as never,
    );
    return { service, repository, customAiService };
  }

  it("调用 OpenAI 兼容 embedding 生成向量", async () => {
    const { service, customAiService } = createService();

    const first = await service.embedTexts(["项目复盘风险"]);

    expect(customAiService.embedTexts).toHaveBeenCalledWith(
      ["项目复盘风险"],
      "text-embedding-3-small",
    );
    expect(first).toEqual({
      model: "text-embedding-3-small",
      vectors: [[0.12, 0.34, 0.56]],
    });
  });

  it("按文章查询切片向量", async () => {
    const { service, repository } = createService();

    await service.findByArticles(["article-1", "article-2"]);

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [{ articleId: "article-1" }, { articleId: "article-2" }],
      }),
    );
  });

  it("按文章切片重建 embedding 记录", async () => {
    const { service, repository } = createService();

    const result = await service.rebuildArticleChunkEmbeddings({
      articleId: "article-1",
      embeddingVersion: 2,
      chunks: [
        {
          id: "article-1:1:1",
          order: 1,
          title: "风险总结",
          headingPath: ["项目复盘", "风险总结"],
          text: "风险处理过程",
          tokenEstimate: 8,
        },
      ],
    });

    expect(repository.delete).toHaveBeenCalledWith({ articleId: "article-1" });
    expect(repository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          articleId: "article-1",
          chunkId: "article-1:1:1",
          chunkOrder: 1,
          chunkTitle: "风险总结",
          headingPath: ["项目复盘", "风险总结"],
          tokenEstimate: 8,
          embeddingProvider: "openai-compatible",
          embeddingModel: "text-embedding-3-small",
          embeddingVersion: 2,
          status: "ready",
          errorMessage: "",
        }),
      ]),
    );
    expect(result.status).toBe("ready");
    expect(result.count).toBe(1);
  });

  it("embedding 失败时不删除旧向量记录", async () => {
    const { service, repository, customAiService } = createService();
    customAiService.embedTexts.mockRejectedValueOnce(
      new Error("embedding failed"),
    );

    await expect(
      service.rebuildArticleChunkEmbeddings({
        articleId: "article-1",
        embeddingVersion: 2,
        chunks: [
          {
            id: "article-1:1:1",
            order: 1,
            title: "风险总结",
            text: "风险处理过程",
          },
        ],
      }),
    ).rejects.toThrow("embedding failed");
    expect(repository.delete).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
