import { ArticleChunkEmbeddingsService } from "./service";

describe("ArticleChunkEmbeddingsService", () => {
  function createService() {
    const repository = {
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      save: jest.fn().mockImplementation(async (value) => value),
      find: jest.fn().mockResolvedValue([]),
    };
    const service = new ArticleChunkEmbeddingsService(repository as never);
    return { service, repository };
  }

  it("为相同文本生成稳定 mock 向量", async () => {
    const { service } = createService();

    const first = await service.embedTexts(["项目复盘风险"]);
    const second = await service.embedTexts(["项目复盘风险"]);

    expect(first).toEqual(second);
    expect(first[0]).toHaveLength(16);
    expect(first[0].every((item) => typeof item === "number")).toBe(true);
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
          embeddingProvider: "mock",
          embeddingModel: "mock-hash-16",
          embeddingVersion: 2,
          status: "ready",
          errorMessage: "",
        }),
      ]),
    );
    expect(result.status).toBe("ready");
    expect(result.count).toBe(1);
  });
});
