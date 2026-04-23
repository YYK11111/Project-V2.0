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
    );

    jest
      .spyOn(
        service as never,
        "validateProjectKnowledgePermissionForSave" as never,
      )
      .mockResolvedValue(undefined);

    return { service, repository };
  };

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
