# Isle Editor + Tiptap 2 知识模块替换设计

## 目标

放弃继续把当前自研 `DocumentEditorV2` 作为知识模块主编辑器打磨，改为在知识模块内部单独切到 `Tiptap 2` 生态，并直接接入 `isle-editor` 作为新的主编辑器体系。

本次替换覆盖：

- `aev.vue` 编辑页
- `view.vue` 查看页
- `detail.vue` 详情页

本次目标不是“继续增强当前自研 V2”，而是让知识模块直接切换到 `isle-editor`，并在它之上继续做后续定制化功能和组件。

## 范围

本次设计覆盖：

- 知识模块内部切到 `Tiptap 2 + isle-editor` 的接入方式
- 编辑态与只读态的统一适配层设计
- `aev` / `view` / `detail` 三处页面的替换策略
- 数据格式、旧数据阻断、页面行为边界
- 风险、验证方式与实施顺序

本次不覆盖：

- 旧 `content` HTML 或旧 `contentJson` 的自动迁移
- 批量旧数据清洗脚本
- 复杂业务块和深度二次开发实现
- 知识模块之外页面的编辑器替换

## 当前问题

### 当前自研编辑器持续不稳定

当前自研 `DocumentEditorV2` 的问题已经不是单个功能点缺失，而是整体投入产出比过低：

- 功能闭环长期不稳定
- 展示和交互距离 `https://playground.islenote.com/` 这种成熟 Notion-like 工作区差距明显
- 继续在现有自研壳上打磨，无法满足用户对成熟编辑体验的预期

用户已经明确表达的目标是：

- 停止继续打磨这套自研编辑器
- 直接接入 `isle-editor`
- 后续在 `isle-editor` 基础上继续做定制化增加功能和组件

### 当前知识模块正文链路分散

当前知识模块正文链路不统一：

- `aev.vue` 是编辑链路
- `view.vue` 是只读查看链路
- `detail.vue` 是另一条只读详情链路

查看和详情页目前仍依赖旧的 Tiptap 只读渲染，不属于统一编辑器生态。

## 已确认约束

用户已经明确确认以下约束：

- 直接接入 `isle-editor`
- 直接替换主编辑器，不再继续把当前 `DocumentEditorV2` 当长期主方案打磨
- 编辑页、查看页、详情页一起改
- 允许不兼容旧数据
- 知识模块单独切到 `Tiptap 2`
- 其他模块仍维持当前 `Tiptap 3`
- 后续需要在 `isle-editor` 基础上继续做定制化功能和组件

## 关键事实

### `isle-editor` 依赖 `Tiptap 2`

调研已确认：

- `@isle-editor/core` 当前依赖 `@tiptap/core@^2.9.1`
- `@isle-editor/vue3` 当前发布版本为 `0.0.11`

因此，`isle-editor` 不是可以直接无缝接入当前 `Tiptap 3` 链路的包。

要直接接入 `isle-editor`，知识模块必须单独切到 `Tiptap 2` 生态。

### 不是全站降级，而是知识模块局部切栈

本次切换不是让整个前端项目从 `Tiptap 3` 降回 `Tiptap 2`，而是：

- 只有知识模块相关编辑器链路切到 `Tiptap 2 + isle-editor`
- 其他业务模块先不动

这个边界必须明确，否则后续维护会非常混乱。

## 方案对比

### 方案 A：知识模块直接全量切到 `Tiptap 2 + isle-editor`

- `aev` / `view` / `detail` 三处页面直接改用 `isle-editor`
- 知识模块旧编辑/只读链路全部退出主路径

优点：

- 结构最干净
- 后续维护最简单

缺点：

- 一次性替换面最大
- 如果接入后出现底层兼容问题，回退成本高

### 方案 B：建立可复用 `isle-editor-adapter`，再替换三处页面

- 先在 `features` 下建立适配层
- adapter 内部统一承接 `Tiptap 2 + isle-editor`
- `aev` / `view` / `detail` 只依赖 adapter，不直接碰 `isle-editor` 细节

优点：

- 风险最可控
- 页面与编辑器生态解耦
- 后续继续做业务扩展块、工具栏、按钮和其他定制都更容易

缺点：

- 首次接入会多一层封装成本

### 方案 C：只替换编辑页，查看与详情先不动

优点：

- 初期改动最小

缺点：

- 编辑和只读继续属于两套生态
- 不符合用户已经确认的“编辑查看一起改”目标

## 选定方案

选择方案 B：建立可复用 `isle-editor-adapter`，再替换 `aev` / `view` / `detail`。

原因：

- 用户已经接受知识模块单独切到 `Tiptap 2`
- 用户明确要在 `isle-editor` 之上继续做定制化
- adapter 是控制风险和保证后续可扩展性的最好边界
- 这能避免 `isle-editor` 细节直接散落到三处页面里

## 总体架构

建议新增：

- `nest-admin-frontend/src/features/isle-editor-adapter/`
- `nest-admin-frontend/src/features/isle-editor-adapter/KnowledgeIsleEditor.vue`
- `nest-admin-frontend/src/features/isle-editor-adapter/KnowledgeIsleViewer.vue`
- `nest-admin-frontend/src/features/isle-editor-adapter/core/createKnowledgeIsleEditor.ts`
- `nest-admin-frontend/src/features/isle-editor-adapter/core/createKnowledgeIsleViewer.ts`
- `nest-admin-frontend/src/features/isle-editor-adapter/core/knowledgeIsleGuards.ts`
- `nest-admin-frontend/src/features/isle-editor-adapter/core/knowledgeIsleEvents.ts`
- `nest-admin-frontend/src/features/isle-editor-adapter/core/knowledgeIsleBlocks.ts`

### 组件职责

#### `KnowledgeIsleEditor.vue`

只给 `aev.vue` 使用。

职责：

- 挂载 `isle-editor` 编辑模式
- 接收知识正文业务输入
- 向外输出统一正文更新事件
- 隔离 `isle-editor` 自身 API 和事件

页面层不直接操作 `isle-editor` 实例。

#### `KnowledgeIsleViewer.vue`

只给 `view.vue` 和 `detail.vue` 使用。

职责：

- 挂载 `isle-editor` 只读模式
- 接收知识正文内容并统一展示
- 对非新格式正文统一进入阻断展示

#### `core/*`

职责：

- 统一编辑器创建
- 统一只读实例创建
- 内容守卫与格式识别
- 事件回传包装
- 错误和阻断逻辑收口
- 后续业务块和扩展点预留

页面层不直接处理 `isle-editor` 底层细节。

## 依赖与模块边界

### 知识模块局部切栈

这次替换的依赖边界必须固定为：

- 全站其他模块继续保留当前 `Tiptap 3`
- 只有知识模块相关编辑器链路切到 `Tiptap 2 + isle-editor`

### 页面层边界

知识模块三处页面替换后：

- `aev` / `view` / `detail` 不再直接引用当前旧 `createDocumentExtensions`
- 不再直接使用当前旧 `useEditor / EditorContent` 只读链路
- 不再把当前自研 `DocumentEditorV2` 当主路径

三处页面统一只依赖：

- `KnowledgeIsleEditor.vue`
- `KnowledgeIsleViewer.vue`

这样做的原因是：

- 避免知识模块内部继续混用两代 Tiptap API
- 避免页面层直接承受底层依赖升级/降级成本
- 保证后续维护者可以明确判断正文链路边界

## 数据与兼容边界

### 主数据格式

本次替换后，以 `isle-editor` 接受并输出的新文档结构作为知识正文唯一主格式。

结果：

- `aev` 保存时直接写新格式
- `view` / `detail` 只读展示只认新格式
- 页面层不再自行处理旧 HTML 或旧版 JSON 的兼容渲染

### 旧数据策略

本次允许不兼容旧数据，因此：

- 不做自动迁移
- 不做猜测式转换
- 不把旧数据兼容逻辑继续塞进页面层

处理方式：

- 编辑页遇到旧数据：直接阻断，提示旧正文暂不支持该编辑器
- 查看页 / 详情页遇到旧数据：统一进入阻断态或占位提示

这样做的原因是：

- 当前目标是尽快替换掉长期不可用的主编辑器
- 兼容旧数据会显著放大复杂度
- 用户已明确接受不兼容旧数据

## 三处页面替换设计

### `aev.vue`

替换策略：

- 删除当前正文区旧编辑器主逻辑
- 正文区统一接 `KnowledgeIsleEditor.vue`
- 页面保留原有业务字段、保存逻辑、借阅逻辑、模板逻辑
- 正文编辑行为全部下沉到 adapter 层

结果：

- 页面仍是业务表单页
- 但正文编辑器不再由页面自己控制内部编辑细节

### `view.vue`

替换策略：

- 删除当前 `useEditor + EditorContent + createDocumentExtensions` 只读链路
- 改为统一接 `KnowledgeIsleViewer.vue`
- 目录提取优先复用 `isle-editor` 能力；若不足，再在 adapter 层统一补目录扫描

### `detail.vue`

替换策略：

- 与 `view.vue` 保持一致
- 不再单独维护另一套正文只读渲染逻辑

结果：

- 编辑、查看、详情全部进入同一编辑器生态
- 页面层只保留业务信息与业务操作

## 交互与展示目标

本次切换到 `isle-editor` 的目的，不只是替换底座，还包括直接获得更成熟的交互工作区体验。

目标包括：

- 更接近 `https://playground.islenote.com/` 的布局层级
- 编辑态与只读态在视觉上保持统一
- 正文区是页面主舞台
- slash、块级操作、工具区优先使用 `isle-editor` 现成能力
- 后续定制需求建立在 `isle-editor` 之上，而不是重新从零搭壳

## 测试策略

### 1. adapter 层测试

至少覆盖：

- `KnowledgeIsleEditor.vue` 可挂载
- 新文档初始化成功
- 编辑后能回传新格式内容
- `disabled` 生效
- `KnowledgeIsleViewer.vue` 可挂载
- 新格式内容可正常只读展示
- 非新格式内容会进入阻断态
- `knowledgeIsleGuards.ts` 能正确区分新格式和非新格式

### 2. 页面守卫测试

至少覆盖：

- `aev.vue` 已接入 `KnowledgeIsleEditor`
- `aev.vue` 不再引用旧正文编辑器
- `view.vue` 已接入 `KnowledgeIsleViewer`
- `detail.vue` 已接入 `KnowledgeIsleViewer`
- 三处页面不再保留旧正文渲染主链路

### 3. 手工验证

本次最关键的验证项：

- 新建知识
- 输入正文
- slash 插入常用块
- 保存
- 刷新后重新打开
- 从查看页打开
- 从详情页打开
- 旧数据是否正确阻断

## 主要风险

### 1. `isle-editor` 接入兼容性

风险：

- 它依赖 `Tiptap 2`
- 当前项目主链路是 `Tiptap 3`
- 即便知识模块局部切栈，也可能出现依赖、打包或样式层面的冲突

策略：

- 所有 `isle-editor` 细节收口在 adapter 层
- 页面不直接碰 `isle-editor` 实例
- 替换范围严格限制在知识模块三处页面

### 2. 样式与业务页冲突

风险：

- `isle-editor` 自带 UI 风格
- 可能与 Element Plus 和当前表单页结构冲突

策略：

- 统一由 adapter 负责编辑器容器样式
- 页面层不再自建正文区编辑器壳

### 3. 数据格式切换风险

风险：

- 新格式与旧知识正文不兼容

策略：

- adapter 输出唯一主格式
- 页面不做自动迁移
- 旧格式统一阻断，不做猜测转换

### 4. 只读模式与编辑模式 API 不一致

风险：

- `isle-editor` 编辑态与只读态接口可能不是完全同构

策略：

- 分别封装 `KnowledgeIsleEditor` 与 `KnowledgeIsleViewer`
- 页面层永远只看到统一业务接口

## 实施顺序

建议严格按以下顺序实施：

1. 建 `isle-editor-adapter` 基础骨架
2. 打通 `KnowledgeIsleEditor.vue`
3. 打通 `KnowledgeIsleViewer.vue`
4. 实现新格式检测与旧数据阻断
5. 替换 `aev.vue`
6. 替换 `view.vue`
7. 替换 `detail.vue`
8. 跑测试与手工验证
9. 再决定是否删除当前 `document-editor-v2`

## 不做事项

本轮不做：

- 旧数据迁移
- 批量修复脚本
- 复杂业务块正式开发
- 知识模块之外的编辑器替换

## 结论

本次采用“知识模块单独切到 `Tiptap 2` + 建立可复用 `isle-editor-adapter` + 三处页面统一替换”的方式接入 `isle-editor`，并以它作为知识模块的新主编辑器体系。

编辑、查看、详情全部统一进入同一编辑器生态，旧数据不兼容且统一阻断。页面层只保留业务逻辑，编辑器能力全部收口到 adapter。
