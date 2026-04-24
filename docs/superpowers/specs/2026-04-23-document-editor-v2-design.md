# Document Editor V2 设计

## 目标

在 `nest-admin-frontend` 中新建 `document-editor-v2`，基于现有 `Tiptap 3 + Vue 3` 技术栈重构一版可用的 Notion-like 文档编辑器，用于替代当前基本不可用的 `NotionDocumentEditor.vue`。

第一阶段目标不是追求完整 Notion 能力，而是先交付一套稳定、可试用、可继续演进的最小可用编辑器，覆盖基础文档块、高级结构、统一命令层、稳定序列化和可控试用入口。

## 范围

本次设计覆盖：

- `nest-admin-frontend/src/features/document-editor-v2/` 新模块设计
- 编辑器实例构建方式
- 文档块定义、块命令、块上下文与菜单交互设计
- 第一阶段支持的块类型和高级结构
- 内容规范、数据边界、保存与重载约束
- PoC 试用与入口切换策略
- 验证标准与风险边界

本次不覆盖：

- 旧版 HTML 正文的自动迁移方案
- 与 BlockNote、Isle-Editor 的运行时混合接入
- Notion 数据库、页面树、多人协作、评论、权限细粒度模型
- 图片上传、附件管理、远程资源库等完整媒体系统
- 复杂嵌套块拖拽、多块拖拽、跨文档拖拽

## 项目现状

### 现有技术栈

- 前端项目为 `Vue 3 + Vite + Element Plus`
- 当前仓库已使用 `Tiptap 3`
- 相关依赖位于 `nest-admin-frontend/package.json`

当前已确认依赖包括：

- `@tiptap/vue-3`
- `@tiptap/starter-kit`
- `@tiptap/extension-image`
- `@tiptap/extension-link`
- `@tiptap/extension-placeholder`
- `@tiptap/extension-table`
- `@tiptap/extension-table-cell`
- `@tiptap/extension-table-header`
- `@tiptap/extension-table-row`

### 现有编辑器能力与问题

当前 Notion-like 编辑器位于 `nest-admin-frontend/src/features/document-editor/NotionDocumentEditor.vue`，已经具备：

- 基础 Tiptap 编辑能力
- slash menu
- Markdown 粘贴桥接
- 基础命令层
- `JSONContent` 双向绑定
- 旧数据状态分支：`ready` / `legacy_html` / `invalid`

当前核心问题不是“完全没有能力”，而是“能力分散且稳定性不足”，具体表现为：

- 编辑器入口、块定义、命令、交互规则没有形成统一抽象
- slash menu 只是单点功能，不是建立在统一块协议上
- 块级上下文缺失，导致 block action、drag handle、TOC 等能力很难自然扩展
- 当前实现更接近一份增强版富文本，而不是真正面向块操作的文档编辑器
- 旧数据兼容分支增加了心智负担，但当前阶段用户允许不兼容旧数据

## 外部方案结论

### BlockNote

- React 优先，不适合当前 Vue 3 项目直接作为主编辑器
- 推荐数据模型为 `Block[]`，与当前 `Tiptap JSONContent` 不一致
- 接入成本主要来自框架和数据模型，而不是功能缺失

结论：不作为当前项目主编辑器方案。

### Isle-Editor

- 提供 `@isle-editor/vue3`，表面上更贴近当前项目
- 本质仍是基于 `ProseMirror + Tiptap` 的编辑器封装
- 有值得参考的结构设计：`NotionKit`、UniqueID、slash menu、drag handle、TOC、toolbar、bubble menu
- 公开包依赖 `Tiptap 2`，而当前项目使用 `Tiptap 3`
- 项目整体偏早期，文档成熟度和生态稳定性不足

结论：不直接引入运行时包，但可参考其结构设计和交互思路。

## 方案对比

### 方案 A：原地重构 `NotionDocumentEditor.vue`

- 继续在现有目录和组件上演进
- 逐步补 block registry、drag handle、TOC、action menu

优点：

- 表面改动最小
- 替换成本低

缺点：

- 旧实现包袱重，容易边修边塌
- 旧数据兼容状态、历史命名、当前组件结构会持续干扰新设计
- 很难清晰划分“现状逻辑”和“新架构逻辑”

### 方案 B：新建 `document-editor-v2`，成熟后替换入口

- 保留现有实现不动
- 在新目录中重新搭建编辑器核心和 UI 交互层
- 先提供 PoC 或灰度入口，稳定后替换业务入口

优点：

- 可以在不被历史实现拖累的前提下建立正确结构
- 便于逐层验证，风险更可控
- 用户已允许旧数据不兼容，适合新起一套内容规范

缺点：

- 需要在短期内维护两套编辑器入口
- 初期要额外处理试用与切换路径

### 方案 C：只局部借鉴 Isle-Editor 的菜单和交互

- 不重建核心结构
- 仅新增 slash、toolbar、TOC 等外围 UI

优点：

- 开发速度快

缺点：

- 核心问题仍未解决
- 继续堆功能只会让当前实现更脆弱

## 选定方案

选择方案 B：新建 `document-editor-v2`，完成后替换入口。

原因：

- 当前编辑器问题已不是局部修修补补能解决
- 当前项目已经建立在 `Tiptap 3` 上，继续复用底层最现实
- 用户允许开发期不兼容旧数据，大幅降低了重构阻力
- Isle-Editor 的价值主要在设计参考，不在于直接接入

## 设计原则

- 保留 `Tiptap JSONContent` 作为唯一文档存储格式
- 建立统一块定义协议，避免 slash、toolbar、action menu 各自维护一套逻辑
- 先支持“顶层块编辑”这条主路径，不提前设计复杂嵌套系统
- 失败时优先 no-op，不做高风险自动修复
- 文档始终保留至少一个可编辑文本块，避免编辑器进入死状态
- 第一阶段优先稳定输入、块转换、块重排、保存重载，不追求大而全

## 第一阶段能力范围

### 基础文档块

第一阶段支持以下块：

- paragraph
- heading1
- heading2
- heading3
- bulletList
- orderedList
- taskList
- blockquote
- codeBlock
- horizontalRule
- table
- image 占位块

说明：

- `image` 第一阶段仅要求支持插入占位块或基础链接图片，不要求完整上传体系
- `taskList` 如现有依赖未启用，需要在 V2 中按最小必要方式接入
- 不引入数据库块、callout、toggle、synced block 等更复杂结构

### 高级结构

第一阶段必须覆盖：

- slash menu
- block action menu
- drag handle
- TOC
- 轻量 bubble menu
- 轻量 toolbar

其中：

- drag handle 只支持顶层块排序
- TOC 只扫描标题块
- bubble menu 只负责选中文本后的常用格式化操作
- toolbar 只提供基础块转换和常用内联操作

## 架构设计

### 目录结构

建议新增：

- `nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.vue`
- `nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.ts`
- `nest-admin-frontend/src/features/document-editor-v2/core/blockRegistry.ts`
- `nest-admin-frontend/src/features/document-editor-v2/core/blockTypes.ts`
- `nest-admin-frontend/src/features/document-editor-v2/core/blockCommands.ts`
- `nest-admin-frontend/src/features/document-editor-v2/core/blockContext.ts`
- `nest-admin-frontend/src/features/document-editor-v2/core/editorState.ts`
- `nest-admin-frontend/src/features/document-editor-v2/extensions/`
- `nest-admin-frontend/src/features/document-editor-v2/components/`
- `nest-admin-frontend/src/features/document-editor-v2/content/createEmptyDocument.ts`
- `nest-admin-frontend/src/features/document-editor-v2/content/normalizeDocument.ts`
- `nest-admin-frontend/src/features/document-editor-v2/content/validateDocument.ts`

### 分层职责

#### 1. 入口层

`DocumentEditorV2.vue` 负责：

- 接收 `contentJson`、`disabled`、`placeholder` 等外部参数
- 管理编辑器实例生命周期
- 连接菜单组件、TOC、工具栏和业务侧 `v-model`
- 暴露最小必要事件，如 `update:contentJson`

入口层不直接承载复杂块判断逻辑。

#### 2. 编辑器构建层

`createDocumentEditor.ts` 负责：

- 创建 Tiptap Editor 实例
- 组装 V2 所需全部扩展
- 安装统一的键盘规则、选择更新、文档更新回调
- 向上暴露 editor 与必要状态订阅接口

#### 3. 块能力层

块能力层负责统一描述“块是什么、能做什么、怎么转”。

核心职责包括：

- 维护块类型定义
- 提供块识别函数
- 提供块创建、块转换、块插入、块删除命令
- 提供块菜单展示元信息
- 提供块是否可进入 TOC、是否可拖拽、是否可复制等能力标记

#### 4. 菜单与交互层

菜单与交互层负责：

- slash menu
- block action menu
- bubble menu
- toolbar

这一层不直接实现块逻辑，只消费块能力层暴露的统一协议。

#### 5. 高级结构层

高级结构层负责：

- drag handle
- TOC
- 块级辅助状态

这层建立在块上下文与统一文档扫描能力之上。

#### 6. 内容规范层

内容规范层负责：

- 生成空文档
- 标准化新文档结构
- 校验是否是合法 V2 文档

由于用户允许开发阶段不兼容旧数据，这一层只服务 V2 新文档，不负责兼容旧版 HTML 或旧 JSON 异形结构。

## 数据模型设计

### 主存储格式

V2 继续使用 `Tiptap JSONContent` 作为持久化格式。

原因：

- 与当前项目现有数据流一致
- 可以复用 Tiptap 生态和序列化能力
- 避免切换到 `Block[]` 后重新设计全部渲染和保存链路

### 块唯一标识

每个可操作顶层块都需要稳定 `blockId`。

设计要求：

- `blockId` 保存在块节点 attrs 中
- 新建块时自动生成
- 粘贴、转换、插入时补齐缺失 `blockId`
- `blockId` 在一次文档会话和持久化后都应稳定存在

用途：

- block action menu 定位
- drag handle 定位
- TOC 项与块映射
- 当前块上下文识别

### 块定义协议

建议每个块定义至少包含：

- `type`
- `title`
- `aliases`
- `group`
- `icon`
- `canInsert`
- `canConvertFrom`
- `supportsChildren`
- `includeInToc`
- `showInSlashMenu`
- `showInToolbar`
- `showInBlockMenu`
- `createNode`
- `runCommand`

这份定义作为唯一事实来源，供：

- slash menu
- block action menu
- toolbar
- 文档初始化
- 块转换命令

共同使用。

## 块上下文设计

V2 需要建立统一的当前块上下文，而不是由各菜单自行读取 selection。

块上下文至少包含：

- 当前选区所在块的 `blockId`
- 当前块类型
- 当前块在文档中的位置
- 是否为空块
- 是否为顶层块
- 是否可拖拽
- 是否可删除
- 当前块标题文本或摘要文本

消费方包括：

- slash menu 打开条件判断
- block action menu 显示与定位
- drag handle 显示与移动
- TOC 高亮同步
- 回车 / 退格行为分支

## 交互设计

### Slash Menu

#### 打开条件

- 当前选区位于单个文本块内
- 当前块为可输入文本块
- 块首输入 `/` 开始触发
- `/` 之前不能有其他非空文本

#### 关闭条件

- 选区离开当前块
- 当前行不再满足 `/query` 形态
- 执行命令成功
- 用户按下 `Escape`
- 编辑器失焦且未进入 slash menu 面板点击操作

#### 行为要求

- 根据 `query` 过滤块定义
- 支持键盘上下选择
- 支持回车确认
- 支持鼠标点击确认
- 执行命令前先删除触发串 `/query`

第一阶段不要求：

- 多级分类导航
- 异步搜索
- 最近使用排序

### Block Action Menu

触发方式：

- 通过块侧边操作按钮打开
- 默认作用于当前顶层块

第一阶段提供操作：

- 转换块类型
- 在当前块前插入
- 在当前块后插入
- 复制块
- 删除块
- 定位到块

说明：

- 不支持多块批量操作
- 删除前需要保证文档仍保留至少一个可编辑块

### Drag Handle

第一阶段仅支持顶层块前后重排。

明确限制：

- 不支持复杂嵌套块拖拽
- 不支持跨列表层级重建结构
- 不支持多块拖拽
- 不支持跨文档拖拽

行为要求：

- 拖拽目标必须是合法顶层块边界
- 拖拽失败时文档保持不变
- 拖拽后应保持块内容和 `blockId` 一致

### TOC

TOC 由文档扫描生成，只收集：

- `heading1`
- `heading2`
- `heading3`

行为要求：

- 标题内容变化时实时更新
- 点击 TOC 可定位到对应块
- 当前阅读或编辑块变化时同步高亮 TOC 项

第一阶段不要求：

- 折叠树
- 深度自定义
- 拖拽调整目录层级

### Bubble Menu

第一阶段提供最小可用集合：

- bold
- italic
- underline
- link
- inline code

只在非空文本选择下显示。

### Toolbar

第一阶段提供最小可用集合：

- paragraph / heading 切换
- bullet list / ordered list / task list
- blockquote
- code block
- table
- image
- clear formatting

Toolbar 与 slash menu 共用同一套块定义和命令协议。

## 键盘与输入规则

### 回车行为

第一阶段需要为以下类型显式定义行为：

- paragraph：正常换行或拆分段落
- heading：回车后在下一行创建 paragraph
- bulletList / orderedList / taskList：遵循列表常规行为；空项回车退出列表
- blockquote：遵循引用块常规行为；空引用回车退出引用
- codeBlock：回车保留在代码块内，不自动转换为 paragraph
- image / horizontalRule / table 等非纯文本块：在块后创建 paragraph 并聚焦

### 退格行为

第一阶段需要显式兜底：

- 空 paragraph 回退到前一个块时不造成非法结构
- 空 heading 可退回为 paragraph
- 空列表项在列表边界时按常规退出列表
- 非文本块前后的退格不应让编辑器失去可编辑落点

### 空块与焦点保护

必须保证：

- 新建空文档时始终有一个 paragraph
- 删除最后一个块后自动补一个空 paragraph
- 插入非文本块后有明确焦点落点
- 菜单操作完成后焦点保持在合理位置

## 内容规范

### 新文档初始化

V2 新文档统一由 `createEmptyDocument()` 生成，至少包含：

- `doc`
- 一个带 `blockId` 的 `paragraph`

### 标准化

`normalizeDocument()` 负责：

- 为缺少 `blockId` 的顶层块补齐 attrs
- 对完全空或结构异常的新文档兜底为最小合法文档
- 修复第一阶段已知的轻量结构问题

不负责：

- 把任意旧结构强行转换成新结构
- 对未知历史格式做猜测式修复

### 校验

`validateDocument()` 负责输出明确结果，例如：

- `valid`
- `invalid_empty`
- `invalid_root`
- `invalid_block`

第一阶段业务侧处理策略：

- 对 V2 入口只接受合法 V2 JSON 或空值
- 不在 V2 内部承接 `legacy_html` 编辑能力

## 保存与重载策略

V2 的内容更新策略为：

- 编辑器内部变更时输出 `JSONContent`
- 输出前先走标准化流程
- 外部回填内容时先走校验与标准化，再 `setContent`

必须满足：

- 同一份 V2 文档保存再加载后，结构稳定
- `blockId` 不因普通编辑操作频繁重建
- TOC、drag handle、block menu 不依赖临时位置而依赖稳定块标识

## PoC 与切换策略

### PoC 阶段

开发完成后先提供一个小范围内部试用入口。

PoC 目标：

- 验证基础输入稳定性
- 验证 slash、块转换、拖拽、TOC 是否满足日常文档使用
- 验证保存和重载后的结构稳定性
- 收集内部用户对交互细节的反馈

PoC 范围建议：

- 仅新建文档使用 V2
- 或在内部测试入口中单独挂载 V2
- 不直接替换全部线上正文编辑入口

### 切换策略

切换顺序建议：

1. 新建 `document-editor-v2` 并完成最小功能
2. 在独立试用入口或受控业务入口接入
3. 完成小范围内部试用
4. 修复试用反馈中的高频问题
5. 评估是否替换现有 `NotionDocumentEditor.vue` 入口

在未完成试用前：

- 保留旧编辑器入口
- 不做强制迁移
- 不承诺旧数据兼容

## 验证标准

第一阶段验收最小标准：

### 编辑稳定性

- 普通输入、删除、换行稳定
- 段落、标题、列表、引用、代码块之间切换稳定
- 插入分割线、表格、图片占位块后不会进入死状态

### Slash 与命令稳定性

- `/` 打开稳定
- 过滤稳定
- 键盘选择稳定
- 执行后能正确删除触发串并插入目标块

### 块操作稳定性

- block action menu 能正确识别当前块
- 块前插入、块后插入、删除、复制、转换稳定
- 删除最后一个块后仍保留可编辑 paragraph

### 高级结构稳定性

- drag handle 可以完成顶层块重排
- TOC 可生成、可定位、可高亮
- bubble menu 与 toolbar 不干扰正常输入

### 数据稳定性

- 保存后重载结构不漂移
- `blockId` 稳定存在
- 无非法根节点或空根节点写回

## 测试策略

### 前端验证

至少执行：

- `npm run type-check`（目录：`nest-admin-frontend`）

按功能补充最小单测，优先覆盖：

- `createEmptyDocument()`
- `normalizeDocument()`
- `validateDocument()`
- 块定义过滤与 slash menu 数据生成
- 顶层块拖拽排序逻辑
- TOC 扫描逻辑

如组件交互拆分足够清晰，可补充：

- slash menu 键盘交互单测
- block action menu 触发与命令路由单测

### 手工验证

PoC 前至少手工验证以下场景：

- 新建空文档输入正文
- `/h1`、`/h2`、`/table`、`/image`、`/code`
- 标题切换后 TOC 实时更新
- 列表空项退出
- 删除最后一个块
- 顶层块拖拽前移、后移
- 保存后刷新重载

## 风险与边界

### 1. Tiptap 3 下块级体验仍需自行补齐

Tiptap 提供的是编辑器底座，不会天然给出完整 Notion-like 块操作体验，因此：

- slash、block menu、drag、TOC 需要自己建立统一协议
- 如果协议设计不稳，后续继续加块会再次失控

### 2. `blockId` 是第一阶段关键基础设施

如果 `blockId` 生成和保持策略不稳定，将直接影响：

- drag handle
- TOC 定位
- block action menu
- 保存重载一致性

因此 `blockId` 不能做成仅运行时临时状态。

### 3. 不兼容旧数据是主动选择，不是遗漏

当前阶段用户明确允许旧数据不兼容，因此：

- 第一阶段不做历史兼容补丁
- 也不为了兼容旧世界污染 V2 核心结构

后续若要兼容，再单独设计迁移或双入口策略。

### 4. 拖拽范围必须收敛

如果第一阶段直接做复杂嵌套拖拽，风险显著高于收益。

因此第一阶段只做顶层块重排，不扩展到复杂结构。

## 相关文件

### 已有文件

- `nest-admin-frontend/package.json`
- `nest-admin-frontend/src/features/document-editor/NotionDocumentEditor.vue`
- `nest-admin-frontend/src/features/document-editor/core/documentExtensions.ts`
- `nest-admin-frontend/src/features/document-editor/core/documentCommands.ts`
- `nest-admin-frontend/src/features/document-editor/core/documentSlashItems.ts`
- `nest-admin-frontend/src/features/document-editor/core/documentContent.ts`

### 拟新增目录

- `nest-admin-frontend/src/features/document-editor-v2/`
- `nest-admin-frontend/src/features/document-editor-v2/core/`
- `nest-admin-frontend/src/features/document-editor-v2/extensions/`
- `nest-admin-frontend/src/features/document-editor-v2/components/`
- `nest-admin-frontend/src/features/document-editor-v2/content/`

## 结论

本次重构不选择 BlockNote，也不直接接入 Isle-Editor，而是在现有 `Tiptap 3` 基础上按块协议重建一套 `document-editor-v2`。

第一阶段只做最小可用、可试用、可稳定保存的 Notion-like 编辑器：基础块可用，高级结构可用，交互规则明确，数据结构稳定。完成后先做小范围内部试用，再决定是否替换旧入口。
