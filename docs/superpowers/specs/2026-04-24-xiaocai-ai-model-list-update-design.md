# 小菜 AI 模型列表补充设计

## 背景

当前项目通过 `nest-admin/config/secret.ts` 中的 `customAi` 配置接入“小菜 AI”，并由后端 `CustomAiService` 直接读取 `customAi.models` 作为可选模型列表。

已确认：

- 不新增 provider，不调整现有 `custom` 调用分支。
- 只补充“小菜 AI”供应商当前已提供、但项目里尚未列出的模型。
- 默认模型改为 `gpt-5.4`。

## 当前实现

- 模型列表来源：`nest-admin/config/secret.ts` 的 `customAi.models`
- 默认模型来源：`nest-admin/config/secret.ts` 的 `customAi.defaultModel`
- 读取入口：`nest-admin/src/modulesAi/ai/custom-ai.ts`
- 业务分支：`nest-admin/src/modulesAi/ai/service.ts` 中 `provider === "custom"`

当前实现为静态配置数组，未接数据库，也未从供应商接口动态同步。

## 外部事实依据

通过供应商兼容接口 `GET https://sub.gpt.sulme.xx.kg/v1/models` 查询到当前返回的新增候选模型包括：

- `gpt-5.5`
- `gpt-5.4-mini`
- `gpt-5.3-codex-spark`
- `gpt-image-1`
- `gpt-image-1.5`
- `gpt-image-2`

这些模型当前未包含在项目现有的 `customAi.models` 配置中。

## 方案比较

### 方案 A：只追加缺失模型，并切换默认模型

做法：

- 在 `customAi.models` 末尾追加 6 个新模型
- 将 `customAi.defaultModel` 调整为 `gpt-5.4`

优点：

- 改动最小
- 不影响现有 provider 结构
- 不删除历史模型，避免影响已有选择逻辑

缺点：

- 配置列表可能继续包含供应商当前未返回的旧模型

### 方案 B：完全同步为供应商当前返回列表

做法：

- 用 `/models` 返回结果整体覆盖本地配置

优点：

- 配置和供应商当前能力一致

缺点：

- 会移除当前项目里仍保留的历史模型
- 存在用户已有选择值失效的风险

## 结论

采用方案 A。

## 变更设计

### 配置变更

仅修改 `nest-admin/config/secret.ts`：

- 追加以下模型项：
  - `{ id: 'gpt-5.5', name: 'GPT-5.5' }`
  - `{ id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' }`
  - `{ id: 'gpt-5.3-codex-spark', name: 'GPT-5.3 Codex Spark' }`
  - `{ id: 'gpt-image-1', name: 'GPT Image 1' }`
  - `{ id: 'gpt-image-1.5', name: 'GPT Image 1.5' }`
  - `{ id: 'gpt-image-2', name: 'GPT Image 2' }`
- 将默认模型改为：`gpt-5.4`

### 不变更项

- 不修改 `provider` 判断逻辑
- 不新增后端服务分支
- 不修改前端接口结构
- 不做模型列表自动同步能力

## 数据流说明

1. 后端通过 `config.customAi.models` 返回可选模型列表。
2. 业务侧仍按现有 `provider === "custom"` 分支发起调用。
3. 未显式指定模型时，后端使用 `customAi.defaultModel`，即 `gpt-5.4`。

## 错误处理

- 若新增模型已被供应商下线，请求仍会在调用阶段由供应商接口报错；本次不新增主动校验。
- 若后续需要避免静态配置漂移，应单独设计“模型列表动态同步”能力，而不是在本次最小变更里扩展范围。

## 测试与验证

本次属于静态配置变更，验证方式控制在最小范围：

- 读取配置文件，确认 `customAi.models` 包含 6 个新增模型
- 确认 `customAi.defaultModel === 'gpt-5.4'`
- 如需进一步验证，可调用已有模型列表接口或聊天接口做人工检查

## 范围边界

本次不处理以下事项：

- 清理旧模型
- 兼容图片模型的专用调用方式
- 数据库存储模型配置
- 前端模型管理页面
