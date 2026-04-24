# 小菜 AI 模型列表调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有 `customAi` 配置追加 6 个“小菜 AI”新模型，并将默认模型切换为 `gpt-5.4`。

**Architecture:** 本次只修改后端静态配置文件 `nest-admin/config/secret.ts`，不调整 provider、接口结构或服务调用逻辑。模型列表继续由 `CustomAiService` 从 `config.customAi.models` 读取，默认模型继续由 `config.customAi.defaultModel` 提供。

**Tech Stack:** NestJS, TypeScript, 静态配置对象

---

## 文件结构

- Modify: `nest-admin/config/secret.ts`
  - 维护 `customAi.models` 静态模型数组
  - 维护 `customAi.defaultModel` 默认模型值
- Reference: `nest-admin/src/modulesAi/ai/custom-ai.ts`
  - 确认读取来源仍为 `config.customAi.models` 和 `config.customAi.defaultModel`
- Reference: `docs/superpowers/specs/2026-04-24-xiaocai-ai-model-list-update-design.md`
  - 作为本次实现范围与约束依据

### Task 1: 更新小菜 AI 静态模型配置

**Files:**
- Modify: `nest-admin/config/secret.ts`
- Reference: `docs/superpowers/specs/2026-04-24-xiaocai-ai-model-list-update-design.md`

- [ ] **Step 1: 确认当前配置起点**

读取 `nest-admin/config/secret.ts`，确认以下现状：

```ts
customAi: {
  baseUrl: 'https://sub.gpt.sulme.xx.kg/v1',
  models: [
    { id: 'gpt-5.1', name: 'GPT-5.1' },
    { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' },
    { id: 'gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max' },
    { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini' },
    { id: 'gpt-5.2', name: 'GPT-5.2' },
    { id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex' },
    { id: 'gpt-5.3', name: 'GPT-5.3' },
    { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex' },
    { id: 'gpt-5.4', name: 'GPT-5.4' },
  ],
  defaultModel: 'gpt-5.1',
}
```

- [ ] **Step 2: 以最小改动追加 6 个新模型并修改默认模型**

将 `nest-admin/config/secret.ts` 中的 `customAi.models` 更新为：

```ts
models: [
  { id: 'gpt-5.1', name: 'GPT-5.1' },
  { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' },
  { id: 'gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max' },
  { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini' },
  { id: 'gpt-5.2', name: 'GPT-5.2' },
  { id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex' },
  { id: 'gpt-5.3', name: 'GPT-5.3' },
  { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex' },
  { id: 'gpt-5.4', name: 'GPT-5.4' },
  { id: 'gpt-5.5', name: 'GPT-5.5' },
  { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
  { id: 'gpt-5.3-codex-spark', name: 'GPT-5.3 Codex Spark' },
  { id: 'gpt-image-1', name: 'GPT Image 1' },
  { id: 'gpt-image-1.5', name: 'GPT Image 1.5' },
  { id: 'gpt-image-2', name: 'GPT Image 2' },
],
defaultModel: 'gpt-5.4',
```

要求：

- 保留现有旧模型，不做清理
- 只追加缺失模型，不重构配置结构
- 不改 `baseUrl`、`apiKey`、provider 名称

- [ ] **Step 3: 检查读取逻辑不需要联动修改**

确认 `nest-admin/src/modulesAi/ai/custom-ai.ts` 仍然是以下读取方式，因此无需改动代码：

```ts
getModels() {
  return config.customAi?.models || [];
}

getDefaultModel() {
  return this.defaultModel;
}
```

同时确认构造函数默认值不影响本次结果：

```ts
this.defaultModel = config.customAi?.defaultModel || 'gpt-5.1';
```

因为配置文件显式写入 `gpt-5.4` 后，运行时将优先使用配置值。

- [ ] **Step 4: 运行最小验证，确认配置已更新**

Run: `rg -n "gpt-5\.5|gpt-5\.4-mini|gpt-5\.3-codex-spark|gpt-image-1|gpt-image-1\.5|gpt-image-2|defaultModel" nest-admin/config/secret.ts`

Expected: 输出中包含 6 个新增模型 ID，且 `defaultModel: 'gpt-5.4'` 存在。

- [ ] **Step 5: 人工核对变更边界**

确认本次提交只涉及以下行为：

```txt
1. 追加 6 个模型项
2. 默认模型从 gpt-5.1 改为 gpt-5.4
3. 未修改任何服务逻辑、控制器逻辑、前端逻辑
```

- [ ] **Step 6: 提交变更**

```bash
git add nest-admin/config/secret.ts
git commit -m "chore: update xiaocai ai model list"
```

仅在用户明确要求提交时执行此步骤。

## 自检

- 规格覆盖检查：已覆盖“追加 6 个新模型”“默认模型改为 `gpt-5.4`”“不改 provider 与调用逻辑”三项核心要求。
- 占位符检查：无 `TODO`、`TBD`、笼统表述。
- 一致性检查：模型 ID、默认模型值、目标文件路径在全文保持一致。
