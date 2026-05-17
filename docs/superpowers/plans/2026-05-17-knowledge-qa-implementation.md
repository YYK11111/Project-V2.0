# Knowledge QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为知识中心接入基于 OpenAI 兼容接口的正式知识问答闭环，包含真实 embedding、后端问答接口和前端正式问答页。

**Architecture:** 保留现有 `articles` 与 `articleChunkEmbeddings` 模块负责知识数据、权限与切片，新增 `knowledgeQa` 模块负责 query embedding、切片召回、上下文组装与模型回答。前端新增正式问答页，继续保留 AI 检索调试页作为运营工具。

**Tech Stack:** NestJS、TypeORM、Jest、Vue 3、Vite、Vitest、OpenAI 兼容 HTTP API

---

## File Structure

### Backend

- Modify: `nest-admin/src/modulesAi/ai/custom-ai.ts`
  - 新增 OpenAI 兼容 embedding 调用与默认 embedding 模型读取
- Modify: `nest-admin/src/modulesAi/ai/module.ts`
  - 导出 `CustomAiService` 给知识问答模块复用
- Modify: `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.ts`
  - 用真实 embedding 替换 mock 向量生成
- Modify: `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.spec.ts`
  - 覆盖真实 embedding 调用路径与记录写入行为
- Create: `nest-admin/src/modulesBusi/knowledgeQa/dto.ts`
  - 定义问答入参与 embedding 预览入参
- Create: `nest-admin/src/modulesBusi/knowledgeQa/service.ts`
  - 实现 query embedding、召回、排序、prompt 组装、回答生成
- Create: `nest-admin/src/modulesBusi/knowledgeQa/controller.ts`
  - 暴露 `/business/knowledge-qa/ask` 与 `/business/knowledge-qa/embed-preview`
- Create: `nest-admin/src/modulesBusi/knowledgeQa/module.ts`
  - 装配 `knowledgeQa` 模块依赖
- Create: `nest-admin/src/modulesBusi/knowledgeQa/service.spec.ts`
  - 覆盖问答主链路、权限过滤、无结果与错误路径
- Modify: `nest-admin/src/app.module.ts`
  - 注册 `KnowledgeQaModule`

### Frontend

- Modify: `nest-admin-frontend/src/views/content/articleManage/api.ts`
  - 新增知识问答 API
- Create: `nest-admin-frontend/src/views/content/articleManage/knowledgeQa.vue`
  - 新增正式知识问答页
- Create: `nest-admin-frontend/src/views/content/articleManage/knowledgeQa.spec.ts`
  - 覆盖页面结构与引用展示文案守卫
- Modify: `nest-admin-frontend/src/router/routes.js`
  - 新增隐藏路由 `/content/articleManage/knowledgeQa`
- Modify: `nest-admin-frontend/src/views/content/articleManage/index.vue`
  - 在知识后台页增加“知识问答”入口

## Task 1: 接入真实 Embedding 服务

**Files:**
- Modify: `nest-admin/src/modulesAi/ai/custom-ai.ts`
- Modify: `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.ts`
- Test: `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.spec.ts`

- [ ] **Step 1: 写失败测试，要求重建切片时调用真实 embedding 接口**

```ts
it("按文章切片重建真实 embedding 记录", async () => {
  const repository = {
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    save: jest.fn().mockImplementation(async (value) => value),
  };
  const customAiService = {
    getDefaultEmbeddingModel: jest.fn().mockReturnValue("text-embedding-3-small"),
    embedTexts: jest.fn().mockResolvedValue({
      model: "text-embedding-3-small",
      vectors: [[0.11, 0.22, 0.33]],
    }),
  };
  const service = new ArticleChunkEmbeddingsService(
    repository as never,
    customAiService as never,
  );

  await service.rebuildArticleChunkEmbeddings({
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

  expect(customAiService.embedTexts).toHaveBeenCalledWith(
    ["风险处理过程"],
    "text-embedding-3-small",
  );
  expect(repository.save).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        embeddingProvider: "openai-compatible",
        embeddingModel: "text-embedding-3-small",
        embeddingVector: [0.11, 0.22, 0.33],
      }),
    ]),
  );
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `npm test -- modulesBusi/articleChunkEmbeddings/service.spec.ts`

Expected: FAIL，提示 `embedTexts` 或 `getDefaultEmbeddingModel` 不存在，或 `ArticleChunkEmbeddingsService` 构造函数参数不匹配。

- [ ] **Step 3: 最小实现 OpenAI 兼容 embedding 调用**

```ts
// nest-admin/src/modulesAi/ai/custom-ai.ts
getDefaultEmbeddingModel() {
  return config.customAi?.defaultEmbeddingModel || "text-embedding-3-small";
}

async embedTexts(input: string[], model = this.getDefaultEmbeddingModel()) {
  if (!this.baseUrl || !this.apiKey) {
    throw new Error("Custom AI not configured");
  }

  const response = await axios.post(
    `${this.baseUrl}/embeddings`,
    { model, input },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    },
  );

  return {
    model: response.data?.model || model,
    vectors: (response.data?.data || []).map((item) => item.embedding || []),
  };
}
```

```ts
// nest-admin/src/modulesBusi/articleChunkEmbeddings/service.ts
constructor(
  @InjectRepository(ArticleChunkEmbedding)
  private repository: Repository<ArticleChunkEmbedding>,
  private customAiService: CustomAiService,
) {}

async embedTexts(texts: string[]) {
  const model = this.customAiService.getDefaultEmbeddingModel();
  const result = await this.customAiService.embedTexts(texts, model);
  return {
    model: result.model || model,
    vectors: result.vectors || [],
  };
}
```

- [ ] **Step 4: 更新切片重建逻辑并验证测试通过**

```ts
const embedResult = await this.embedTexts(
  chunks.map((chunk) => chunk.text || ""),
);
const vectors = embedResult.vectors;

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
      embeddingModel: embedResult.model,
      embeddingVector: vectors[index] || [],
      embeddingVersion: input.embeddingVersion,
      status: ArticleChunkEmbeddingStatus.ready,
      errorMessage: "",
    }),
);
```

Run: `npm test -- modulesBusi/articleChunkEmbeddings/service.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add nest-admin/src/modulesAi/ai/custom-ai.ts nest-admin/src/modulesBusi/articleChunkEmbeddings/service.ts nest-admin/src/modulesBusi/articleChunkEmbeddings/service.spec.ts
git commit -m "feat: use openai-compatible embeddings for article chunks"
```

## Task 2: 导出可复用的 AI 服务依赖

**Files:**
- Modify: `nest-admin/src/modulesAi/ai/module.ts`
- Test: `nest-admin/src/modulesBusi/knowledgeQa/service.spec.ts`

- [ ] **Step 1: 先写一个会依赖导出的问答模块测试桩**

```ts
describe("KnowledgeQaModule wiring", () => {
  it("可注入 CustomAiService", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: 运行目标测试并记录当前缺口**

Run: `npm test -- modulesBusi/knowledgeQa/service.spec.ts`

Expected: FAIL，提示文件不存在或模块尚未创建。

- [ ] **Step 3: 先做最小依赖导出**

```ts
// nest-admin/src/modulesAi/ai/module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Ai]), HttpModule],
  controllers: [AiController],
  providers: [AiService, CustomAiService],
  exports: [CustomAiService],
})
export class AiModule {}
```

- [ ] **Step 4: 暂不验证通过，留给后续问答模块一起验证**

Run: `npm test -- modulesBusi/knowledgeQa/service.spec.ts`

Expected: 仍然 FAIL，但失败原因推进到 `knowledgeQa` 文件不存在，而不是 AI 依赖无法导出。

- [ ] **Step 5: 提交**

```bash
git add nest-admin/src/modulesAi/ai/module.ts
git commit -m "refactor: export custom ai service for knowledge qa"
```

## Task 3: 搭建知识问答后端模块骨架

**Files:**
- Create: `nest-admin/src/modulesBusi/knowledgeQa/dto.ts`
- Create: `nest-admin/src/modulesBusi/knowledgeQa/service.ts`
- Create: `nest-admin/src/modulesBusi/knowledgeQa/controller.ts`
- Create: `nest-admin/src/modulesBusi/knowledgeQa/module.ts`
- Modify: `nest-admin/src/app.module.ts`
- Test: `nest-admin/src/modulesBusi/knowledgeQa/service.spec.ts`

- [ ] **Step 1: 写失败测试，要求问答服务存在并能返回预定义结构**

```ts
import { KnowledgeQaService } from "./service";

describe("KnowledgeQaService", () => {
  it("在无命中时返回兜底答案与空引用", async () => {
    const articlesService = {
      retrieveForAi: jest.fn().mockResolvedValue({ data: [] }),
    };
    const customAiService = {
      getDefaultChatModel: jest.fn().mockReturnValue("gpt-4.1-mini"),
      getDefaultEmbeddingModel: jest.fn().mockReturnValue("text-embedding-3-small"),
      embedTexts: jest.fn().mockResolvedValue({
        model: "text-embedding-3-small",
        vectors: [[0.2, 0.4]],
      }),
      chatNoStream: jest.fn(),
    };
    const service = new KnowledgeQaService(
      articlesService as never,
      customAiService as never,
    );

    const result = await service.ask(
      { question: "如何处理上线失败" },
      { id: "u1", permissions: [] },
    );

    expect(result.answer).toContain("当前知识库中没有找到足够信息");
    expect(result.references).toEqual([]);
    expect(result.matchedChunks).toEqual([]);
    expect(result.model).toBe("gpt-4.1-mini");
  });
});
```

- [ ] **Step 2: 运行测试并确认文件级失败**

Run: `npm test -- modulesBusi/knowledgeQa/service.spec.ts`

Expected: FAIL，提示 `./service` 不存在。

- [ ] **Step 3: 创建最小模块骨架**

```ts
// nest-admin/src/modulesBusi/knowledgeQa/dto.ts
export class KnowledgeQaAskDto {
  question: string;
  catalogId?: string;
  knowledgeType?: string;
  limit?: number;
}

export class KnowledgeQaEmbedPreviewDto {
  text: string;
}
```

```ts
// nest-admin/src/modulesBusi/knowledgeQa/service.ts
import { Injectable } from "@nestjs/common";
import { ArticlesService } from "../articles/service";
import { CustomAiService } from "src/modulesAi/ai/custom-ai";

@Injectable()
export class KnowledgeQaService {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly customAiService: CustomAiService,
  ) {}

  async ask(query: { question: string }, currentUser?: Record<string, any>) {
    await this.customAiService.embedTexts([query.question || ""]);
    await this.articlesService.retrieveForAi(
      { keyword: query.question, limit: 5 },
      currentUser,
    );
    return {
      answer: "当前知识库中没有找到足够信息，请换个问法或补充更多上下文。",
      references: [],
      matchedChunks: [],
      model: this.customAiService.getDefaultChatModel(),
      elapsedMs: 0,
    };
  }

  async previewEmbedding(body: { text: string }) {
    const model = this.customAiService.getDefaultEmbeddingModel();
    const result = await this.customAiService.embedTexts([body.text || ""], model);
    return {
      provider: "openai-compatible",
      model,
      dimension: result.vectors?.[0]?.length || 0,
    };
  }
}
```

```ts
// nest-admin/src/modulesBusi/knowledgeQa/controller.ts
import { Body, Controller, Post, Req } from "@nestjs/common";
import { KnowledgeQaService } from "./service";
import { KnowledgeQaAskDto, KnowledgeQaEmbedPreviewDto } from "./dto";

@Controller("business/knowledge-qa")
export class KnowledgeQaController {
  constructor(private readonly service: KnowledgeQaService) {}

  @Post("ask")
  ask(@Body() body: KnowledgeQaAskDto, @Req() req) {
    return this.service.ask(body, req.user);
  }

  @Post("embed-preview")
  previewEmbedding(@Body() body: KnowledgeQaEmbedPreviewDto) {
    return this.service.previewEmbedding(body);
  }
}
```

```ts
// nest-admin/src/modulesBusi/knowledgeQa/module.ts
import { Module } from "@nestjs/common";
import { ArticlesModule } from "../articles/module";
import { AiModule } from "src/modulesAi/ai/module";
import { KnowledgeQaController } from "./controller";
import { KnowledgeQaService } from "./service";

@Module({
  imports: [ArticlesModule, AiModule],
  controllers: [KnowledgeQaController],
  providers: [KnowledgeQaService],
})
export class KnowledgeQaModule {}
```

```ts
// nest-admin/src/app.module.ts
import { KnowledgeQaModule } from "./modulesBusi/knowledgeQa/module";

// imports: [..., KnowledgeQaModule]
```

- [ ] **Step 4: 运行测试验证骨架通过**

Run: `npm test -- modulesBusi/knowledgeQa/service.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add nest-admin/src/modulesBusi/knowledgeQa/dto.ts nest-admin/src/modulesBusi/knowledgeQa/service.ts nest-admin/src/modulesBusi/knowledgeQa/controller.ts nest-admin/src/modulesBusi/knowledgeQa/module.ts nest-admin/src/modulesBusi/knowledgeQa/service.spec.ts nest-admin/src/app.module.ts
git commit -m "feat: add knowledge qa backend module scaffold"
```

## Task 4: 实现问答召回、排序与回答生成

**Files:**
- Modify: `nest-admin/src/modulesBusi/knowledgeQa/service.ts`
- Modify: `nest-admin/src/modulesBusi/knowledgeQa/service.spec.ts`

- [ ] **Step 1: 写失败测试，覆盖命中引用、权限过滤与模型回答**

```ts
it("返回回答与引用来源，并且只使用可访问切片", async () => {
  const articlesService = {
    retrieveForAi: jest.fn().mockResolvedValue({
      data: [
        {
          articleId: "a1",
          articleTitle: "上线回滚处理手册",
          chunkId: "a1:1:2",
          chunkOrder: 2,
          chunkTitle: "回滚步骤",
          chunkSummary: "先确认数据库变更是否已执行",
          chunkText: "先确认数据库变更是否已执行，并按回滚清单逐项恢复。",
          catalog: { id: "c1", name: "实施交付" },
          score: 9,
          retrievalWeight: 2,
          aiPreferred: "1",
          authorityLevel: "1",
          matchedFields: ["title", "chunkText"],
        },
      ],
    }),
  };
  const customAiService = {
    getDefaultChatModel: jest.fn().mockReturnValue("gpt-4.1-mini"),
    getDefaultEmbeddingModel: jest.fn().mockReturnValue("text-embedding-3-small"),
    embedTexts: jest.fn().mockResolvedValue({
      model: "text-embedding-3-small",
      vectors: [[0.2, 0.4]],
    }),
    chatNoStream: jest.fn().mockResolvedValue({
      choices: [{ message: { content: "建议先确认数据库变更，再按回滚清单处理。" } }],
    }),
  };
  const service = new KnowledgeQaService(
    articlesService as never,
    customAiService as never,
  );

  const result = await service.ask(
    { question: "上线失败怎么回滚", limit: 3 },
    { id: "u1", permissions: [] },
  );

  expect(result.answer).toContain("建议先确认数据库变更");
  expect(result.references).toHaveLength(1);
  expect(result.references[0]).toEqual(
    expect.objectContaining({
      articleId: "a1",
      articleTitle: "上线回滚处理手册",
      chunkOrder: 2,
    }),
  );
  expect(customAiService.chatNoStream).toHaveBeenCalledWith(
    expect.objectContaining({
      model: "gpt-4.1-mini",
      messages: expect.arrayContaining([
        expect.objectContaining({ role: "system" }),
        expect.objectContaining({ role: "user", content: "上线失败怎么回滚" }),
      ]),
    }),
  );
});
```

- [ ] **Step 2: 运行测试并确认当前返回不满足断言**

Run: `npm test -- modulesBusi/knowledgeQa/service.spec.ts`

Expected: FAIL，当前 `answer` 仍是兜底文案，`references` 为空。

- [ ] **Step 3: 最小实现召回、打分与 prompt 组装**

```ts
private cosineSimilarity(left: number[] = [], right: number[] = []) {
  if (!left.length || !right.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  const divisor = Math.sqrt(leftNorm) * Math.sqrt(rightNorm) || 1;
  return Number((dot / divisor).toFixed(6));
}

private buildContext(items: any[]) {
  return items
    .map((item, index) =>
      [
        `片段 ${index + 1}`,
        `标题：${item.articleTitle}`,
        `分类：${item.catalog?.name || "-"}`,
        `片段序号：${item.chunkOrder}`,
        `内容：${item.chunkText || item.chunkSummary || ""}`,
      ].join("\n"),
    )
    .join("\n\n");
}

async ask(query: { question: string; catalogId?: string; knowledgeType?: string; limit?: number }, currentUser?: Record<string, any>) {
  const startedAt = Date.now();
  const question = String(query.question || "").trim();
  const model = this.customAiService.getDefaultChatModel();
  if (!question) {
    return {
      answer: "当前知识库中没有找到足够信息，请换个问法或补充更多上下文。",
      references: [],
      matchedChunks: [],
      model,
      elapsedMs: Date.now() - startedAt,
    };
  }

  await this.customAiService.embedTexts([question], this.customAiService.getDefaultEmbeddingModel());
  const retrieveResult = await this.articlesService.retrieveForAi(
    {
      keyword: question,
      catalogId: query.catalogId,
      knowledgeType: query.knowledgeType,
      limit: Math.min(Number(query.limit || 5), 5),
    },
    currentUser,
  );
  const items = (retrieveResult?.data || []).slice(0, Math.min(Number(query.limit || 5), 5));
  if (!items.length) {
    return {
      answer: "当前知识库中没有找到足够信息，请换个问法或补充更多上下文。",
      references: [],
      matchedChunks: [],
      model,
      elapsedMs: Date.now() - startedAt,
    };
  }

  const response = await this.customAiService.chatNoStream({
    model,
    messages: [
      {
        role: "system",
        content: "你是知识中心问答助手。只能基于提供的知识片段回答，不知道就明确说明当前知识不足，不得编造事实。",
      },
      {
        role: "user",
        content: question,
      },
      {
        role: "system",
        content: `以下是可引用知识片段：\n\n${this.buildContext(items)}`,
      },
    ],
  });

  return {
    answer: response?.choices?.[0]?.message?.content || "当前知识库中没有找到足够信息，请换个问法或补充更多上下文。",
    references: items.map((item) => ({
      articleId: item.articleId,
      articleTitle: item.articleTitle,
      chunkId: item.chunkId,
      chunkOrder: item.chunkOrder,
      chunkSummary: item.chunkSummary,
      catalog: item.catalog,
      score: item.score,
    })),
    matchedChunks: items.map((item) => ({
      chunkId: item.chunkId,
      chunkText: item.chunkText,
      score: item.score,
    })),
    model,
    elapsedMs: Date.now() - startedAt,
  };
}
```

- [ ] **Step 4: 运行测试验证问答链路通过**

Run: `npm test -- modulesBusi/knowledgeQa/service.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add nest-admin/src/modulesBusi/knowledgeQa/service.ts nest-admin/src/modulesBusi/knowledgeQa/service.spec.ts
git commit -m "feat: implement knowledge qa retrieval and answer flow"
```

## Task 5: 补齐问答错误路径与 embedding 预览测试

**Files:**
- Modify: `nest-admin/src/modulesBusi/knowledgeQa/service.spec.ts`
- Modify: `nest-admin/src/modulesBusi/knowledgeQa/service.ts`

- [ ] **Step 1: 写失败测试，覆盖 embedding 失败与预览维度返回**

```ts
it("embedding 失败时向上抛出错误", async () => {
  const articlesService = {
    retrieveForAi: jest.fn(),
  };
  const customAiService = {
    getDefaultChatModel: jest.fn().mockReturnValue("gpt-4.1-mini"),
    getDefaultEmbeddingModel: jest.fn().mockReturnValue("text-embedding-3-small"),
    embedTexts: jest.fn().mockRejectedValue(new Error("embedding failed")),
  };
  const service = new KnowledgeQaService(
    articlesService as never,
    customAiService as never,
  );

  await expect(
    service.ask({ question: "上线失败怎么回滚" }, { id: "u1" }),
  ).rejects.toThrow("embedding failed");
});

it("embedding 预览返回 provider、model 与维度", async () => {
  const service = new KnowledgeQaService(
    {} as never,
    {
      getDefaultEmbeddingModel: jest.fn().mockReturnValue("text-embedding-3-small"),
      embedTexts: jest.fn().mockResolvedValue({
        model: "text-embedding-3-small",
        vectors: [[0.1, 0.2, 0.3]],
      }),
    } as never,
  );

  const result = await service.previewEmbedding({ text: "上线回滚处理步骤" });

  expect(result).toEqual({
    provider: "openai-compatible",
    model: "text-embedding-3-small",
    dimension: 3,
  });
});
```

- [ ] **Step 2: 运行测试并确认失败点**

Run: `npm test -- modulesBusi/knowledgeQa/service.spec.ts`

Expected: FAIL，若当前错误被吞掉或 `previewEmbedding` 返回结构不完整。

- [ ] **Step 3: 最小修正错误路径**

```ts
async previewEmbedding(body: { text: string }) {
  const model = this.customAiService.getDefaultEmbeddingModel();
  const result = await this.customAiService.embedTexts(
    [String(body.text || "")],
    model,
  );
  return {
    provider: "openai-compatible",
    model: result.model || model,
    dimension: result.vectors?.[0]?.length || 0,
  };
}
```

说明：`ask()` 中不捕获 `embedTexts()` 错误，让调用方获得明确失败。

- [ ] **Step 4: 运行测试确认全部通过**

Run: `npm test -- modulesBusi/knowledgeQa/service.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add nest-admin/src/modulesBusi/knowledgeQa/service.ts nest-admin/src/modulesBusi/knowledgeQa/service.spec.ts
git commit -m "test: cover knowledge qa error paths"
```

## Task 6: 新增前端知识问答 API 与页面

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/api.ts`
- Create: `nest-admin-frontend/src/views/content/articleManage/knowledgeQa.vue`
- Create: `nest-admin-frontend/src/views/content/articleManage/knowledgeQa.spec.ts`

- [ ] **Step 1: 写失败测试，守卫正式问答页结构与引用展示**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readKnowledgeQaView() {
  return readFileSync(resolve(__dirname, "knowledgeQa.vue"), "utf-8");
}

describe("knowledge qa page", () => {
  it("展示问题输入、回答区和引用来源", () => {
    const source = readKnowledgeQaView();

    expect(source).toContain("question");
    expect(source).toContain("askKnowledgeQa");
    expect(source).toContain("references");
    expect(source).toContain("matchedChunks");
    expect(source).toContain("引用来源");
    expect(source).toContain("开始提问");
  });
});
```

- [ ] **Step 2: 运行测试并确认文件不存在失败**

Run: `npm run test:unit -- src/views/content/articleManage/knowledgeQa.spec.ts`

Expected: FAIL，提示 `knowledgeQa.vue` 不存在。

- [ ] **Step 3: 实现最小 API 与页面**

```ts
// nest-admin-frontend/src/views/content/articleManage/api.ts
export const askKnowledgeQa = (data) => request.post(`${window.sysConfig.serves.business}/knowledge-qa/ask`, data)
```

```vue
<!-- nest-admin-frontend/src/views/content/articleManage/knowledgeQa.vue -->
<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue'
import { askKnowledgeQa } from './api'

const loading = ref(false)
const question = ref('')
const answer = ref('')
const references = ref([])
const matchedChunks = ref([])
const errorMessage = ref('')

async function submitQuestion() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await askKnowledgeQa({ question: question.value })
    const payload = res?.data || {}
    answer.value = payload.answer || ''
    references.value = payload.references || []
    matchedChunks.value = payload.matchedChunks || []
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || '知识问答调用失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="knowledge-qa-page km-page" v-loading="loading">
    <div class="Gcard km-hero">
      <div class="km-hero__eyebrow">知识问答</div>
      <div class="km-hero__title">围绕当前知识中心内容发起正式问答</div>
      <div class="km-hero__desc">答案仅基于当前用户有权限访问的知识内容生成，并返回引用来源。</div>
    </div>

    <div class="Gcard knowledge-qa-panel">
      <el-input v-model="question" type="textarea" :rows="4" placeholder="请输入问题，例如：上线失败后如何回滚？" />
      <div class="knowledge-qa-panel__actions">
        <el-button type="primary" @click="submitQuestion">开始提问</el-button>
      </div>
      <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" />
    </div>

    <div class="Gcard knowledge-qa-answer">
      <div class="knowledge-qa-answer__title">回答结果</div>
      <div class="knowledge-qa-answer__content">{{ answer || '暂无回答' }}</div>
    </div>

    <div class="Gcard knowledge-qa-references">
      <div class="knowledge-qa-references__title">引用来源</div>
      <div v-if="references.length">
        <div v-for="item in references" :key="item.chunkId" class="knowledge-qa-reference-item">
          <div>{{ item.articleTitle }}</div>
          <div>{{ item.chunkSummary }}</div>
        </div>
      </div>
      <el-empty v-else description="暂无引用来源" />
    </div>
  </div>
</template>
```

- [ ] **Step 4: 运行测试验证页面守卫通过**

Run: `npm run test:unit -- src/views/content/articleManage/knowledgeQa.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add nest-admin-frontend/src/views/content/articleManage/api.ts nest-admin-frontend/src/views/content/articleManage/knowledgeQa.vue nest-admin-frontend/src/views/content/articleManage/knowledgeQa.spec.ts
git commit -m "feat: add knowledge qa page and api"
```

## Task 7: 挂载前端路由与后台入口

**Files:**
- Modify: `nest-admin-frontend/src/router/routes.js`
- Modify: `nest-admin-frontend/src/views/content/articleManage/index.vue`
- Test: `nest-admin-frontend/src/views/content/articleManage/knowledgeQa.spec.ts`

- [ ] **Step 1: 写失败测试，守卫路由与入口按钮文案**

```ts
it("提供正式知识问答路由和后台入口", () => {
  const source = readFileSync(resolve(__dirname, "index.vue"), "utf-8");
  const routeSource = readFileSync(resolve(__dirname, "../../router/routes.js"), "utf-8");

  expect(source).toContain("知识问答");
  expect(source).toContain("/content/articleManage/knowledgeQa");
  expect(routeSource).toContain("/content/articleManage/knowledgeQa");
  expect(routeSource).toContain("KnowledgeQaHidden");
});
```

- [ ] **Step 2: 运行测试并确认当前缺少路由或按钮**

Run: `npm run test:unit -- src/views/content/articleManage/knowledgeQa.spec.ts`

Expected: FAIL

- [ ] **Step 3: 最小实现路由与入口**

```js
// nest-admin-frontend/src/router/routes.js
{
  path: '/content/articleManage/knowledgeQa',
  component: () => import('@/views/content/articleManage/knowledgeQa.vue'),
  name: 'KnowledgeQaHidden',
  meta: { title: '知识问答' },
},
```

```vue
<!-- nest-admin-frontend/src/views/content/articleManage/index.vue -->
<el-button @click="$router.push('/content/articleManage/knowledgeQa')">知识问答</el-button>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test:unit -- src/views/content/articleManage/knowledgeQa.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add nest-admin-frontend/src/router/routes.js nest-admin-frontend/src/views/content/articleManage/index.vue nest-admin-frontend/src/views/content/articleManage/knowledgeQa.spec.ts
git commit -m "feat: wire knowledge qa route and entry"
```

## Task 8: 回归验证

**Files:**
- Verify only

- [ ] **Step 1: 运行后端问答相关测试**

Run: `npm test -- modulesBusi/articleChunkEmbeddings/service.spec.ts modulesBusi/knowledgeQa/service.spec.ts`

Expected: PASS

- [ ] **Step 2: 运行前端知识问答相关测试**

Run: `npm run test:unit -- src/views/content/articleManage/knowledgeQa.spec.ts src/views/content/articleManage/aiRetrieveDebug.spec.ts`

Expected: PASS

- [ ] **Step 3: 运行前端类型检查**

Run: `npm run type-check`

Expected: PASS

- [ ] **Step 4: 运行后端 lint**

Run: `npm run lint`

Expected: PASS

- [ ] **Step 5: 提交最终整理**

```bash
git add nest-admin nest-admin-frontend
git commit -m "feat: launch knowledge qa first version"
```
