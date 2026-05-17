# 知识问答首版设计

## 1. 背景

当前仓库中的知识中心已经具备以下基础能力：

- 知识文章、分类、标签、可见范围、借阅能力
- 基于 `contentJson` 和 `contentText` 的切片生成
- 知识切片向量状态字段与手动重建入口
- AI 检索调试页与知识详情页 AI 诊断区
- OpenAI 兼容聊天配置能力

但当前 AI 知识库链路仍停留在“检索底座 + 调试能力”阶段，尚未形成正式的用户知识问答能力。现有向量实现仍为 mock，正式问答页也尚未落地。

本次首版目标是在不推翻现有知识中心结构的前提下，补齐一个最小可用的正式知识问答闭环。

## 2. 目标

本次设计要交付的能力如下：

1. 将知识切片向量从 mock 替换为真实的 OpenAI 兼容 embedding 调用
2. 新增正式知识问答后端模块，完成提问、召回、上下文组装、模型回答、引用返回
3. 新增正式知识问答前端页面，展示答案与引用来源
4. 继续复用现有知识文章、切片、权限过滤、AI 调试能力

本次设计不包含以下内容：

1. 独立向量数据库接入
2. 批量重建运维面板
3. 检索日志、问答日志、反馈闭环
4. rerank 模型接入
5. 多 provider 切换能力

## 3. 总体方案

首版采用“新模块负责问答链路，旧模块继续负责知识数据”的方案。

现有模块继续承担的职责：

- `articles` 模块负责知识文章 CRUD、权限判断、切片生成、知识检索调试
- `articleChunkEmbeddings` 模块负责切片向量重建
- `modulesAi/custom-ai` 负责 OpenAI 兼容接口调用

本次新增模块承担的职责：

- `knowledgeQa` 模块负责正式知识问答链路
- 负责 query embedding、候选片段召回、相似度排序、prompt 组装、模型问答、引用来源返回

这样可以避免把 CRUD、权限、检索、问答全部继续堆在 `ArticlesService` 中，同时保持对现有知识中心页面与接口的最小侵入。

## 4. 架构边界

### 4.1 后端模块边界

新增 `knowledgeQa` 模块，核心职责限定为以下 4 项：

1. 接收用户问题与可选筛选条件
2. 基于当前用户权限筛选可访问知识候选集
3. 完成 query embedding 与切片相似度排序
4. 调用 OpenAI 兼容 chat completions 生成最终回答

不在 `knowledgeQa` 模块中重复实现以下逻辑：

1. 文章保存与更新
2. 知识切片生成
3. 分类树管理
4. 文章权限规则定义

这些逻辑继续复用现有 `articles` 与 `articleChunkEmbeddings` 模块中的能力。

### 4.2 前端边界

首版新增正式知识问答页面，面向普通知识使用者。

现有调试页继续保留，面向 AI 运营和管理员：

- 正式问答页：用于提问、阅读答案、查看引用
- AI 检索调试页：用于查看命中切片、权重、评分明细

两者职责明确分开，避免把内部调试信息直接暴露为正式用户能力。

## 5. 接口设计

### 5.1 正式知识问答接口

新增接口：

- `POST /business/knowledge-qa/ask`

请求体：

```json
{
  "question": "如何处理上线失败后的回滚？",
  "catalogId": "123",
  "knowledgeType": "troubleshooting",
  "limit": 5
}
```

返回体：

```json
{
  "answer": "根据当前知识库中的上线回滚规范，建议先确认失败范围，再按预设回滚步骤恢复应用与配置。",
  "references": [
    {
      "articleId": "a1",
      "articleTitle": "上线回滚处理手册",
      "chunkId": "a1:1:2",
      "chunkOrder": 2,
      "chunkSummary": "回滚前先确认数据库变更是否已执行。",
      "catalog": {
        "id": "c1",
        "name": "实施交付"
      },
      "score": 0.93
    }
  ],
  "matchedChunks": [
    {
      "chunkId": "a1:1:2",
      "chunkText": "回滚前先确认数据库变更是否已执行，并按回滚清单逐项恢复。",
      "score": 0.93
    }
  ],
  "model": "gpt-4.1-mini",
  "elapsedMs": 812
}
```

### 5.2 Embedding 预览调试接口

新增接口：

- `POST /business/knowledge-qa/embed-preview`

请求体：

```json
{
  "text": "上线回滚处理步骤"
}
```

返回体：

```json
{
  "provider": "openai-compatible",
  "model": "text-embedding-3-small",
  "dimension": 1536
}
```

该接口仅用于排查 embedding 配置是否连通，首版只开放给管理员或 AI 运营能力使用。

### 5.3 继续复用的已有接口

以下接口继续沿用，不重做：

- `POST /business/articles/rebuildEmbeddings/:id`
- `GET /business/articles/retrieveForAi`

其中：

- `rebuildEmbeddings` 用于手动重建文章向量
- `retrieveForAi` 继续服务于 AI 调试页，而不是正式问答页

## 6. 数据流

正式知识问答链路按以下顺序执行：

1. 前端提交问题与筛选条件
2. 后端为问题生成 query embedding
3. 后端基于当前用户权限筛选可访问知识文章
4. 后端读取候选文章的切片向量
5. 后端计算 query 与切片向量的相似度
6. 后端叠加现有 `retrievalWeight`、`aiPreferred`、`authorityLevel` 等运营权重
7. 后端取前 3 到 5 个片段组装上下文
8. 后端调用 OpenAI 兼容 chat completions 生成回答
9. 后端返回答案、引用来源、命中切片与耗时信息

权限过滤必须发生在模型调用之前，不允许将用户无权访问的知识片段喂给模型。

## 7. Embedding 设计

### 7.1 配置

复用现有 OpenAI 兼容配置风格，新增 embedding 专用模型配置：

- `customAi.baseUrl`
- `customAi.apiKey`
- `customAi.defaultChatModel`
- `customAi.defaultEmbeddingModel`

其中：

- `defaultChatModel` 用于正式知识问答生成
- `defaultEmbeddingModel` 用于知识切片与 query 的 embedding

### 7.2 调用方式

在 `custom-ai` 中新增独立的 embedding 调用方法，不与 chat completions 混用。

切片重建时：

- 使用真实 embedding 接口替代 mock 向量
- `embeddingProvider` 记录真实 provider 名称
- `embeddingModel` 记录真实模型名称

首版不引入多 provider 切换能力，默认统一走 OpenAI 兼容接口。

## 8. 召回与排序

### 8.1 候选集

候选集筛选顺序如下：

1. 先按现有知识文章权限过滤用户可访问范围
2. 再按可选 `catalogId` 与 `knowledgeType` 缩小范围
3. 再读取候选文章的切片向量

### 8.2 相似度

首版不引入新库，直接在应用层计算余弦相似度。

### 8.3 融合得分

首版采用固定融合公式：

`finalScore = cosineScore * 0.7 + keywordScore * 0.15 + retrievalWeightBonus * 0.1 + authorityOrAiPreferredBonus * 0.05`

说明：

- `cosineScore`：query 与切片向量余弦相似度
- `keywordScore`：保留现有关键词命中加权能力
- `retrievalWeightBonus`：来自知识文章运营权重
- `authorityOrAiPreferredBonus`：来自权威知识与 AI 优先标记

首版将该公式写死在 service 中，暂不做配置化。

## 9. Prompt 设计

正式知识问答的 prompt 结构如下：

1. `system` 消息：
   - 只允许基于提供的知识片段回答
   - 若知识不足以回答，必须明确说明“不知道”或“当前知识不足”
   - 不得编造未引用的内部事实
2. `user` 消息：
   - 用户原始问题
3. `context` 内容：
   - 取前 3 到 5 个切片
   - 每个切片附带文章标题、分类名称、片段编号、正文摘要或正文

这样可以确保回答结果与引用来源一一对应，便于前端展示。

## 10. 错误处理

首版错误处理规则如下：

1. embedding 调用失败：
   - 问答接口直接返回可识别错误
   - 不做静默降级
2. 检索无结果：
   - 返回空引用与标准兜底回答
   - 不调用模型
3. chat 调用失败：
   - 返回明确错误码与简短提示
4. 权限过滤后无可用知识：
   - 视作无结果处理
   - 不暴露内部知识存在性

## 11. 前端页面设计

首版新增正式知识问答页面，例如：

- `src/views/content/articleManage/knowledgeQa.vue`

页面包含以下最小元素：

1. 提问输入框
2. 提交按钮
3. 回答展示区
4. 引用来源列表
5. 无结果提示
6. 调用失败提示

正式问答页展示的引用来源应支持跳转到知识详情页，复用现有知识详情阅读链路。

现有 AI 调试页继续保留，不作为正式用户入口。

## 12. 测试设计

### 12.1 后端测试

必须先写失败测试，再写实现。至少覆盖以下场景：

1. query embedding 成功时返回回答与引用
2. 无权限知识不会进入引用结果
3. 检索无命中时返回空引用与兜底文案
4. embedding 调用失败时返回预期错误
5. chat 调用失败时返回预期错误

### 12.2 前端测试

最小覆盖以下场景：

1. 问答页能展示答案
2. 问答页能展示引用来源
3. 空结果提示正常显示
4. 调用失败提示正常显示

## 13. 首版交付范围

本次首版完成后，应达到以下验收标准：

1. 保存知识后能生成真实 embedding，不再是 mock 向量
2. 正式知识问答接口可以返回答案与引用来源
3. 正式问答页可以提问并展示答案
4. 无权知识不会被问答链路召回并泄漏
5. 调试页与正式问答页职责分离

## 14. 明确不做项

以下内容明确不纳入本次首版：

1. 向量数据库迁移
2. 批量向量重建调度
3. 检索日志与问答日志
4. 用户反馈闭环
5. 统计面板
6. rerank 能力
7. 多 provider 切换与动态模型选择
