# Isle Editor 作为 `/content/aev` 正文编辑器集成设计

## 目标

将 `/Users/yyk/工作/代码开发/Project-V2.0/isle-editor` 合并到 `nest-admin-frontend`，作为项目内部组件，替换 `/content/aev` 页面正文区当前的 `KnowledgeEditorHost` iframe 编辑器方案。

本次集成遵循以下目标：

- 保留 `aev.vue` 现有业务表单、权限、模板、保存、借阅限制逻辑
- 仅替换正文编辑与查看主链路，不重做整页业务表单
- 将 `isle-editor` 作为项目内部组件维护，而不是独立子应用
- 编辑页 `aev.vue` 使用 `isle-editor` 编辑模式
- 查看页 `view.vue` 与详情页 `detail.vue` 复用同一套 `isle-editor` 只读模式
- 图片、附件、视频上传复用项目现有后端上传接口
- 正文协议切换为 `isle-editor` JSON，并继续通过现有 `contentJson` 字段承载

本次目标不是继续打磨现有 `KnowledgeEditorHost` 子应用桥接，也不是兼容旧 `legacy_html` 或旧知识正文协议。

## 范围

本次设计覆盖：

- `nest-admin-frontend/src/views/content/articleManage/aev.vue` 正文区替换
- `nest-admin-frontend/src/views/content/articleManage/view.vue` 查看正文替换
- `nest-admin-frontend/src/views/content/articleManage/detail.vue` 正文展示替换
- `isle-editor` 源码迁入 `nest-admin-frontend/src/features/isle-editor/`
- `isle-editor` 编辑器封装层、只读封装层、上传适配层
- 后端 `articles` 正文 JSON 校验与纯文本提取逻辑切换
- 相关前后端测试与最小必要回归

本次不覆盖：

- 历史文章自动迁移
- 旧 `content` HTML 的兼容展示
- 知识模块之外页面的编辑器替换
- 新增专用文章上传接口
- 重做知识详情页整体 UI 布局
- `contentChunks` 分片算法重构

## 已确认约束

用户已明确确认以下约束：

- 保留当前 `/content/aev` 页面表单，只替换正文区编辑器
- 正文协议可以切到 `isle-editor` JSON，后端与查看页一起适配
- 历史旧文章会全部删除，不需要旧协议兼容和自动迁移
- `isle-editor` 以源码形式直接并入 `nest-admin-frontend/src`
- 目标是尽量完整迁入 `isle-editor` 能力，包括附件、媒体、目录、气泡菜单、slash 命令等
- 附件、图片、视频上传复用项目现有后端上传接口
- `view.vue` 使用同一个 `isle-editor` 组件的只读模式展示正文

## 当前现状

### 前端现状

当前正文编辑与查看链路如下：

- `/content/aev` 路由指向 `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- `aev.vue` 正文区通过 `KnowledgeEditorHost.vue` 用 `iframe + postMessage` 接入独立编辑器子应用
- `view.vue` 与 `detail.vue` 通过 `KnowledgeViewerHost.vue` 渲染正文查看态
- `aev.vue` 保存时提交 `contentJson`、`contentVersion`、`contentStatus`、`contentText`
- 模板初始化、正文状态判断、只读阻断逻辑目前都围绕 `aev.document.ts` 的旧知识协议实现

### 后端现状

当前后端 `articles` 模块有以下正文相关事实：

- `contentJson` 字段已存在，类型为 `json`
- `contentVersion` 与 `contentStatus` 已存在
- `document.schema.ts` 对允许节点和 marks 做了白名单限制
- `document.validator.ts` 按旧知识文档 schema 做严格校验
- `ArticlesService.save()` 会校验正文、提取纯文本、生成切片并强制写入 `ready` 状态

### 上传现状

项目已存在稳定上传链路：

- 前端通用上传组件：`src/components/Upload.vue`
- 前端上传 API：`src/api/common.ts` 中的 `upload`
- 后端通用上传接口：`nest-admin/src/modules/common/common.controller.ts` 中的 `POST /upload`

因此，编辑器媒体能力不需要额外新建上传服务作为前提。

### 依赖现状

调研已确认：

- `isle-editor` 独立工程当前基于 `@isle-editor/core` + `@isle-editor/vue3`
- `@isle-editor/core` 依赖的是 TipTap 2 生态
- `nest-admin-frontend` 当前已有 TipTap 3 依赖

因此，不继续保留独立 workspace 依赖链路，也不采用“直接作为本地包接入”的方式，而是在前端内部迁入源码并收敛维护。

## 方案对比

### 方案 A：继续保留 iframe 子应用，只替换子应用内部编辑器为 `isle-editor`

优点：

- `aev.vue` 接口变更较少
- 与当前 `KnowledgeEditorHost` 结构表面相近

缺点：

- 仍需维护 `postMessage` 协议
- 仍需维护高度同步、初始化同步、只读 viewer 桥接
- 上传能力要继续跨 iframe 透传
- 不符合“编辑器作为项目内部组件”的目标

结论：

- 不采用

### 方案 B：将 `isle-editor` 源码迁入 `nest-admin-frontend/src`，作为项目内部组件直接替换正文区

优点：

- 符合“编辑器作为项目组件”的目标
- 编辑与查看可以直接共用同一套实现
- 上传、只读、路由内状态和样式都在同一应用内处理
- 长期维护成本最低

缺点：

- 首次迁入成本高于桥接模式
- 需要处理源码裁剪、样式收敛和依赖边界

结论：

- 采用

### 方案 C：不迁入 `isle-editor`，而是在现有项目里重写一个近似编辑器

优点：

- 理论上可完全贴合现有技术栈

缺点：

- 明显偏离“把 `isle-editor` 合并进项目”的目标
- 工作量与交互回归风险都更大

结论：

- 不采用

## 选定方案

选择方案 B：将 `isle-editor` 源码迁入 `nest-admin-frontend/src/features/isle-editor/`，封装为项目内部编辑器组件，并直接替换 `aev.vue`、`view.vue`、`detail.vue` 的正文主链路。

原因：

- 满足用户对“项目内部组件”的明确要求
- 彻底去掉 iframe 桥接层和额外通信协议
- 编辑与查看可复用同一套 schema 与渲染实现
- 上传链路与项目现有能力集成最直接

## 总体架构

### 总体思路

- 保留 `aev.vue` 业务表单容器不动
- 删除正文区对 `KnowledgeEditorHost` 的依赖
- 新增项目内 `IsleArticleEditor` 组件承接编辑态
- 新增项目内 `IsleArticleViewer` 组件承接只读态
- 后端继续使用 `contentJson` 字段保存正文，但内容协议改为 `isle-editor` JSON
- `contentVersion` 与 `contentStatus` 继续保留字段名，以减少数据库和接口波动

### 前端目录建议

建议在 `nest-admin-frontend/src/features/isle-editor/` 下组织代码：

- `core/`
- `vue/`
- `adapters/`
- `styles/`
- `components/`

建议的职责划分：

#### `core/`

- 承接从 `isle-editor/packages/core/src` 迁入的核心扩展、schema、commands
- 保持尽量少的项目业务耦合

#### `vue/`

- 承接从 `isle-editor/packages/vue3/src` 迁入的 Vue 组件、菜单、只读渲染能力
- 作为项目内部基础编辑器视图层

#### `adapters/`

- 封装上传适配、内容协议版本、空文档工厂、纯文本提取
- 放置与项目业务集成相关的最小桥接代码

#### `components/`

- 暴露项目真正使用的上层组件，如：
  - `IsleArticleEditor.vue`
  - `IsleArticleViewer.vue`

#### `styles/`

- 统一承接迁入后的编辑器样式
- 对全局选择器进行必要收敛，避免污染现有页面

## 页面接入设计

### `aev.vue`

`aev.vue` 继续保留以下能力：

- 标题、摘要、缩略图、目录、标签、权限、模板、发布信息等表单项
- 路由参数解析
- 借阅限制与权限控制
- 保存提交逻辑

仅替换正文区域：

- 删除 `KnowledgeEditorHost` 引入与使用
- 删除正文区 `iframe` 通信桥接逻辑
- 使用 `IsleArticleEditor` 直接双向绑定正文内容

`form.contentJson` 仍作为正文唯一事实来源。

### `view.vue`

- 删除 `KnowledgeViewerHost`
- 用 `IsleArticleViewer` 以只读模式直接渲染 `contentJson`
- 保留现有目录提取、滚动定位、借阅申请、文章元信息等页面逻辑

### `detail.vue`

- 同步删除 `KnowledgeViewerHost`
- 用 `IsleArticleViewer` 直接渲染正文
- 保留当前目录提取、来源跳转、AI 检索诊断、编辑入口等壳层业务

### 统一原则

- 编辑页和查看页必须共用同一套 schema
- `view.vue` 与 `detail.vue` 必须共用同一个只读正文组件
- 禁止再保留第二套 viewer 渲染实现

## 组件边界设计

### `IsleArticleEditor.vue`

职责：

- 提供项目内稳定的正文编辑器接口
- 隔离 `isle-editor` 内部细节
- 管理完整编辑功能集和上传适配

建议对页面暴露的输入输出：

- `modelValue`
- `disabled`
- `placeholder`
- `update:modelValue`
- `change`

组件内部负责：

- 初始化编辑器实例
- 挂载完整工具栏、气泡菜单、slash 菜单、目录、媒体节点
- 注入图片、附件、视频上传 handlers
- 统一编辑器容器样式

### `IsleArticleViewer.vue`

职责：

- 以只读模式渲染 `isle-editor` JSON
- 与编辑态共用同一套 schema 和节点能力

建议输入：

- `content`

组件内部负责：

- 关闭编辑能力与编辑菜单
- 保留图片、附件、视频、表格、代码块等只读展示
- 保证标题节点仍可被目录逻辑扫描

### `useIsleUpload.ts`

职责：

- 统一封装图片、附件、视频上传
- 复用项目现有 `/upload` 接口
- 输出 `isle-editor` 节点需要的 attrs 结构

### `isleContent.ts`

职责：

- 定义协议版本常量
- 提供空文档工厂
- 提供正文纯文本提取方法
- 提供前端最小合法性判断入口

## 正文数据协议设计

### 存储策略

继续复用现有文章字段：

- `contentJson`
- `contentVersion`
- `contentStatus`
- `contentText`
- `contentChunks`

协议语义调整为：

- `contentJson`：`isle-editor` JSON 根文档
- `contentVersion`：项目定义的 `isle-editor` 协议版本，初始建议为 `1`
- `contentStatus`：统一写为 `'ready'`
- `contentText`：由 `isle-editor` JSON 提取纯文本
- `contentChunks`：基于纯文本沿用现有切片逻辑生成

### 字段保留原则

- 不新增新的正文字段，避免扩大数据库与接口波动
- `content` 旧 HTML 列可继续存在，但不再作为正文主来源
- 保存链路不再依赖旧 `content` 字段参与展示与校验

### 空文档策略

- 新建文章默认正文使用 `isle-editor` 的空文档工厂
- 不再使用旧 `createEmptyDocument()` 或旧知识协议空结构

### 模板应用策略

- 现有模板仍可继续从业务侧传入标题、摘要和正文模板文本
- 但正文模板转换逻辑从旧 `createStructuredTemplateDocument(markdown)` 改为：
  - 生成 `isle-editor` 兼容的文档 JSON
  - 至少支持标题、段落、无序列表、有序列表等基础结构
- 模板转换只解决已有模板落地，不在本次扩展复杂 markdown 全量语法支持

## 后端协议与校验设计

### `document.schema.ts`

当前 `document.schema.ts` 是围绕旧知识文档白名单设计的，必须切换为 `isle-editor` 协议白名单。

建议原则：

- 不在旧 schema 上零散追加节点
- 直接以 `isle-editor` 当前实际启用的节点与 marks 为基础重建校验边界
- 支持本次确认在范围内的核心能力：
  - heading
  - paragraph
  - bulletList / orderedList / listItem
  - blockquote
  - codeBlock / code
  - table / tableRow / tableCell / tableHeader
  - image
  - attachment
  - video
  - horizontalRule / divider
  - taskList / taskItem
  - text 与必要 marks

### `document.validator.ts`

保留“严格校验 JSON 正文结构”的原则，但切换到新 schema：

- 根节点必须是合法 `doc`
- 不支持的节点或 marks 必须继续报错
- 非法结构必须拒绝保存

保留现有错误码体系，减少前端错误处理变动：

- `DOCUMENT_CONTENT_REQUIRED`
- `DOCUMENT_INVALID_ROOT`
- `DOCUMENT_INVALID_SCHEMA`
- `DOCUMENT_UNSUPPORTED_NODE`
- `DOCUMENT_UNSUPPORTED_MARK`
- `DOCUMENT_INVALID_CONTENT`
- `DOCUMENT_SCHEMA_UNSUPPORTED`

### `ArticlesService.save()`

正文处理流程继续保留，但实现切换：

- 校验正文 JSON
- 提取正文纯文本
- 生成 `contentChunks`
- 强制写入 `contentVersion`
- 强制写入 `contentStatus = 'ready'`

### 纯文本提取

`extractPlainTextFromDocument()` 必须适配 `isle-editor` 新节点结构，至少保证：

- 标题、段落、列表、表格、任务列表、代码块中的文本可被提取
- 图片、附件、视频等非文本节点不会导致异常
- 生成的 `contentText` 可继续用于搜索和切片

### 旧协议处置

由于用户已明确会删除旧文章，因此：

- 不再以旧 `legacy_html` 为主链路兼容目标
- 前端查看页与编辑页可以删除旧协议阻断逻辑
- 后端仍保留最基本的非法 JSON 拦截，不放弃结构校验

## 上传适配设计

### 复用现有接口

图片、附件、视频统一复用当前项目已有上传能力：

- 前端 `src/api/common.ts` 中的 `upload`
- 后端 `POST /upload`

不新增文章专用上传接口。

### 适配层职责

通过 `useIsleUpload.ts` 统一输出以下能力：

- `uploadImage`
- `uploadAttachment`
- `uploadVideo`

它们内部统一：

- 构造 `FormData`
- 调用现有 `upload`
- 将响应转换成 `isle-editor` 节点所需 attrs

### 返回结构策略

上传适配层负责屏蔽后端返回结构差异，向编辑器提供统一字段：

- `url`
- `name`
- `size`
- `mimeType`
- 需要时的额外展示字段

页面层不得直接依赖上传响应结构。

### 风险边界

项目现有上传接口已用于图片与附件上传，视频是否完全可用需要在实施阶段做真实验证。

如果现有 `/upload` 存在扩展名、大小或存储目录限制，则仅补最小后端放行调整，不另起一套新接口。

## 测试设计

### 前端测试

需要调整与新增以下测试：

- `aev.*.spec.ts`
  - 删除 iframe / bridge 相关断言
  - 断言 `aev.vue` 使用 `IsleArticleEditor`
  - 断言保存 payload 仍带 `contentJson`、`contentVersion`、`contentStatus`
- `view.*.spec.ts`
  - 断言查看页使用 `IsleArticleViewer`
- `detail` 相关测试
  - 断言详情页使用同一套只读组件
- `isleContent` 相关单测
  - 空文档工厂
  - 纯文本提取
  - 模板转换基础能力
- `useIsleUpload` 相关单测
  - 上传结果转换

### 后端测试

需要补充或改写：

- `document.validator` 单测
  - 合法 `isle-editor` JSON 通过
  - 非法 root 被拒绝
  - 不支持节点和 marks 被拒绝
- `articles/service` 相关测试
  - 保存生成 `contentText`
  - 保存生成 `contentChunks`
  - 非法内容拒绝保存

### 验证顺序

按仓库约束，建议验证顺序如下：

- 前端改动：`nest-admin-frontend` 下运行 `npm run type-check`
- 后端改动：`nest-admin` 下运行 `npm run lint`
- 后端相关最小 Jest
- 接口形状变更后运行根目录 `npm run check:api-contract`

## 风险与控制

### 风险 1：源码迁入后样式污染现有页面

控制：

- 为编辑器外层增加明确容器类
- 迁移时将宽泛样式选择器收紧到组件作用域或统一容器前缀

### 风险 2：TipTap 2 相关源码并入后与现有依赖产生边界问题

控制：

- 将迁入代码严格收口在 `src/features/isle-editor/`
- 不与旧知识编辑器实现混用内部模块
- 不继续依赖外部 workspace 结构

### 风险 3：上传接口对视频支持不足

控制：

- 先统一走现有 `/upload`
- 实施阶段做真实媒体上传验证
- 若失败，仅做最小后端放行调整

### 风险 4：查看页目录提取失效

控制：

- 只读组件必须保证标题节点渲染为真实 DOM 标题元素
- 对 `view.vue` 与 `detail.vue` 现有 TOC 逻辑做回归验证

### 风险 5：AI 检索切片质量波动

控制：

- 本次继续复用 `contentText -> contentChunks` 逻辑
- 不同时重写分片算法，避免扩大变更范围

## 实施顺序

### 第一步：迁入并整理 `isle-editor` 源码

- 将 `packages/core/src` 与 `packages/vue3/src` 中实际运行所需代码迁入 `nest-admin-frontend/src/features/isle-editor/`
- 让迁入后的编辑器在项目内部先达到可编译状态

### 第二步：补项目封装层与适配层

- `IsleArticleEditor.vue`
- `IsleArticleViewer.vue`
- `useIsleUpload.ts`
- `isleContent.ts`

### 第三步：替换前端正文链路

- `aev.vue` 替换正文编辑器
- `view.vue` 替换正文 viewer
- `detail.vue` 替换正文 viewer
- 删除 `KnowledgeEditorHost` / `KnowledgeViewerHost` 依赖

### 第四步：切换后端正文协议

- 更新 `document.schema.ts`
- 更新 `document.validator.ts`
- 更新 `ArticlesService` 文本提取逻辑

### 第五步：测试与验证

- 更新相关前端 spec
- 更新后端 validator / service 测试
- 执行前后端与根目录验证命令

## 不做事项

- 不保留旧 `legacy_html` 兼容链路
- 不继续维护 iframe 子应用桥接方案
- 不新增文章专用上传接口
- 不做历史文章迁移脚本
- 不在本次重做知识页面整体视觉结构

## 最终结论

本次采用“项目内组件化迁入 `isle-editor`”方案：

- `/content/aev` 保留现有业务表单，正文区改为 `IsleArticleEditor`
- `/content/articleManage/view` 与 `detail.vue` 统一改为 `IsleArticleViewer`
- `contentJson` 继续作为正文存储字段，但协议切为 `isle-editor` JSON
- 上传统一复用项目现有 `/upload`
- 后端正文校验器和纯文本提取逻辑切换到 `isle-editor` schema
- 旧知识编辑器宿主组件和旧协议兼容链路整体下线

这样可以在不重写业务表单的前提下，让 `isle-editor` 成为知识模块新的正文编辑与查看主方案。
