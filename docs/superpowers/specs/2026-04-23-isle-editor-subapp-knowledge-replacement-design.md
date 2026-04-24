# Isle Editor 独立子应用知识模块替换设计

## 目标

不在现有 `nest-admin-frontend` 中直接混接 `Tiptap 2 + isle-editor`，而是把知识模块正文编辑器独立成一个前端子应用，通过 iframe + `postMessage` 的方式接入主前端，替换知识模块的编辑与只读主链路。

本次替换覆盖：

- `aev.vue` 编辑页
- `view.vue` 查看页
- `detail.vue` 详情页

本次目标不是继续打磨当前自研 `DocumentEditorV2`，也不是在现有前端依赖里硬混两代 Tiptap，而是通过独立子应用彻底隔离 `Tiptap 2 + isle-editor`，并把它作为知识模块新的正文编辑和展示主方案。

## 范围

本次设计覆盖：

- 独立前端子应用 `knowledge-editor-app` 的整体结构
- 主前端通过 iframe 宿主组件接入子应用的方式
- `aev` / `view` / `detail` 三处页面的替换策略
- `postMessage` 通信协议、数据边界、旧数据阻断策略
- 风险、验证方式与实施顺序

本次不覆盖：

- 旧 `content` HTML 或旧 `contentJson` 的自动迁移
- 批量旧数据修复脚本
- 知识模块之外页面的编辑器替换
- `isle-editor` 深度二次开发实现
- 复杂业务块的正式落地

## 当前问题

### 继续打磨当前自研编辑器已经不符合目标

当前自研 `DocumentEditorV2` 的问题已经不是局部缺陷，而是路线本身不合适：

- 功能闭环长期不稳定
- 展示和交互距离 `https://playground.islenote.com/` 差距明显
- 继续打磨现有自研壳，无法满足成熟编辑体验预期

用户当前目标已经明确为：

- 不再继续打磨当前自研编辑器
- 直接接入 `isle-editor`
- 后续在其基础上继续做定制化功能和组件

### 不能在现有前端项目里安全混接两代 Tiptap

调研与验证已确认：

- `@isle-editor/core` 当前依赖 `@tiptap/core@2.x`
- `nest-admin-frontend` 当前主链路使用 `@tiptap/*@3.x`
- 在同一个 npm 项目里直接把知识模块切到 `Tiptap 2`，会造成真实的 peer 依赖冲突

因此，“在现有主前端项目里直接混接 `isle-editor`”这条路线不可持续。

## 已确认约束

用户已经明确确认以下约束：

- 直接接入 `isle-editor`
- 直接替换主编辑器，不再继续把当前 `DocumentEditorV2` 当长期主方案打磨
- 编辑页、查看页、详情页一起改
- 允许不兼容旧数据
- 不在现有主前端里混接 `Tiptap 2`
- 采用独立前端子应用隔离 `isle-editor`
- 主前端继续维持当前依赖生态不动

## 方案对比

### 方案 A：在 `nest-admin-frontend` 里继续尝试局部切到 `Tiptap 2`

优点：

- 页面集成看起来更直接

缺点：

- 已验证会出现真实依赖冲突
- 运行时和安装链路都不稳定
- 不适合作为可维护方案

### 方案 B：独立前端子应用 + iframe 宿主组件 + `postMessage` 通信

优点：

- 依赖隔离最彻底
- 样式隔离最彻底
- 主前端无需引入 `Tiptap 2 + isle-editor`
- 风险范围严格收敛在知识模块正文区

缺点：

- 增加一个前端子应用的运维和联调成本
- 需要设计稳定的宿主组件和通信协议

### 方案 C：把子应用打成本地包再注入主前端

优点：

- 视觉上看起来更像单应用

缺点：

- 依赖边界重新变模糊
- 很容易再次污染主前端依赖树
- 不符合选择独立子应用的本意

## 选定方案

选择方案 B：独立前端子应用 + iframe 宿主组件 + `postMessage` 通信。

原因：

- 这是彻底隔离 `Tiptap 2 + isle-editor` 的最干净方式
- 不会继续污染 `nest-admin-frontend` 的依赖树
- 主前端与子应用边界清晰，后续维护成本更可控
- 依然能满足“编辑、查看、详情三处一起替换”的目标

## 总体架构

建议新增一个与 `nest-admin-frontend` 并列的独立前端项目：

- `knowledge-editor-app/`

它是一个完整独立应用，拥有自己的：

- `package.json`
- `vite.config.ts`
- `src/main.ts`
- `src/App.vue`

### 子应用建议结构

- `knowledge-editor-app/src/router/index.ts`
- `knowledge-editor-app/src/pages/EditorPage.vue`
- `knowledge-editor-app/src/pages/ViewerPage.vue`
- `knowledge-editor-app/src/components/EditorShell.vue`
- `knowledge-editor-app/src/components/ViewerShell.vue`
- `knowledge-editor-app/src/core/createIsleEditor.ts`
- `knowledge-editor-app/src/core/createIsleViewer.ts`
- `knowledge-editor-app/src/core/documentGuards.ts`
- `knowledge-editor-app/src/core/documentBridge.ts`
- `knowledge-editor-app/src/core/documentMessages.ts`
- `knowledge-editor-app/src/styles/editor.css`

### 子应用职责

#### `EditorPage.vue`

职责：

- 挂载 `isle-editor` 编辑模式
- 接收主前端传入的正文初始化内容
- 把编辑结果、就绪状态、高度变化发回主前端

#### `ViewerPage.vue`

职责：

- 挂载 `isle-editor` 只读模式
- 统一渲染知识正文
- 必要时把目录和高度发回主前端

#### `EditorShell.vue / ViewerShell.vue`

职责：

- 控制真正的编辑器工作区外壳
- 负责宽度、留白、滚动区、目录区、工具区
- 视觉上尽量接近 `https://playground.islenote.com/`

#### `documentBridge.ts`

职责：

- 统一承接和发送 `postMessage`
- 不允许页面层和编辑器层到处直接写 `window.parent.postMessage`

#### `documentGuards.ts`

职责：

- 新格式识别
- 空文档初始化
- 旧数据阻断

#### `documentMessages.ts`

职责：

- 定义主前端与子应用之间的协议常量和类型
- 避免双方各写一套字符串协议

## 主前端宿主组件设计

为了避免 `aev / view / detail` 三处页面都各自处理 iframe 与消息通信，建议主前端新增宿主组件：

- `nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeEditorHost.vue`
- `nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeViewerHost.vue`
- `nest-admin-frontend/src/features/knowledge-editor-host/core/hostMessages.ts`

### `KnowledgeEditorHost.vue`

只给 `aev.vue` 使用。

职责：

- 挂编辑模式 iframe
- 向子应用发送初始化正文
- 接收 `content-change`
- 接收 `ready`
- 接收 `height-change`
- 接收 `blocked`
- 对外暴露最小业务接口：`contentJson`、`update:contentJson`、`disabled`

### `KnowledgeViewerHost.vue`

只给 `view.vue` 与 `detail.vue` 使用。

职责：

- 挂只读模式 iframe
- 传入正文内容
- 接收高度变化
- 接收目录变化
- 接收阻断结果

### 主前端职责边界

主前端只负责：

- 业务表单
- 业务按钮
- 借阅、权限、模板、保存
- 根据宿主组件返回的新格式正文进行保存与展示

主前端不直接感知 `isle-editor` 内部实例。

## 集成方式

采用：iframe 嵌入 + `postMessage` 通信。

### 为什么采用 iframe

- 依赖隔离最彻底
- 样式隔离最彻底
- 运行时边界最明确

不采用直接 bundle 注入或本地包直接 mount 的原因是：

- 会重新打碎依赖边界
- 重新把 `Tiptap 2 + isle-editor` 带回主前端生态
- 与“独立子应用”的目标冲突

### 子应用页面路由

建议至少提供：

- `/editor`
- `/viewer`

## 通信协议设计

### 主前端发送给子应用

- `knowledge-editor:init`
- `knowledge-editor:update-content`
- `knowledge-editor:set-disabled`
- `knowledge-editor:dispose`

建议初始化消息结构：

```ts
type KnowledgeEditorInitMessage = {
  type: 'knowledge-editor:init'
  payload: {
    mode: 'edit' | 'view'
    content: unknown
    disabled?: boolean
    articleId?: string
  }
}
```

### 子应用发送给主前端

- `knowledge-editor:ready`
- `knowledge-editor:content-change`
- `knowledge-editor:height-change`
- `knowledge-editor:toc-change`
- `knowledge-editor:blocked`
- `knowledge-editor:error`

建议内容变更消息结构：

```ts
type KnowledgeEditorContentChangeMessage = {
  type: 'knowledge-editor:content-change'
  payload: {
    content: unknown
  }
}
```

建议阻断消息结构：

```ts
type KnowledgeEditorBlockedMessage = {
  type: 'knowledge-editor:blocked'
  payload: {
    reason: 'legacy_html' | 'invalid_document'
  }
}
```

### 高度同步策略

子应用必须主动上报高度：

- 主前端不猜测 iframe 高度
- 子应用在初始化、内容变更、窗口尺寸变化后发送 `height-change`
- 主前端根据返回高度调整容器

目的是避免滚动套滚动和高度截断。

## 数据与兼容边界

### 主数据格式

子应用输出的新正文格式作为知识正文唯一主格式。

结果：

- `aev` 保存时直接写新格式
- `view` / `detail` 只读展示只认新格式
- 主前端页面不再自行处理旧 HTML 或旧自研 JSON 的兼容渲染

### 旧数据策略

本次允许不兼容旧数据，因此：

- 不做自动迁移
- 不做猜测式转换
- 主前端与子应用都只负责阻断，不负责迁移

处理方式：

- 编辑页遇到旧数据：主前端先阻断；子应用内部再守卫一次
- 查看页 / 详情页遇到旧数据：主前端直接阻断或占位，不强行打开 iframe

这样做的原因是：

- 当前目标是尽快替换掉长期不可用的主编辑器
- 兼容旧数据会显著放大复杂度
- 用户已明确接受不兼容旧数据

## 三处页面替换设计

### `aev.vue`

替换策略：

- 正文区改为统一接 `KnowledgeEditorHost.vue`
- 页面保留表单、保存、借阅、模板、权限逻辑
- 正文编辑行为全部交给子应用

### `view.vue`

替换策略：

- 删除当前旧 Tiptap 只读渲染
- 改为统一接 `KnowledgeViewerHost.vue`
- 目录优先复用子应用返回；若不足，再考虑主前端补充

### `detail.vue`

替换策略：

- 与 `view.vue` 保持一致
- 不再单独维护另一套正文只读展示逻辑

结果：

- 编辑、查看、详情全部统一进入同一正文生态
- 主前端页面只保留业务信息与业务操作

## 交互与展示目标

本次切换到 `isle-editor` 子应用的目的，不只是替换底座，还包括直接获得更成熟的交互与展示体验。

目标包括：

- 更接近 `https://playground.islenote.com/` 的布局层级
- 编辑态与只读态在视觉上统一
- 正文区是页面主舞台
- slash、块级操作、目录和工具区优先使用 `isle-editor` 现成能力
- 后续定制需求建立在子应用内部，而不是继续回到主前端硬搭壳

## 测试策略

### 1. 子应用测试

至少覆盖：

- `EditorPage.vue` 可挂载
- `ViewerPage.vue` 可挂载
- `documentGuards.ts` 正确识别新格式与旧数据
- `documentBridge.ts` 可正确收发消息
- 高度变化消息可发出

### 2. 主前端宿主组件测试

至少覆盖：

- `KnowledgeEditorHost.vue` 能挂 iframe
- 能发送初始化消息
- 能接收 `content-change`
- 能接收 `blocked`
- `KnowledgeViewerHost.vue` 能接收 `height-change` 与 `toc-change`

### 3. 页面守卫测试

至少覆盖：

- `aev.vue` 已接入 `KnowledgeEditorHost`
- `view.vue` 已接入 `KnowledgeViewerHost`
- `detail.vue` 已接入 `KnowledgeViewerHost`
- 三处页面不再保留旧正文渲染主链路

### 4. 手工验证

本次最关键的验证项：

- 新建知识时编辑页可正常打开子应用编辑器
- 输入正文可同步回主前端
- 保存后刷新可再次打开
- 查看页与详情页都能正常只读展示
- 目录与高度同步可用
- 旧数据是否正确阻断

## 主要风险

### 1. iframe 集成体验割裂

风险：

- 嵌套滚动
- 高度不同步
- 看起来像拼进去的外部页面

策略：

- 子应用主动上报高度
- 主前端不猜测高度
- 壳体样式统一在宿主组件层处理

### 2. 消息通信不同步

风险：

- 主前端和子应用消息结构漂移

策略：

- 协议集中在 `documentMessages.ts` 与 `hostMessages.ts`
- 不允许页面直接拼字符串消息

### 3. 子应用联调成本上升

风险：

- 本地开发和联调路径更复杂

策略：

- 明确子应用独立启动方式
- 主前端宿主组件通过固定 URL 或配置项接入

### 4. `isle-editor` 只读能力不如预期

风险：

- 查看页 / 详情页还需要额外补目录或只读包装

策略：

- 只读页统一通过 `ViewerPage.vue` 承接
- 不把兼容逻辑扩散回主前端

## 实施顺序

建议严格按以下顺序实施：

1. 新建 `knowledge-editor-app` 子应用骨架
2. 建立 `documentGuards.ts` 与 `documentBridge.ts`
3. 打通 `EditorPage.vue`
4. 打通 `ViewerPage.vue`
5. 在主前端建立 `KnowledgeEditorHost.vue`
6. 在主前端建立 `KnowledgeViewerHost.vue`
7. 替换 `aev.vue`
8. 替换 `view.vue`
9. 替换 `detail.vue`
10. 跑测试与手工验证

## 不做事项

本轮不做：

- 旧数据迁移
- 批量修复脚本
- 知识模块之外的编辑器替换
- 复杂业务块正式开发

## 结论

本次采用“独立前端子应用 + 主前端 iframe 宿主组件 + `postMessage` 通信”的方式接入 `isle-editor`，并把它作为知识模块新的正文编辑和只读展示主方案。

`knowledge-editor-app` 内部独立维护 `Tiptap 2 + isle-editor`，`nest-admin-frontend` 继续保持现有依赖不动。`aev`、`view`、`detail` 三处页面统一通过宿主组件接入，旧数据不兼容且统一阻断。
