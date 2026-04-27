# 主前端 TipTap 2 收敛与废弃编辑器清理设计

## 目标

将 `nest-admin-frontend` 的编辑器生态重新收敛为两条明确主线：

- 知识模块统一使用根目录 `isle-editor/` 迁入后的真实 TipTap 2 运行时
- 非知识页面统一保留 Quill 编辑器

同时彻底删除主前端中所有已经废弃的 TipTap 3 自定义编辑器方案代码，包括：

- `src/features/document-editor/**`
- `src/features/document-editor-v2/**`
- `src/components/Editor/tiptapExtensions.ts`
- 以及只服务于这些废弃方案的测试文件和配套工具

本次目标不是继续维持 TipTap 2 与 TipTap 3 的混合状态，也不是保留旧自定义编辑器代码作为“以后可能还会用”的备份，而是把主前端编辑器路线彻底收敛到可长期维护的一套方案。

## 范围

本次设计覆盖：

- `nest-admin-frontend` 从 TipTap 3 残留方案收敛回 TipTap 2 方案
- 真实 `isle-editor` 运行时迁入和接线
- 知识编辑页、查看页、详情页切换到真实 `isle-editor`
- 删除所有非 `isle-editor` 的 TipTap 3 自定义编辑器代码与测试
- 保留 Quill 作为非知识页面编辑器
- 清理前端依赖中仅服务于废弃 TipTap 3 方案的部分
- 前端验证与最小必要回归

本次不覆盖：

- Quill 本身的行为改造
- 知识模块之外页面的功能重做
- 根目录 `isle-editor/` 上游仓库本身的源码改造
- 后端文章协议字段改名
- 旧知识数据迁移

## 已确认约束

用户已明确确认以下约束：

- 主前端里之前引入 TipTap 3 是为了自定义编辑器方案，这条路线已废弃
- 现在要修改主前端编辑器生态，回到 TipTap 2 方向
- 知识模块编辑器必须使用真实 `isle-editor` 内核
- 非知识页面只保留 Quill 编辑器
- 物理删除：
  - `src/features/document-editor/**`
  - `src/features/document-editor-v2/**`
- 同时删除这些废弃实现对应的测试文件
- 所有非 `isle-editor` 的 TipTap 3 残留都应纳入清理范围

## 当前问题

### 当前主前端处于不稳定的混合编辑器状态

当前 `nest-admin-frontend` 内实际并存三类编辑器路线：

1. Quill 方案
2. 真实来源于 TipTap 2 的 `isle-editor` 路线
3. 废弃的 TipTap 3 自定义编辑器路线

这导致：

- 依赖树混杂
- 页面编辑器方案不统一
- 废弃代码仍然占据目录、测试和依赖空间
- 真实 `isle-editor` 迁入时被 TipTap 3 依赖树正面阻塞

### 真实 `isle-editor` 迁入当前被 TipTap 主版本冲突卡住

调试已确认：

- 根目录 `isle-editor/` 真实运行时依赖 TipTap 2
- 主前端当前依赖树已经安装 TipTap 3
- 直接把上游真实 `isle-editor` 运行时代码迁入主前端时，会在依赖、peer 约束和运行时解析层面产生冲突

所以当前问题不是简单的“少几个 import”或“少同步几个文件”，而是主前端编辑器生态本身没有收敛。

## 方案对比

### 方案 A：继续保留 TipTap 3 自定义编辑器代码，只让知识模块单独兼容 TipTap 2

优点：

- 对废弃代码改动少

缺点：

- 主前端继续长期处于两代 TipTap 并存状态
- 真实 `isle-editor` 迁入继续受阻
- 废弃方案会继续污染维护边界

结论：

- 不采用

### 方案 B：知识模块切到真实 `isle-editor`，但废弃 TipTap 3 自定义编辑器代码暂时保留目录

优点：

- 删除动作较少

缺点：

- 仍保留大量无效代码和测试
- 依赖清理不彻底
- 后续很容易再次回到混合状态

结论：

- 不采用

### 方案 C：主前端编辑器生态整体收敛

做法：

- 知识模块统一使用真实 `isle-editor` + TipTap 2
- 非知识页面保留 Quill
- 彻底删除废弃 TipTap 3 自定义编辑器代码和测试

优点：

- 路线最清晰
- 依赖边界最干净
- 能从根上解除 `isle-editor` 真实迁入的主版本冲突

缺点：

- 删除和替换范围最大
- 必须严格验证知识模块和 Quill 页面都没有被误伤

结论：

- 采用

## 选定方案

选择方案 C：

- 主前端整体收敛到“Quill + 真实 `isle-editor`”两条编辑器主线
- 知识模块使用 `isle-editor` 真实 TipTap 2 内核
- 非知识模块继续使用 Quill
- 物理删除所有废弃 TipTap 3 自定义编辑器方案代码和测试

原因：

- 这是唯一能同时满足“真实最新 `isle-editor` 内核”与“废弃自定义 TipTap 3 方案彻底清理”的路线
- 可以从架构层解决当前主版本冲突，而不是继续在混合依赖上打补丁

## 最终编辑器格局

### 保留

1. Quill

- 用于非知识页面
- 现有 Quill 页面继续保留，不做技术路线切换

2. `isle-editor`

- 用于知识模块
- 真实来源是根目录 `isle-editor/`
- 迁入主前端后只保留：
  - `src/features/isle-editor/**`
  - `IsleArticleEditor.vue`
  - `IsleArticleViewer.vue`

### 删除

以下废弃方案全部物理删除：

- `src/features/document-editor/**`
- `src/features/document-editor-v2/**`
- `src/components/Editor/tiptapExtensions.ts`
- 所有只服务于上述两套方案的测试、content 工具、state 工具、command 工具、extensions 组装文件

## 迁入与清理边界

### 真实 `isle-editor` 迁入层

继续以上游为准同步：

- `src/features/isle-editor/core/**`
- `src/features/isle-editor/vue/**`
- `src/features/isle-editor/styles/**`

### 项目适配层

保留：

- `src/features/isle-editor/adapters/isleContent.ts`
- `src/features/isle-editor/adapters/useIsleUpload.ts`

职责：

- 正文协议类型与空文档/纯文本工具
- 现有 `/upload` 到上游 `mediaHandlers` 的桥接

### 项目公开组件层

保留：

- `src/features/isle-editor/components/IsleArticleEditor.vue`
- `src/features/isle-editor/components/IsleArticleViewer.vue`

职责：

- 继续作为页面稳定入口
- 内部替换为真实上游 editor / readonly viewer

## 删除范围细则

### 必删目录

- `src/features/document-editor/`
- `src/features/document-editor-v2/`

### 必删文件

- `src/components/Editor/tiptapExtensions.ts`

### 必删测试

- `src/features/document-editor/**/*.spec.ts`
- `src/features/document-editor-v2/**/*.spec.ts`
- 以及只服务于这两套废弃方案的配套测试

### 删除原则

- 只要一个文件的唯一用途是服务废弃 TipTap 3 自定义编辑器方案，就应删除
- 不保留“以后可能有用”的废弃代码
- 如有功能已被 Quill 或 `isle-editor` 接管，则旧实现直接下线

## 依赖策略

### 保留的依赖

- Quill 相关依赖
- 真实 `isle-editor` 运行所需依赖

### 删除的依赖

- 所有仅服务于 `document-editor` / `document-editor-v2` 的 TipTap 3 依赖
- 所有只被废弃方案引用的 TipTap 3 扩展包

### 关键要求

- 主前端不得再保留“给废弃自定义编辑器方案用的 TipTap 3 运行时”
- 不能出现“知识模块已切到 `isle-editor`，但废弃 TipTap 3 依赖还大面积留在项目里”的半清理状态

## 页面与数据流

### 知识编辑页

`aev.vue` -> `IsleArticleEditor.vue` -> 真实上游 `IsleEditor + NotionKit`

要求：

- 页面仍通过 `v-model` 驱动 `contentJson`
- 保存逻辑继续写入：
  - `contentJson`
  - `contentVersion`
  - `contentStatus`
  - `contentText`

### 知识查看页 / 详情页

`view.vue` / `detail.vue` -> `IsleArticleViewer.vue` -> 真实上游只读实例

要求：

- 与编辑态使用同一套 schema / extensions
- 输出可供 TOC 提取的标题 DOM

### 非知识页面

- 继续使用 Quill
- 不引入 `isle-editor`
- 不再依赖废弃 TipTap 3 自定义编辑器方案

## 风险与控制

### 风险 1：删除废弃目录时误删仍被引用的文件

控制：

- 删除前先做全量引用扫描
- 只保留 Quill 和 `isle-editor` 仍然使用的代码

### 风险 2：真实 `isle-editor` 接入前先删废弃代码，导致知识模块不可用

控制：

- 实施顺序必须是：先接通真实 `isle-editor`，再删废弃方案
- 不采用“先删后建”顺序

### 风险 3：删除 TipTap 3 依赖时误伤现有页面

控制：

- 在依赖清理前先确认实际引用树
- 删除后立即跑前端类型检查和最小页面测试

### 风险 4：Quill 页面被误改

控制：

- 本次不修改 Quill 页面实现
- 仅清理与废弃 TipTap 3 方案相关代码

## 实施顺序

### 第一步：接通真实 `isle-editor` 运行时

- 完成 `src/features/isle-editor/**` 从占位壳到真实上游内核的替换

### 第二步：让知识页面跑在真实内核上

- `aev.vue`
- `view.vue`
- `detail.vue`

全部接到真实 `IsleArticleEditor` / `IsleArticleViewer`

### 第三步：全量扫描并删除废弃 TipTap 3 方案代码

- 删除 `document-editor`
- 删除 `document-editor-v2`
- 删除 `tiptapExtensions.ts`
- 删除对应测试

### 第四步：清理依赖

- 删除仅服务废弃方案的 TipTap 3 依赖
- 保留 Quill 和 `isle-editor` 所需依赖

### 第五步：前端验证

- `npm run type-check`
- 最小相关 Vitest
- 必要时补页面级守卫测试

## 最终结论

本次不是单纯“修 `/content/aev` 不是最新编辑器”这么窄的问题，而是主前端编辑器路线的整体收敛：

- 知识模块统一到真实 `isle-editor`
- 非知识页面统一保留 Quill
- 所有非 `isle-editor` 的 TipTap 3 废弃方案代码与测试全部删除

这样才能从根上解除当前 TipTap 主版本冲突，并让主前端进入可长期维护的单一路线。
