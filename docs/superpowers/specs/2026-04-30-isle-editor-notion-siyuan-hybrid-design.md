# Isle 编辑器 Notion/思源混合体验设计

## 背景

`/content/aev` 当前正文区使用 `IsleArticleEditor`，编辑器已经具备目录、工具栏、正文独立滚动区和媒体上传接入。最近已完成工具栏吸顶，长文档编辑时格式操作入口可以保持可见。

下一阶段目标不是重写编辑器，也不是完整复制 Notion 或思源笔记，而是在现有结构上做低风险体验增强：用 Notion 的轻输入感降低干扰，用思源的结构导航感支撑长文档维护，同时保留企业知识库的分类、权限、发布治理模型。

## 目标

本阶段只解决 5 个问题：

1. 工具栏弱化：保留吸顶，但视觉更轻，不抢正文。
2. 目录增强：左侧目录有明确标题、空状态和层级感。
3. 只读态明确：`disabled=true` 时呈现清晰查看模式，而不是像编辑器但不能输入。
4. 空文档引导：空内容时给出明确写作入口提示。
5. 正文纸张感：正文排版更像文档，减少表单输入框感。

## 非目标

本阶段不做以下内容：

- `/` 快捷插入菜单
- 块拖拽和块级排序
- 双链、反链、块引用
- Notion database properties
- 思源式完整块树导航
- 底层文档 JSON 结构变更
- 大规模重构 Isle/Tiptap 内核

## 设计原则

采用混合方向：

```text
Notion 的轻输入体验
+ 思源的结构导航感
+ 企业知识库的权限、分类、发布治理
```

编辑器内部聚焦正文输入和阅读，业务治理字段继续保留在 `aev.vue` 的表单分区中，不塞入正文编辑器。

## 涉及文件

主要修改范围：

- `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`

可选复用或少量补充：

- `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`

只有在需要判断空文档且现有工具函数不足时，才补充轻量工具函数。

## 组件结构设计

`IsleArticleEditor` 保持当前三层布局：

```text
isle-article-editor
└─ isle-article-editor__layout
   ├─ isle-article-editor__toc
   └─ isle-article-editor__main
      ├─ isle-article-editor__toolbar
      └─ isle-article-editor__scroll
         └─ isle-article-editor__content
```

本阶段不改变编辑器数据流，只增强视觉和状态表达。

## 工具栏设计

工具栏继续保持吸顶：

- `position: sticky`
- `top: 0`
- `z-index: 3`
- `background: var(--el-bg-color)`

在此基础上弱化视觉：

- 保持紧凑高度
- 保留底部分隔线
- 使用主题背景，不引入强品牌色
- 可增加非常轻的阴影或背景过渡，让滚动时层级清楚
- 目录切换按钮保持辅助入口，不和正文格式按钮竞争视觉权重

只读态下隐藏格式工具栏，仅保留查看模式提示和目录导航能力。

## 目录设计

目录区从裸 `IsleEditorToc` 增强为有语义的导航区域：

```text
目录
[自动目录]
```

视觉要求：

- 目录标题使用较小字号和中等字重
- 目录区背景保持轻灰或主题浅填充色
- 目录和正文之间用边框分隔
- 目录内容不抢正文主视觉

空状态文案：

```text
暂无目录
添加标题后自动生成
```

如果当前 `IsleEditorToc` 暂时无法准确暴露空目录状态，第一阶段允许只落地目录标题和容器样式，空状态作为后续增强。

## 只读态设计

`IsleArticleEditor` 的只读态继续由现有 `disabled` prop 决定：

```text
disabled=true -> IsleEditor editable=false
```

增强表达：

- 根节点增加只读 class，例如 `isle-article-editor--readonly`
- 根节点增加 `aria-readonly="true"`
- 隐藏编辑格式工具栏
- 保留目录和正文滚动阅读能力
- 在原工具栏位置显示查看模式提示

提示文案：

```text
查看模式
当前知识不可编辑，仅支持阅读
```

这样用户能明确区分“查看模式”和“编辑器故障/无法输入”。

## 空文档引导设计

空文档编辑态展示轻量提示：

```text
开始编写知识内容
输入内容，或使用工具栏插入标题、列表、图片和附件
```

判断规则优先复用已有文档工具。若没有可复用工具，可新增一个明确类型的轻量函数判断 `doc.content` 是否为空或仅包含空段落。

只读态下不显示写作引导，避免误导用户可以编辑。

## 正文纸张感设计

正文区域继续约束最大宽度，保持内容可读：

- `max-width` 保持在 `800px-860px`
- 正文容器水平居中
- 顶部和底部留出更稳定的文档间距
- 段落行高接近 `1.75`
- 标题上下间距清晰
- 列表、引用、代码块、表格、图片有基础一致样式

视觉上避免把正文区做成普通输入框。它应该像一张文档纸，而不是表单控件。

## 数据流

不改变现有数据流：

```text
aev.vue form.contentJson
-> IsleArticleEditor v-model
-> IsleEditor model-value
-> update:model-value
-> handleArticleContentUpdate
-> form.contentJson/contentText/contentVersion/contentStatus
```

只读态也不改变数据流，只通过 `disabled` 控制 `editable=false`。

## 错误处理

本阶段不新增保存、上传或文档解析逻辑，所以不新增业务错误处理。

需要避免的错误体验：

- 只读态仍展示可点击格式按钮
- 空文档提示覆盖真实内容
- 目录标题或空状态在小屏异常挤压
- 工具栏吸顶层级遮挡气泡菜单或正文内容

## 响应式设计

沿用现有策略：

- `1024px` 以下隐藏目录
- `1024px` 以下隐藏目录切换按钮
- 编辑器高度继续收敛为 `min(70vh, 760px)`

新增要求：

- 小屏下只读提示不能撑爆工具栏
- 正文 padding 可适当收窄
- 工具栏内容不能横向挤压正文区域

## 测试策略

使用现有布局守卫测试增强合同：

- `isleArticleEditor.layout.spec.ts` 验证工具栏继续吸顶
- 验证目录区包含明确标题
- 验证只读态有 `aria-readonly` 或只读 class 绑定
- 验证只读态不会渲染完整编辑工具栏
- 验证空文档引导结构存在

完成后运行：

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
npm run type-check
```

## 验收标准

实现完成后应满足：

- 编辑模式下工具栏固定在正文滚动区顶部，但视觉不压迫正文。
- 只读模式下用户能明确看到当前是查看模式。
- 只读模式下不展示可编辑格式工具栏。
- 目录区域有明确“目录”语义。
- 空文档编辑态有轻量写作引导。
- 正文排版更接近文档阅读体验。
- 不改变 `contentJson` 数据结构和保存接口。
- 相关布局测试和前端类型检查通过。
