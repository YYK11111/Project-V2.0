# Article Embedding Status V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an embedding status loop for article chunks using a deterministic mock embedding provider, without adding a real vector database or external AI dependency.

**Architecture:** Add a focused `articleChunkEmbeddings` module/entity/service for per-chunk embedding records, inject it into `ArticlesService`, and call it after `save()`, `rebuildChunks()`, and a new `rebuildEmbeddings()` endpoint. The frontend knowledge backend gets a “重建向量” action and API wrapper; AI retrieval/debug continues to consume existing article chunk data.

**Tech Stack:** NestJS, TypeORM, Jest, Vue 3, Vitest source guards, Element Plus.

---

## File Structure

- Create: `nest-admin/src/modulesBusi/articleChunkEmbeddings/entity.ts`
  - Stores one embedding record per article chunk.
- Create: `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.ts`
  - Implements deterministic mock embeddings, upsert records, and status/error handling.
- Create: `nest-admin/src/modulesBusi/articleChunkEmbeddings/module.ts`
  - Exports embedding service and repository.
- Create: `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.spec.ts`
  - Covers deterministic vector generation and upsert behavior.
- Modify: `nest-admin/src/modulesBusi/articles/module.ts`
  - Imports `ArticleChunkEmbeddingsModule`.
- Modify: `nest-admin/src/modulesBusi/articles/service.ts`
  - Injects embedding service, triggers embedding sync after save/rebuild, and exposes rebuild embeddings.
- Modify: `nest-admin/src/modulesBusi/articles/controller.ts`
  - Adds `POST /business/articles/rebuildEmbeddings/:id`.
- Modify: `nest-admin/src/modulesBusi/articles/document.spec.ts`
  - Adds article service tests for status transitions and manual rebuild.
- Modify: `nest-admin-frontend/src/views/content/articleManage/api.ts`
  - Adds `rebuildArticleEmbeddings(id)`.
- Modify: `nest-admin-frontend/src/views/content/articleManage/index.vue`
  - Adds “重建向量” action beside “重建切片”.
- Create or Modify: `nest-admin-frontend/src/views/content/articleManage/aiRetrieveDebug.spec.ts` and `articleManage.index.spec.ts`
  - Guard frontend embedding action and display contracts.

---

### Task 1: Add Embedding Entity And Service

**Files:**
- Create: `nest-admin/src/modulesBusi/articleChunkEmbeddings/entity.ts`
- Create: `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.ts`
- Create: `nest-admin/src/modulesBusi/articleChunkEmbeddings/module.ts`
- Create: `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.spec.ts`

- [ ] **Step 1: Write failing service tests**

Create `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modulesBusi/articleChunkEmbeddings/service.spec.ts
```

Expected: FAIL because the module files do not exist.

- [ ] **Step 3: Create entity**

Create `nest-admin/src/modulesBusi/articleChunkEmbeddings/entity.ts`:

```ts
import { Column } from "typeorm";
import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

export enum ArticleChunkEmbeddingStatus {
  pending = "pending",
  ready = "ready",
  failed = "failed",
}

@MyEntity("busiArticleChunkEmbedding")
export class ArticleChunkEmbedding extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "articleId", comment: "知识ID" })
  articleId: string;

  @BaseColumn({ name: "chunkId", comment: "切片ID" })
  chunkId: string;

  @BaseColumn({ type: "int", name: "chunkOrder", comment: "切片序号" })
  chunkOrder: number;

  @BaseColumn({ name: "chunkTitle", comment: "切片标题" })
  chunkTitle: string;

  @Column({ type: "json", nullable: true, comment: "标题路径" })
  headingPath: string[];

  @BaseColumn({ type: "longtext", name: "chunkText", comment: "切片正文" })
  chunkText: string;

  @BaseColumn({ type: "int", default: 0, name: "tokenEstimate", comment: "长度估算" })
  tokenEstimate: number;

  @BaseColumn({ default: "mock", name: "embeddingProvider", comment: "向量服务提供方" })
  embeddingProvider: string;

  @BaseColumn({ default: "mock-hash-16", name: "embeddingModel", comment: "向量模型" })
  embeddingModel: string;

  @Column({ type: "json", nullable: true, comment: "mock 向量" })
  embeddingVector: number[];

  @BaseColumn({ type: "int", default: 1, name: "embeddingVersion", comment: "向量版本" })
  embeddingVersion: number;

  @BaseColumn({ default: ArticleChunkEmbeddingStatus.pending, comment: "向量状态" })
  status: ArticleChunkEmbeddingStatus;

  @BaseColumn({ type: "longtext", nullable: true, name: "errorMessage", comment: "失败原因" })
  errorMessage: string;
}
```

- [ ] **Step 4: Create service**

Create `nest-admin/src/modulesBusi/articleChunkEmbeddings/service.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ArticleChunkEmbedding,
  ArticleChunkEmbeddingStatus,
} from "./entity";

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
    await this.repository.delete({ articleId: input.articleId } as never);
    if (!chunks.length) {
      return { status: ArticleChunkEmbeddingStatus.ready, count: 0 };
    }

    const vectors = await this.embedTexts(chunks.map((chunk) => chunk.text || ""));
    const records = chunks.map(
      (chunk, index) =>
        new ArticleChunkEmbedding({
          articleId: input.articleId,
          chunkId: chunk.id || `${input.articleId}:${input.embeddingVersion}:${chunk.order}`,
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
    const magnitude = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0)) || 1;
    return vector.map((item) => Number((item / magnitude).toFixed(6)));
  }
}
```

- [ ] **Step 5: Create module**

Create `nest-admin/src/modulesBusi/articleChunkEmbeddings/module.ts`:

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleChunkEmbedding } from "./entity";
import { ArticleChunkEmbeddingsService } from "./service";

@Module({
  imports: [TypeOrmModule.forFeature([ArticleChunkEmbedding])],
  providers: [ArticleChunkEmbeddingsService],
  exports: [ArticleChunkEmbeddingsService, TypeOrmModule],
})
export class ArticleChunkEmbeddingsModule {}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/modulesBusi/articleChunkEmbeddings/service.spec.ts
```

Expected: PASS.

---

### Task 2: Wire Embedding Loop Into Articles Service

**Files:**
- Modify: `nest-admin/src/modulesBusi/articles/module.ts`
- Modify: `nest-admin/src/modulesBusi/articles/service.ts`
- Modify: `nest-admin/src/modulesBusi/articles/controller.ts`
- Modify: `nest-admin/src/modulesBusi/articles/document.spec.ts`

- [ ] **Step 1: Write failing article service tests**

Modify `document.spec.ts` `createService()` to pass a mock embedding service after `tasksService` once the constructor is updated. Add tests:

```ts
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
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ embeddingStatus: "ready" }),
    );
  });

  it("手动重建向量失败时记录 failed 状态和错误原因", async () => {
    const { service, repository, embeddingService } = createService();
    jest.spyOn(service as never, "getOne" as never).mockResolvedValue({
      id: "article-embed-2",
      contentChunks: [{ id: "c1", order: 1, title: "片段", text: "正文" }],
      embeddingVersion: 1,
    });
    embeddingService.rebuildArticleChunkEmbeddings.mockRejectedValueOnce(new Error("mock failed"));

    await expect(service.rebuildEmbeddings("article-embed-2")).rejects.toThrow("mock failed");
    expect(repository.update).toHaveBeenCalledWith("article-embed-2", {
      embeddingStatus: "failed",
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modulesBusi/articles/document.spec.ts
```

Expected: FAIL because `rebuildEmbeddings` and injection do not exist.

- [ ] **Step 3: Import module into articles module**

Modify `nest-admin/src/modulesBusi/articles/module.ts` to import `ArticleChunkEmbeddingsModule` and add it to `imports`.

- [ ] **Step 4: Inject service and sync after save/rebuild**

Modify `ArticlesService` constructor to accept `ArticleChunkEmbeddingsService` after `TasksService`. Add private method:

```ts
  private async syncArticleEmbeddings(article: Article) {
    try {
      const result = await this.articleChunkEmbeddingsService.rebuildArticleChunkEmbeddings({
        articleId: article.id,
        embeddingVersion: Number(article.embeddingVersion || 1),
        chunks: article.contentChunks || [],
      });
      article.embeddingStatus = result.status;
      return result;
    } catch (error) {
      article.embeddingStatus = "failed";
      throw error;
    }
  }
```

After `let res = await super.save(dto);`, call:

```ts
    await this.syncArticleEmbeddings(res);
    await this.repository.update(res.id, { embeddingStatus: res.embeddingStatus } as any);
```

After `article.contentChunks = ...` in `rebuildChunks`, call the same sync before saving.

- [ ] **Step 5: Add manual rebuild method**

Add to `ArticlesService`:

```ts
  async rebuildEmbeddings(id: string) {
    const article = await this.getOne({ where: { id } });
    try {
      const result = await this.articleChunkEmbeddingsService.rebuildArticleChunkEmbeddings({
        articleId: article.id,
        embeddingVersion: Number(article.embeddingVersion || 1),
        chunks: article.contentChunks || [],
      });
      await this.repository.update(id, { embeddingStatus: result.status } as any);
      article.embeddingStatus = result.status;
      return { ...result, articleId: id };
    } catch (error) {
      await this.repository.update(id, { embeddingStatus: "failed" } as any);
      throw error;
    }
  }
```

- [ ] **Step 6: Add controller endpoint**

Add to `ArticlesController`:

```ts
  @Post("rebuildEmbeddings/:id")
  rebuildEmbeddings(@Param("id") id: string) {
    return this.service.rebuildEmbeddings(id);
  }
```

- [ ] **Step 7: Run article tests**

Run:

```bash
npm test -- --runInBand src/modulesBusi/articles/document.spec.ts
```

Expected: PASS.

---

### Task 3: Add Frontend Rebuild Embeddings Action

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/api.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/index.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/articleManage.index.spec.ts`

- [ ] **Step 1: Write failing frontend guard test**

Modify `articleManage.index.spec.ts` and add:

```ts
  it('提供重建向量操作入口', () => {
    const source = readArticleManageView()

    expect(source).toContain('rebuildArticleEmbeddings')
    expect(source).toContain('function rebuildEmbeddings')
    expect(source).toContain('向量重建成功')
    expect(source).toContain('重建向量')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/views/content/articleManage/articleManage.index.spec.ts
```

Expected: FAIL because the action does not exist.

- [ ] **Step 3: Add API wrapper**

Modify `api.ts`:

```ts
export const rebuildArticleEmbeddings = (id) => request.post(`${serve}/rebuildEmbeddings/${id}`)
```

- [ ] **Step 4: Add index action**

Modify `index.vue` import to include `rebuildArticleEmbeddings`. Add function:

```ts
function rebuildEmbeddings(row: any) {
  rebuildArticleEmbeddings(row.id).then(() => {
    $sdk.msgSuccess('向量重建成功')
    rctRef.value?.getList?.()
  })
}
```

Add table operation after “重建切片”:

```vue
<TbOpBtn v-if="canAiOperate" icon="refresh" @click="rebuildEmbeddings(row)">重建向量</TbOpBtn>
```

- [ ] **Step 5: Run frontend guard test**

Run:

```bash
npx vitest run src/views/content/articleManage/articleManage.index.spec.ts
```

Expected: PASS.

---

### Task 4: Final Verification

**Files:** all modified files above.

- [ ] **Step 1: Run backend targeted tests**

```bash
npm test -- --runInBand src/modulesBusi/articleChunkEmbeddings/service.spec.ts src/modulesBusi/articles/document.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run frontend targeted tests**

```bash
npx vitest run src/views/content/articleManage/articleManage.index.spec.ts src/views/content/articleManage/aiRetrieveDebug.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run backend lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Run frontend type check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 5: Run API contract check**

```bash
npm run check:api-contract
```

Expected: PASS.

---

## Self-Review

Spec coverage:

- Chunk embedding records: Task 1 entity/service.
- Mock provider: Task 1 service `embedTexts`.
- Save/rebuild status loop: Task 2.
- Manual rebuild endpoint: Task 2 controller.
- Frontend action: Task 3.
- Tests and verification: Tasks 1-4.

Placeholder scan:

- No placeholders or undefined implementation steps remain.

Type consistency:

- Service name is consistently `ArticleChunkEmbeddingsService`.
- Endpoint is consistently `rebuildEmbeddings`.
- Status values are `pending`, `ready`, `failed`.
