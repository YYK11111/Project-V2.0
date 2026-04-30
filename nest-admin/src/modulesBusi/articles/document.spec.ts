import { BadRequestException, ConflictException } from "@nestjs/common";
import { validateDocumentJson } from "./document.validator";
import { ArticlesService } from "./service";

describe("validateDocumentJson", () => {
  const validDocument = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "知识正文",
            marks: [{ type: "bold" }],
          },
        ],
      },
    ],
  };

  it("缺少 contentJson 时抛出必填错误码", () => {
    expect(() => validateDocumentJson(null)).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "DOCUMENT_CONTENT_REQUIRED",
        }),
      }),
    );
  });

  it("根节点非法时抛出根节点错误码", () => {
    expect(() =>
      validateDocumentJson({
        type: "paragraph",
        content: [],
      }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: "DOCUMENT_INVALID_ROOT" }),
      }),
    );
  });

  it("不支持的 marks 时抛出 mark 错误码", () => {
    expect(() =>
      validateDocumentJson({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "test",
                marks: [{ type: "comment" }],
              },
            ],
          },
        ],
      }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "DOCUMENT_UNSUPPORTED_MARK",
        }),
      }),
    );
  });

  it("合法文档可通过校验", () => {
    expect(() => validateDocumentJson(validDocument)).not.toThrow();
  });

  it("支持图片和表格节点", () => {
    expect(() =>
      validateDocumentJson({
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              src: "https://example.com/image.png",
            },
          },
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableHeader",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "标题" }],
                      },
                    ],
                  },
                  {
                    type: "tableCell",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "内容" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).not.toThrow();
  });

  it("合法 Isle 扩展节点可通过校验", () => {
    expect(() =>
      validateDocumentJson({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "任务说明",
                marks: [{ type: "underline" }, { type: "link" }],
              },
            ],
          },
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                attrs: { checked: true },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "完成 Isle 接入" }],
                  },
                ],
              },
            ],
          },
          {
            type: "attachment",
            attrs: {
              url: "https://example.com/spec.pdf",
              name: "spec.pdf",
            },
          },
          {
            type: "video",
            attrs: {
              url: "https://example.com/demo.mp4",
            },
          },
          {
            type: "divider",
          },
        ],
      }),
    ).not.toThrow();
  });

  it("叶子节点即使带空 content 也应拒绝", () => {
    expect(() =>
      validateDocumentJson({
        type: "doc",
        content: [
          {
            type: "divider",
            content: [],
          },
        ],
      }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "DOCUMENT_INVALID_SCHEMA",
        }),
      }),
    );
  });

  it("codeBlock 内 text 带 mark 应拒绝", () => {
    expect(() =>
      validateDocumentJson({
        type: "doc",
        content: [
          {
            type: "codeBlock",
            content: [
              {
                type: "text",
                text: "const value = 1",
                marks: [{ type: "bold" }],
              },
            ],
          },
        ],
      }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "DOCUMENT_INVALID_SCHEMA",
        }),
      }),
    );
  });

  it("非法 Isle 节点仍拒绝", () => {
    expect(() =>
      validateDocumentJson({
        type: "doc",
        content: [
          {
            type: "callout",
            content: [{ type: "text", text: "未支持节点" }],
          },
        ],
      }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: "DOCUMENT_UNSUPPORTED_NODE",
        }),
      }),
    );
  });
});

describe("ArticlesService document guards", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async (value) => value),
      findBy: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    };
    const embeddingService = {
      rebuildArticleChunkEmbeddings: jest.fn().mockResolvedValue({
        status: "ready",
        count: 1,
      }),
    };

    const service = new ArticlesService(
      repository as never,
      { findAncestors: jest.fn() } as never,
      { findOne: jest.fn() } as never,
      { findOne: jest.fn() } as never,
      { getOne: jest.fn() } as never,
      { repository: { findBy: jest.fn().mockResolvedValue([]) } } as never,
      { getOne: jest.fn() } as never,
      { recordKeyword: jest.fn(), getHotKeywords: jest.fn() } as never,
      { deleteTimeout: jest.fn(), addTimeout: jest.fn() } as never,
      embeddingService as never,
    );

    jest
      .spyOn(
        service as never,
        "validateProjectKnowledgePermissionForSave" as never,
      )
      .mockResolvedValue(undefined);

    return { service, repository, embeddingService };
  };

  it("提取 Isle JSON 嵌套节点纯文本并按块分隔", () => {
    const { service } = createService();

    const plainText = (service as never).extractPlainTextFromDocument({
      type: "doc",
      content: [
        {
          type: "heading",
          content: [
            { type: "text", text: "主" },
            { type: "text", text: "标题" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "第一段" },
            { type: "text", text: "说明" },
          ],
        },
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "待办一" }],
                },
              ],
            },
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "待办二" }],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(plainText).toBe("主标题 第一段说明 待办一 待办二");
  });

  it("中文连续文本被拆成多个 text 节点时不插空格", () => {
    const { service } = createService();

    const plainText = (service as never).extractPlainTextFromDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "这是" },
            { type: "text", text: "一段" },
            { type: "text", text: "连续" },
            { type: "text", text: "中文" },
          ],
        },
      ],
    });

    expect(plainText).toBe("这是一段连续中文");
  });

  it("标点前不额外插入空格", () => {
    const { service } = createService();

    const plainText = (service as never).extractPlainTextFromDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "你好" },
            { type: "text", text: "，世界" },
            { type: "text", text: "！" },
          ],
        },
      ],
    });

    expect(plainText).toBe("你好，世界！");
  });

  it("提取纯文本时忽略非文本节点且不抛异常", () => {
    const { service } = createService();

    expect(() =>
      (service as never).extractPlainTextFromDocument({
        type: "doc",
        content: [
          {
            type: "heading",
            content: [{ type: "text", text: "标题" }],
          },
          {
            type: "image",
            attrs: { src: "https://example.com/demo.png" },
          },
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: "任务正文" },
                      { type: "divider" },
                      { type: "attachment", attrs: { name: "spec.pdf" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).not.toThrow();

    expect(
      (service as never).extractPlainTextFromDocument({
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/demo.png" },
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "保留正文" }, { type: "divider" }],
          },
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "attachment", attrs: { name: "附件" } },
                      { type: "text", text: "任务内容" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toBe("保留正文 任务内容");
  });

  it("新增合法文档时写入 ready 状态和版本", async () => {
    const { service, repository } = createService();

    const result = await service.save({
      title: "知识卡片",
      content: "<p>旧内容</p>",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "新的知识正文" }],
          },
        ],
      },
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contentVersion: 1,
        contentStatus: "ready",
      }),
    );
    expect(result.contentVersion).toBe(1);
    expect(result.contentStatus).toBe("ready");
    expect(result.contentText).toContain("新的知识正文");
    expect(result.contentChunks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("新的知识正文"),
        }),
      ]),
    );
  });

  it("基于 contentJson 生成带标题路径和长度估算的结构化切片", async () => {
    const { service, repository } = createService();

    const result = await service.save({
      id: "article-1",
      title: "项目复盘知识",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "项目复盘" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "风险总结" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "这里是风险内容，需要沉淀到知识库。" },
            ],
          },
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "记录阻塞项" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      contentVersion: 1,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contentChunks: expect.arrayContaining([
          expect.objectContaining({
            id: "article-1:1:1",
            order: 1,
            title: "风险总结",
            headingPath: ["项目复盘", "风险总结"],
            text: expect.stringContaining("这里是风险内容"),
            tokenEstimate: expect.any(Number),
          }),
        ]),
      }),
    );
    expect(result.contentChunks[0].headingPath).toEqual([
      "项目复盘",
      "风险总结",
    ]);
  });

  it("保存知识后同步重建 mock embedding 并更新 ready 状态", async () => {
    const { service, repository, embeddingService } = createService();

    const result = await service.save({
      id: "article-embed-1",
      title: "向量知识",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "需要生成 mock 向量" }],
          },
        ],
      },
      contentVersion: 1,
    });

    expect(embeddingService.rebuildArticleChunkEmbeddings).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: "article-embed-1",
        embeddingVersion: 1,
        chunks: expect.any(Array),
      }),
    );
    expect(result.embeddingStatus).toBe("ready");
    expect(repository.update).toHaveBeenCalledWith("article-embed-1", {
      embeddingStatus: "ready",
    });
  });

  it("手动重建向量失败时记录 failed 状态和错误原因", async () => {
    const { service, repository, embeddingService } = createService();
    jest.spyOn(service as never, "getOne" as never).mockResolvedValue({
      id: "article-embed-2",
      contentChunks: [{ id: "c1", order: 1, title: "片段", text: "正文" }],
      embeddingVersion: 1,
    });
    embeddingService.rebuildArticleChunkEmbeddings.mockRejectedValueOnce(
      new Error("mock failed"),
    );

    await expect(service.rebuildEmbeddings("article-embed-2")).rejects.toThrow(
      "mock failed",
    );
    expect(repository.update).toHaveBeenCalledWith("article-embed-2", {
      embeddingStatus: "failed",
    });
  });

  it("结构化切片会限制过长内容长度", () => {
    const { service } = createService();
    const longText = Array.from(
      { length: 120 },
      () => "这是一段很长的项目复盘风险内容",
    ).join("。");

    const chunks = (service as never).buildStructuredContentChunks(
      {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "长文档" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: longText }],
          },
        ],
      },
      "article-2",
      3,
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(
      Math.max(...chunks.map((chunk) => chunk.text.length)),
    ).toBeLessThanOrEqual(900);
    expect(chunks.every((chunk) => chunk.headingPath.includes("长文档"))).toBe(
      true,
    );
  });

  it("非 ready 文档禁止更新", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "article-1",
      contentStatus: "legacy_html",
      catalogId: "catalog-1",
    });

    await expect(
      service.save({
        id: "article-1",
        title: "知识卡片",
        contentJson: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "新的知识正文" }],
            },
          ],
        },
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: "DOCUMENT_LEGACY_READONLY" }),
      }),
    );
  });

  it("重建切片时优先从 contentJson 提取纯文本", async () => {
    const { service, repository } = createService();
    jest.spyOn(service as never, "getOne" as never).mockResolvedValue({
      id: "article-1",
      title: "知识卡片",
      contentStatus: "ready",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "从 JSON 重建切片" }],
          },
        ],
      },
      content: "",
      contentText: "",
      contentChunks: [],
      embeddingVersion: 1,
      tags: [],
    });
    jest
      .spyOn(service as never, "checkArticleAccess" as never)
      .mockReturnValue({ hasAccess: true });
    jest
      .spyOn(service as never, "getCurrentUserRoleIds" as never)
      .mockResolvedValue([]);

    const result = await service.rebuildChunks("article-1", {
      id: "user-1",
      name: "tester",
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contentText: "从 JSON 重建切片",
        contentChunks: expect.arrayContaining([
          expect.objectContaining({ text: "从 JSON 重建切片" }),
        ]),
      }),
    );
    expect(result.contentText).toBe("从 JSON 重建切片");
  });

  it("AI 检索评分返回字段命中和运营加权明细", () => {
    const { service } = createService();

    const detail = (service as never).calculateAiRetrieveScore(
      {
        title: "项目复盘风险总结",
        keywords: "复盘,风险",
        summary: "沉淀项目风险复盘经验",
        aiPreferred: "1",
        authorityLevel: "1",
        retrievalWeight: 6,
        updateTime: new Date().toISOString(),
      },
      {
        title: "风险处理",
        text: "项目复盘时需要记录阻塞和风险处理过程",
        summary: "风险处理过程",
      },
      "项目复盘风险",
    );

    expect(detail.finalScore).toBeGreaterThan(detail.keywordScore);
    expect(detail.keywordScore).toBeGreaterThan(0);
    expect(detail.aiPreferredBonus).toBe(5);
    expect(detail.authorityBonus).toBe(4);
    expect(detail.retrievalWeightBonus).toBe(3);
    expect(detail.matchedTerms).toEqual(
      expect.arrayContaining(["项目", "复盘", "风险"]),
    );
    expect(detail.matchedFields).toEqual(
      expect.arrayContaining(["title", "keywords", "summary", "chunkText"]),
    );
  });

  it("AI 检索按中文短语生成可命中的检索词", () => {
    const { service } = createService();

    const terms = (service as never).getAiRetrieveTerms("项目复盘风险");

    expect(terms).toEqual(
      expect.arrayContaining(["项目", "复盘", "风险", "项目复盘", "复盘风险"]),
    );
  });

  it("无查看权限时列表脱敏应清空 contentJson 和切片", async () => {
    const { service } = createService();
    jest
      .spyOn(service as never, "checkArticleAccess" as never)
      .mockReturnValue({
        hasAccess: false,
        canBorrow: false,
        isRestricted: true,
        accessSource: "none",
      });
    jest
      .spyOn(service as never, "getProjectKnowledgeContext" as never)
      .mockResolvedValue(null);
    jest
      .spyOn(service as never, "getArticlePermissions" as never)
      .mockResolvedValue({ canEdit: false });

    const maskedArticle = await (service as never).maskArticleForCurrentUser(
      {
        id: "article-1",
        catalogId: "catalog-1",
        summary: "原摘要",
        desc: "原描述",
        content: "<p>旧正文</p>",
        contentJson: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "机密正文" }],
            },
          ],
        },
        contentText: "机密正文",
        contentChunks: [
          { order: 1, title: "片段 1", text: "机密正文", summary: "机密正文" },
        ],
      },
      "user-1",
      [],
      false,
    );

    expect(maskedArticle.content).toBe("");
    expect(maskedArticle.contentJson).toBeNull();
    expect(maskedArticle.contentText).toBe("");
    expect(maskedArticle.contentChunks).toEqual([]);
  });
});
