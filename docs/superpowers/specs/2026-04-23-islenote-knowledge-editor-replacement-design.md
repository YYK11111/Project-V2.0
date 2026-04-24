# IsleNote 知识编辑器替换设计

## 目标

停止继续打磨当前自研 `DocumentEditorV2` 作为知识模块主编辑器，改为直接接入 `islenote`，并让它成为知识模块的统一编辑与只读展示方案。

本次替换覆盖：

- `aev.vue` 编辑页
- `view.vue` 查看页
- `detail.vue` 详情页

本次目标不是“渐进增强当前自研编辑器”，而是以 `islenote` 为核心重新建立知识正文的编辑和展示主链路。

## 范围

本次设计覆盖：

- `islenote` 在当前前端项目中的接入方式
- 知识模块编辑态与只读态的统一适配层设计
- `aev` / `view` / `detail` 三处页面的替换策略
- 数据格式、旧数据阻断和页面行为边界
- 风险、验证方式与实施顺序

本次不覆盖：

- 旧 `content` HTML 或旧 `contentJson` 的自动迁移
- 旧数据批量清洗脚本
- 自定义复杂业务块的正式实现
- `islenote` 深度二次开发细节
- 其他业务模块的编辑器替换

## 当前问题

### 自研编辑器持续不稳定

当前自研 `DocumentEditorV2` 存在两个核心问题：

- 功能闭环长期不稳定，继续打磨投入产出比低
- 展示与交互方式距离 `https://playground.islenote.com/` 这类成熟 Notion-like 工作区差距明显

用户当前诉求已经不是“继续修当前 V2 的某几个问题”，而是：

- 放弃继续把现有自研编辑器打磨成主方案
- 直接接入 `islenote`
- 之后在它之上再做功能和组件定制

### 当前知识模块的正文链路分散

当前三处页面使用的正文链路并不统一：

- `aev.vue` 是编辑链路
- `view.vue` 是只读查看链路
- `detail.vue` 是详情只读链路

其中查看和详情页目前仍依赖旧的 Tiptap 只读渲染方式，与编辑页并不是统一编辑器生态。

## 已确认约束

用户已经明确确认以下约束：

- 直接接入 `islenote`
- 直接替换主编辑器，不再继续把当前 `DocumentEditorV2` 当长期主方案打磨
- 编辑页、查看页、详情页一起改
- 允许不兼容旧数据
- 后续需要在 `islenote` 基础上继续做定制化功能和组件

## 方案对比

### 方案 A：直接把 `islenote` 散落接进三处页面

- `aev.vue` 直接接编辑器
- `view.vue` / `detail.vue` 直接接只读模式
- 页面各自处理数据和展示适配

优点：

- 初期看起来最快

缺点：

- 三处页面都会直接依赖 `islenote`
- 后续定制扩展会分散到页面层
- 编辑器替换成本和维护成本都高

### 方案 B：建立通用 `islenote-adapter`，再替换三处页面

- 先在 `features` 下建立适配层
- 页面只消费 `KnowledgeIsleEditor` 和 `KnowledgeIsleViewer`
- 所有 `islenote` 细节都收口到适配层

优点：

- 编辑器替换与页面业务解耦
- 后续继续做业务扩展块或能力增强更容易
- `aev` / `view` / `detail` 三处保持一致边界

缺点：

- 首次接入会多一层封装成本

### 方案 C：只替换编辑页，查看和详情继续保留旧只读渲染

优点：

- 初期改动最小

缺点：

- 编辑和只读会继续属于两套生态
- 不符合用户已经明确确认的“编辑查看一起改”目标

## 选定方案

选择方案 B：先建立可复用 `islenote-adapter`，再替换 `aev` / `view` / `detail`。

原因：

- 用户已经明确接受直接替换主编辑器
- 用户明确希望后续继续做定制化功能和组件
- 适配层是后续继续定制和控制风险的最佳边界
- 这能避免 `islenote` 细节渗透到三处页面里

## 总体架构

建议新增：

- `nest-admin-frontend/src/features/islenote-adapter/`
- `nest-admin-frontend/src/features/islenote-adapter/KnowledgeIsleEditor.vue`
- `nest-admin-frontend/src/features/islenote-adapter/KnowledgeIsleViewer.vue`
- `nest-admin-frontend/src/features/islenote-adapter/core/createKnowledgeIsleEditor.ts`
- `nest-admin-frontend/src/features/islenote-adapter/core/createKnowledgeIsleViewer.ts`
- `nest-admin-frontend/src/features/islenote-adapter/core/knowledgeIsleContent.ts`
- `nest-admin-frontend/src/features/islenote-adapter/core/knowledgeIsleGuards.ts`
- `nest-admin-frontend/src/features/islenote-adapter/core/knowledgeIsleEvents.ts`

### 组件职责

#### `KnowledgeIsleEditor.vue`

只给编辑页 `aev.vue` 使用。

职责：

- 挂载 `islenote` 编辑模式
- 接受知识正文业务层输入
- 向外输出统一的正文更新事件
- 隔离 `islenote` 自身的 API 和事件

页面层不直接感知 `islenote` 的内部实例。

#### `KnowledgeIsleViewer.vue`

给 `view.vue` 与 `detail.vue` 使用。

职责：

- 挂载 `islenote` 只读模式
- 接收知识正文内容并统一展示
- 对非新格式数据统一进入阻断展示

#### `core/*`

职责：

- 统一编辑器创建
- 统一只读实例创建
- 内容格式检测
- 事件回传包装
- 错误和阻断逻辑收口

页面不直接处理 `islenote` 的底层细节。

## 数据与兼容边界

### 主数据格式

本次替换后，以 `islenote` 接受并输出的新文档结构作为知识正文唯一主格式。

结果：

- `aev` 保存时直接写新格式
- `view` / `detail` 只读展示也只认新格式
- 页面层不再自行处理旧 HTML 或旧自研 JSON 的兼容渲染

### 旧数据策略

本次明确允许不兼容旧数据，因此：

- 不做自动迁移
- 不做猜测式转换
- 不把旧数据兼容逻辑继续塞进页面层

处理方式：

- 编辑页遇到旧数据：直接阻断，提示当前旧正文暂不支持该编辑器
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

- 页面仍然是业务表单页
- 但正文编辑器将不再由页面自己控制内部编辑细节

### `view.vue`

替换策略：

- 删除当前 `useEditor + EditorContent + createDocumentExtensions` 只读链路
- 改为统一接 `KnowledgeIsleViewer.vue`
- 目录提取优先复用 `islenote` 能力；若不足，再在 adapter 层统一补目录扫描

### `detail.vue`

替换策略：

- 与 `view.vue` 保持一致
- 不再单独维护另一套只读富文本展示逻辑

结果：

- 编辑、查看、详情全部进入同一编辑器生态
- 页面层只保留业务信息与业务操作

## 交互与展示目标

本次切换到 `islenote` 的目的，不只是替换底座，还包括直接获得更成熟的交互工作区体验。

目标包括：

- 更接近 `https://playground.islenote.com/` 的布局层级
- 编辑态与只读态在视觉上保持统一
- 正文区是页面主舞台
- slash、块级操作、工具区优先使用 `islenote` 现成能力
- 后续定制需求建立在 `islenote` 之上，而不是重新从零搭壳

## 测试策略

### 1. 适配层测试

至少覆盖：

- `KnowledgeIsleEditor.vue` 可挂载
- 初始化新文档成功
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
- 查看与详情页不再保留旧 Tiptap 只读链路

### 3. 手工验证

本次最关键的验证项：

- 新建知识
- 输入正文
- slash 插入常用块
- 保存
- 刷新后重新打开
- 从查看页打开
- 从详情页打开
- 非新格式旧文章是否正确阻断

## 主要风险

### 1. `islenote` 与当前项目依赖兼容性

风险：

- 依赖版本不匹配
- Vue 封装与当前项目运行方式不兼容

策略：

- 所有集成都先收口在 adapter 层
- 页面不直接依赖 `islenote` 实例细节

### 2. 样式与 Element Plus 页面结构冲突

风险：

- 编辑器样式污染业务页
- 只读展示与现有页面层次冲突

策略：

- 统一由 adapter 负责编辑器容器样式
- 页面层不自行拼装编辑器壳

### 3. 数据格式切换风险

风险：

- 新数据格式与当前保存链路不一致

策略：

- 页面只认 adapter 输出的新格式
- 旧数据直接阻断，不自动迁移

### 4. 查看与编辑 API 不一致

风险：

- `islenote` 的编辑态与只读态接口不完全一致

策略：

- 在 `KnowledgeIsleEditor` 与 `KnowledgeIsleViewer` 两层分别封装
- 页面层看到的始终是统一业务接口

## 实施顺序

建议严格按以下顺序实施：

1. 建 `islenote-adapter` 基础骨架
2. 打通 `KnowledgeIsleEditor.vue`
3. 打通 `KnowledgeIsleViewer.vue`
4. 实现新格式检测与阻断逻辑
5. 替换 `aev.vue`
6. 替换 `view.vue`
7. 替换 `detail.vue`
8. 跑测试与手工验证
9. 再决定是否删除当前 `document-editor-v2`

## 不做事项

本轮不做：

- 旧数据迁移
- 批量数据修复脚本
- 复杂业务块开发
- 非知识模块页面替换

## 结论

本次采用“可复用 adapter + 三处页面统一替换”的方式接入 `islenote`，并以它作为知识模块的新主编辑器体系。

编辑、查看、详情全部统一进入同一编辑器生态，旧数据不兼容，统一阻断。页面层只保留业务逻辑，编辑器能力全部收口到 `islenote-adapter`。
