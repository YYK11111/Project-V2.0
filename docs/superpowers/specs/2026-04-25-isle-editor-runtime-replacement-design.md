# Isle Editor 真实内核替换设计

## 目标

将 `nest-admin-frontend/src/features/isle-editor/**` 中当前的占位编辑器内核，替换为根目录 `isle-editor/` 中的真实最新运行时实现，并在尽量保持 `IsleArticleEditor.vue` / `IsleArticleViewer.vue` 对外接口不变的前提下，使 `/content/aev`、`/content/articleManage/view`、`detail.vue` 的编辑、查看、上传、slash、media、table、toc 全链路一次性对齐到上游能力。

本次目标不是继续修补当前的最小骨架 `Editor`，也不是只解决“能输入一点文本”的表面问题，而是把真实 `isle-editor` 内核整体迁回主仓库 feature 模块，让页面实际运行的就是上游编辑器能力。

## 范围

本次设计覆盖：

- 根目录 `isle-editor/packages/core/src/**` 向 `nest-admin-frontend/src/features/isle-editor/core/**` 的整体替换
- 根目录 `isle-editor/packages/vue3/src/**` 向 `nest-admin-frontend/src/features/isle-editor/vue/**` 与 `styles/**` 的整体替换
- `IsleArticleEditor.vue` / `IsleArticleViewer.vue` 与真实内核的重新接线
- `NotionKit`、slash、bubble、media、table、toc 等真实能力接入
- 项目上传适配与上游 `mediaHandlers` 的对接
- 编辑页、查看页、详情页在真实内核上的运行闭环
- 与本次替换相关的前端测试重写和最小必要回归

本次不覆盖：

- 根目录 `isle-editor/` 仓库本身的上游源码改造
- 知识模块之外页面的编辑器替换
- 批量旧文章迁移
- 后端文章协议字段改名
- 新增独立上传服务

## 已确认约束

用户已明确确认以下约束：

- 以根目录 `isle-editor/` 为真实最新内核来源
- `nest-admin-frontend/src/features/isle-editor/**` 允许做较大规模替换
- 但尽量保留 `IsleArticleEditor.vue` / `IsleArticleViewer.vue` 的对外接口不变
- 编辑、查看、上传、slash、media、table、toc 全链路要一次性对齐
- 查看页与详情页也要一起切到真实上游能力，而不是只替换编辑页

## 当前问题

### 页面接线已切换，但内核仍是占位实现

当前 `/content/aev` 已经通过 `IsleArticleEditor.vue` 接入新组件，但实际运行的不是根目录 `isle-editor/` 最新内核，而是迁入 feature 模块时留下的最小骨架：

- `src/features/isle-editor/core/editor.js`
- `src/features/isle-editor/vue/editor.js`
- `src/features/isle-editor/vue/isle-editor.js`

这些文件当前只是“可解析、可测试、可维持页面协议”的占位实现，并不具备真实上游编辑器能力。

### 当前占位实现的直接后果

- `/content/aev` 虽然已不再走旧 iframe host，但实际体验并不是最新 `isle-editor`
- 没有真实 TipTap/ProseMirror 编辑器实例
- 没有真实 `NotionKit` 挂载
- 没有真实 slash menu、bubble menu、media block、table、drag handle、toc menu 等能力
- viewer 也是项目内补写的最小渲染器，不是上游只读模式

这解释了当前 bug：

> `http://localhost:1994/content/aev` 的正文编辑器“不是最新的编辑器”

根因不是页面没切过来，而是页面接到的仍是“项目内占位壳”。

## 上游来源确认

本次替换以根目录 `isle-editor/` 为唯一真实内核来源，关键入口包括：

- `isle-editor/packages/core/src/editor.js`
- `isle-editor/packages/core/src/extensions/**`
- `isle-editor/packages/core/src/utils/**`
- `isle-editor/packages/vue3/src/editor.js`
- `isle-editor/packages/vue3/src/isle-editor.js`
- `isle-editor/packages/vue3/src/kit/**`
- `isle-editor/packages/vue3/src/components/**`
- `isle-editor/packages/vue3/src/utils/**`
- `isle-editor/packages/vue3/src/styles/**`

其中：

- `packages/core/src/**` 提供真实编辑器内核与扩展
- `packages/vue3/src/**` 提供 Vue 层包装、kit、菜单、node view、样式与工具
- `packages/vue3/src/kit/notion-kit.js` 是本次完整编辑体验的核心能力装配点

## 方案对比

### 方案 A：只替换 `core/editor.js` 与 `vue/isle-editor.js`

优点：

- 改动最小
- 风险表面上较低

缺点：

- 很难把 `NotionKit`、slash、media、table、toc、viewer 等能力一次性带齐
- 仍会保留大量当前 feature 模块的临时实现
- 很容易再次出现“看起来切了，实际上还是半套”的问题

结论：

- 不采用

### 方案 B：整体以根目录 `isle-editor/packages/core/src/**` 与 `packages/vue3/src/**` 为准，替换 feature 模块内核层，但保留项目级公开组件接口

优点：

- 最符合“使用真实最新内核”的目标
- 允许 `IsleArticleEditor.vue` / `IsleArticleViewer.vue` 继续作为项目页面的稳定入口
- 真实编辑器能力和项目适配边界清晰

缺点：

- 变更面大
- 需要系统处理路径、样式、上传接线、viewer 只读态和测试

结论：

- 采用

### 方案 C：直接在主前端运行时引用根目录 `isle-editor/` 工程，不迁入 feature 模块

优点：

- 拷贝最少

缺点：

- 构建和依赖边界重新变脆
- 不符合“迁入主仓库 feature 模块”的目标
- 后续维护与审查困难

结论：

- 不采用

## 选定方案

选择方案 B：

- 以内核来源 `isle-editor/packages/core/src/**` 和 `packages/vue3/src/**` 为准，整体替换 `nest-admin-frontend/src/features/isle-editor/**` 中当前的占位运行时实现
- 但保留 `IsleArticleEditor.vue` / `IsleArticleViewer.vue` 作为项目级对外组件

原因：

- 能真正解决“页面不是最新编辑器”的根因
- 不把业务页面再次耦合到上游细节
- 项目适配与上游内核职责分层明确

## 替换边界

### 上游对齐层

以下文件组应尽量以上游为准，整体同步：

- `src/features/isle-editor/core/**`
- `src/features/isle-editor/vue/**`
- `src/features/isle-editor/styles/**`

这里的原则是：

- 不继续保留当前假实现
- 不在这里塞项目业务逻辑
- 尽量保持上游文件职责和导出方式

### 项目适配层

以下文件继续保留在主仓库并承担项目集成职责：

- `src/features/isle-editor/adapters/isleContent.ts`
- `src/features/isle-editor/adapters/useIsleUpload.ts`

职责：

- 项目正文协议类型与帮助函数
- 项目上传接口到上游 `mediaHandlers` 的转换
- URL 规范化和默认文档工厂

### 项目公开组件层

以下文件继续作为页面直接使用的稳定入口：

- `src/features/isle-editor/components/IsleArticleEditor.vue`
- `src/features/isle-editor/components/IsleArticleViewer.vue`

要求：

- 尽量保持现有对外接口不变
- 内部替换为真实上游内核与真实只读实例
- 页面层尽量不再重新改一轮接口

## 数据流设计

### 编辑链路

`aev.vue` -> `IsleArticleEditor.vue` -> 真实上游 `IsleEditor + NotionKit`

其中：

- 页面继续使用 `v-model` 驱动正文
- `IsleArticleEditor.vue` 负责把 `modelValue`、`disabled`、`locale`、`theme`、`extensions` 映射到真实上游实例
- 真实实例输出的 `getJSON()` 结果必须直接作为 `contentJson`

### 查看链路

`view.vue` / `detail.vue` -> `IsleArticleViewer.vue` -> 真实上游只读实例

其中：

- viewer 不再自己维护最小渲染树作为主方案
- viewer 必须使用与 editor 同一套 schema / extensions
- 真实只读渲染必须输出可供 TOC 提取的标题 DOM

### 上传链路

`useIsleUpload.ts` -> `mediaHandlers` -> 上游 media block / media 扩展

其中：

- 图片、附件、视频统一复用现有 `/upload`
- 项目层负责把响应转成上游节点 attrs
- 页面不直接处理上传结果

## 运行时能力要求

本次完成后，`/content/aev` 编辑器运行时应直接具备：

- 真实 `Editor` 实例
- 真实 `NotionKit`
- slash menu
- bubble menu
- toc menu
- drag handle
- image / video / attachment 媒体能力
- table
- heading / list / task / blockquote / codeBlock 等结构化能力

查看态应具备：

- 与编辑态一致的 schema 渲染
- 标题 DOM 可被目录逻辑提取
- 图片、附件、视频、表格、任务列表等最小正确展示

## 路径与导入适配

迁入时需要系统处理两类导入：

- `@isle-editor/core`
- 上游内部的 `@/utils`、`@/components/...`

建议策略：

- 优先把上游源码中的导入改成 feature 模块内部相对路径
- 避免为了这套 feature 再新增大量仅内部使用的 Vite alias
- 如果个别路径过深，可以在 feature 内部建立局部 `index.js` 聚合入口，减少相对路径复杂度

## 风险与控制

### 风险 1：上游源码迁入后路径大量失效

控制：

- 先打通 feature 内部导入与构建
- 在页面接线前，先验证 `IsleArticleEditor` / `IsleArticleViewer` 可独立挂载

### 风险 2：上游真实输出 schema 与后端白名单仍不完全一致

控制：

- 以真实上游 `getJSON()` 输出为准回看后端白名单
- 缺什么节点/attrs 就补什么，禁止继续凭假实现推断协议

### 风险 3：viewer 切回真实只读内核后 TOC 失效

控制：

- viewer 替换后立即跑 `viewToc` 相关验证
- 若上游默认标题 DOM 缺稳定 `id`，在 viewer 层补最小 id 注入，而不是重写整个渲染器

### 风险 4：上游 mediaHandlers 接口与项目上传返回值不匹配

控制：

- 项目层保留统一上传适配层
- 逐类验证 image / attachment / video 的最小插入和展示

## 实施顺序

### 第一步：替换上游运行时入口

- 用根目录 `isle-editor/packages/core/src/editor.js` 替换当前 `core/editor.js`
- 用根目录 `isle-editor/packages/vue3/src/editor.js`、`isle-editor.js` 替换当前 `vue` 层入口

### 第二步：整体迁入上游 kit / components / styles / utils

- 让 `NotionKit`、menus、media block、node view、styles 都在主仓库 feature 模块内真实可运行

### 第三步：重新接线项目级组件

- `IsleArticleEditor.vue` 接入真实上游 editor + kit + mediaHandlers
- `IsleArticleViewer.vue` 接入真实只读实例，移除当前手写最小渲染树主逻辑

### 第四步：验证页面主链路

- `/content/aev` 确认真正出现最新编辑器体验
- `/content/articleManage/view` 与 `detail.vue` 验证只读渲染与 TOC

### 第五步：补测试与回归

- 更新组件测试
- 更新页面级测试
- 运行前端类型检查和最小相关测试

## 最终结论

本次不是再修补 `IsleEditor` 占位实现，而是把 `nest-admin-frontend/src/features/isle-editor/**` 真实对齐到根目录 `isle-editor/` 的最新运行时。

页面层继续保留：

- `IsleArticleEditor.vue`
- `IsleArticleViewer.vue`

作为稳定接口；但其内部运行时、kit、viewer、menus、media、styles、toc 支撑全部切换为上游真实实现。这样才能真正解决：

> `/content/aev` 当前不是最新编辑器

这个问题的根因。
