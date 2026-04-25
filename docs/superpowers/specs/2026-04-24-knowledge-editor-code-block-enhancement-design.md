# Knowledge Editor 代码块增强设计

## 目标

在 `knowledge-editor-app` 中增强 Isle 编辑器代码块能力，补齐以下功能：

- 代码块语言切换
- 基于 `highlight.js` 的语法高亮
- 查看态代码高亮与行号展示
- 编辑态代码行号展示
- 编辑态延迟高亮镜像层

本次目标不是重新设计整个编辑器，也不是修改 `@isle-editor/core` 源码，而是在现有 `codeBlock` NodeView 接管能力基础上做最小必要增强。

## 范围

本次设计覆盖：

- `knowledge-editor-app/src/core/codeBlockView.ts` 的代码块 NodeView 扩展
- `knowledge-editor-app/src/components/EditorShell.vue` 的代码块接线增强
- `knowledge-editor-app/src/components/ViewerShell.vue` 的代码块查看态增强
- 代码块语言列表、高亮逻辑、行号逻辑、复制交互的前端实现
- 与代码块相关的最小测试补充

本次不覆盖：

- 自动识别代码语言
- 语言别名和所有冷门语言的完整支持
- 代码折叠
- 代码块主题切换
- 查看态以外的全文搜索高亮
- `@isle-editor/core` 或 `NotionKit` 上游源码改造

## 当前现状

当前 `knowledge-editor-app` 已具备以下基础：

- `EditorShell.vue` 已通过 `NotionKit.configure({ codeBlock: { nodeView: createCodeBlockView() } })` 接管代码块视图
- `ViewerShell.vue` 仍使用默认 `NotionKit.configure({ dragHandle: false })`，未接入自定义代码块展示
- `codeBlock` 节点已存在 `language` 属性线索，测试中已有 `attrs: { language: null }`
- 当前已实现代码块复制按钮和退出代码块行为

当前缺口：

- 没有语言切换 UI
- 没有高亮库和高亮渲染
- 查看态没有代码块增强
- 编辑态没有行号
- 编辑态不能直接安全地对真实 `contentDOM` 注入高亮 HTML

## 约束

本次设计遵循以下约束：

- 保持 `knowledge-editor-app` 独立子应用结构不变
- 不修改 `@isle-editor/core` 源码
- 保留现有复制按钮与代码块退出能力
- 代码块外观继续保持与文档整体风格一致，不引入深色卡片或强分割感
- 编辑态必须优先保证输入稳定性、选区稳定性和输入法兼容性

## 方案对比

### 方案 A：真实编辑层直接注入高亮 HTML

做法：

- 让 `contentDOM` 直接承载 `highlight.js` 输出的 token HTML

优点：

- 视觉上最直接
- 理论上编辑时就是最终高亮结果

缺点：

- 极易破坏 ProseMirror 对 `contentDOM` 的控制
- 光标、删除、回车、撤销重做、输入法都容易异常
- 与当前自定义 NodeView 组合风险高

结论：

- 不采用

### 方案 B：编辑态纯文本输入层 + 高亮镜像层 + 行号层

做法：

- 保持真实编辑区域为纯文本 `code`
- 额外增加只读高亮镜像层
- 额外增加只读行号层
- 代码变更后延迟同步镜像层和行号层

优点：

- 不破坏真实输入层
- 输入和选区稳定性最好
- 容易同时支持编辑态行号与查看态复用逻辑

缺点：

- 需要维护镜像层和编辑层的样式同步、滚动同步
- 不是逐字符即时高亮，而是短延迟更新

结论：

- 采用

### 方案 C：编辑态只做行号，查看态再做高亮

做法：

- 编辑态仅显示纯文本和行号
- 高亮只在查看态出现

优点：

- 实现最简单

缺点：

- 编辑体验和查看体验割裂明显
- 已不满足用户对编辑态高亮能力的确认要求

结论：

- 不采用

## 选定方案

选择方案 B：编辑态纯文本输入层 + 延迟高亮镜像层 + 行号层，查看态完整高亮与行号展示。

原因：

- 能满足语言切换、高亮、查看态行号、编辑态行号四个目标
- 不直接破坏 ProseMirror 的真实编辑层
- 风险和复杂度在当前项目里最可控

## 总体设计

### 设计原则

- 文档数据仍以 `Tiptap JSON` 为唯一事实来源
- `language` 存在于代码块节点属性，不从 DOM 推导
- 行号和高亮都属于展示层，不写入文档内容
- 编辑态先稳定输入，再延迟更新镜像高亮
- 查看态直接使用只读高亮渲染，不保留真实编辑层

### 新增模块

建议新增：

- `knowledge-editor-app/src/core/codeBlockLanguages.ts`
- `knowledge-editor-app/src/core/codeBlockHighlight.ts`

职责：

#### `codeBlockLanguages.ts`

- 维护首批支持语言列表
- 提供语言标签文本
- 统一默认语言值

首批支持语言：

- `plaintext`
- `javascript`
- `typescript`
- `json`
- `html`
- `css`
- `vue`
- `bash`
- `sql`
- `python`

#### `codeBlockHighlight.ts`

- 封装 `highlight.js` 调用
- 对非法或未支持语言做安全回退
- 提供代码文本转高亮 HTML 的方法
- 提供代码文本转行数的方法

## 代码块状态模型

本次代码块不是简单区分“编辑页”和“查看页”，而是明确区分以下三种状态：

### 状态 1：整个编辑器是查看态

- 代码块固定是查看态
- 显示高亮、行号、语言、复制按钮
- 不可编辑

### 状态 2：整个编辑器是编辑态，但当前代码块未聚焦

- 代码块仍按查看态展示
- 显示高亮、行号、语言、复制按钮
- 不显示真实输入层
- 视觉上保持与文档正文一致

### 状态 3：整个编辑器是编辑态，且当前代码块已聚焦

- 代码块切换为编辑态
- 显示真实输入层
- 仍保留行号
- 左上角在代码块内部显示语言切换
- 右上角在代码块内部显示复制按钮

状态切换规则：

- 查看页始终处于状态 1
- 编辑页默认进入状态 2
- 点击进入代码块或键盘导航进入代码块时，切到状态 3
- 退出代码块或点击代码块外部时，从状态 3 回到状态 2

## NodeView 结构

### 统一结构

代码块统一使用单一外层容器，工具控件始终位于代码块内部，正文根据状态切换查看层或编辑层：

```html
<div class="knowledge-code-block">
  <div class="knowledge-code-block__chrome">
    <select class="knowledge-code-block__language"></select>
    <button class="knowledge-code-block__copy"></button>
  </div>
  <div class="knowledge-code-block__body">
    <div class="knowledge-code-block__lines"></div>
    <div class="knowledge-code-block__content">
      <pre class="knowledge-code-block__viewer" aria-hidden="true"></pre>
      <pre class="knowledge-code-block__editor">
        <code></code>
      </pre>
    </div>
  </div>
</div>
```

约束：

- 真实可编辑内容仍然是 `contentDOM = code`
- `.knowledge-code-block__viewer` 只负责展示，不可编辑
- `.knowledge-code-block__lines` 只负责显示行号
- 状态 1 和状态 2 只显示查看层
- 只有状态 3 显示真实编辑层
- 工具控件不再独立占一行，而是放在代码块内部顶部区域

### 查看态结构

查看态和未聚焦态都使用同一套可视结构，只是来源不同：

```html
<div class="knowledge-code-block knowledge-code-block--viewer">
  <div class="knowledge-code-block__chrome">
    <span class="knowledge-code-block__language-label"></span>
    <button class="knowledge-code-block__copy"></button>
  </div>
  <div class="knowledge-code-block__body">
    <div class="knowledge-code-block__lines"></div>
    <pre class="knowledge-code-block__viewer"></pre>
  </div>
</div>
```

## 数据流

### 语言切换

编辑态语言切换流程：

1. 用户在工具栏选择语言
2. NodeView 读取选中值
3. 通过 `updateAttributes({ language })` 更新当前代码块节点属性
4. 触发高亮重算
5. 触发查看态渲染时使用同一语言属性

实现优先级：

1. 优先使用 `NodeViewRendererProps` 上的 `updateAttributes`
2. 如不可用，则用 `getPos + tr.setNodeMarkup` 回退

### 编辑态进入与退出

编辑页代码块状态切换流程：

1. 初始渲染时，如果编辑器可编辑但代码块未聚焦，显示查看层
2. 用户点击代码块正文区域或键盘进入代码块时，切换到编辑层
3. 用户退出代码块或点击代码块外部时，切回查看层

关键点：

- 编辑态不是默认常驻显示
- 未聚焦代码块按查看层渲染，避免视觉重影
- 查看层与编辑层不能同时以可见文字形式显示

### 编辑态高亮更新

代码块处于状态 3 时，代码变化流程：

1. 用户在真实 `contentDOM` 中输入
2. NodeView 从 `code.textContent` 读取纯文本
3. 立刻更新行号层
4. 退出编辑态或重新切回查看层时，使用当前纯文本和语言重算查看层高亮

关键点：

- 编辑输入期间优先保证输入稳定和无重影
- 查看层用于未聚焦和只读场景，不与编辑层同时显示文字

### 查看态高亮更新

查看态渲染流程：

1. 从代码块节点读取 `textContent` 和 `attrs.language`
2. 用 `highlight.js` 生成高亮 HTML
3. 根据文本换行数生成行号列表
4. 渲染为只读代码块

## 高亮策略

### 库选择

选择 `highlight.js`。

原因：

- 接入简单
- 语言支持广
- 适合当前项目轻量独立子应用
- 足够支持查看态和镜像高亮层

### 回退逻辑

高亮处理规则：

- 如果语言为空，使用 `plaintext`
- 如果语言不在支持列表，使用 `plaintext`
- 如果高亮过程抛错，使用经过 HTML 转义的纯文本

不采用自动识别语言，避免误判。

## 行号策略

### 行号生成规则

- 空代码块显示 1 行
- 文本按 `\n` 分割后生成行号
- 无论最后一行是否有换行符，都按实际可见行数计算

### 编辑态行号

- 编辑态行号独立渲染在左侧
- 每次文本变化时立即更新
- 如果代码块滚动，行号层与内容层同步滚动
- 未聚焦查看层和聚焦编辑层使用同一列行号容器，保持视觉位置不变

### 查看态行号

- 查看态直接根据只读文本生成行号
- 不参与复制内容
- 编辑页未聚焦时也沿用同一套查看层行号展示

## 样式设计

样式集中在 `knowledge-editor-app/src/styles/editor.css`。

要求：

- 保持与当前文档风格一致
- 不引入深色大卡片或强阴影
- 工具栏按钮和语言选择器轻量呈现
- 行号列颜色弱化，不抢正文视觉重心
- 编辑层和高亮层严格共用相同排版参数

关键样式点：

- `.knowledge-code-block__body` 使用双列布局
- `.knowledge-code-block__lines` 固定宽度
- `.knowledge-code-block__content` 相对定位
- `.knowledge-code-block__chrome` 绝对位于代码块内部顶部
- 语言切换固定在代码块内部左上角
- 复制按钮固定在代码块内部右上角
- 代码块正文统一预留顶部空间给内部工具位
- 查看层和编辑层只允许单一可见文字层，禁止出现重影

## 查看态接线

当前 `ViewerShell.vue` 仍使用默认 `NotionKit` 配置，本次需要接入与编辑态兼容的代码块渲染。

建议：

- 在 `ViewerShell.vue` 中也传入 `codeBlock` 自定义渲染能力
- 把高亮和行号计算逻辑抽到独立工具模块复用

不建议复制一份完全独立的代码块实现，避免后续维护分叉。

## 复制行为

保留现有复制功能，并继续遵循：

- 复制内容仅包含代码文本
- 不包含行号
- 成功后使用现有浮层提示 `已复制`
- 失败时提示 `复制失败`

## 测试与验证

### 单元测试

需要补充或调整：

- `codeBlockView.spec.ts`
- `editorStyle.spec.ts`
- 新增高亮工具和语言列表工具测试

测试重点：

- 默认语言回退
- 语言切换后属性更新
- 高亮 HTML 安全输出
- 行数统计正确
- 复制不带行号
- 未聚焦时代码块显示查看层
- 聚焦时代码块切到编辑层
- 工具控件位于代码块内部左右两侧

### 手工验证

必须覆盖：

- 新建代码块后默认语言展示正确
- 切换语言后高亮变化正确
- 编辑态行号随回车和删除即时变化
- 编辑态延迟高亮能在输入后稳定更新
- 中文输入法在代码块中不异常
- 查看态高亮和行号正常
- 长代码块滚动时行号不漂移
- 复制代码内容不包含行号
- Enter / ArrowDown 退出代码块行为仍正常

## 风险与缓解

### 风险 1：编辑态与查看态切换不稳定

缓解：

- 聚焦和失焦事件在 NodeView 内统一管理
- 明确只有一个可见文字层
- 手工验证点击进入、退出、键盘退出路径

### 风险 2：输入法或选区异常

缓解：

- 真实输入层始终保持纯文本
- 状态 3 内不叠加可见查看层文字
- 不在输入瞬间重建 `contentDOM`

### 风险 3：查看态和编辑态高亮逻辑分叉

缓解：

- 把高亮和行号逻辑抽到 `codeBlockHighlight.ts`
- Viewer 和 Editor 共用同一套数据处理函数

## 实施顺序

建议按以下顺序实施：

1. 引入 `highlight.js` 依赖
2. 新增语言列表与高亮工具模块
3. 扩展编辑态代码块 NodeView，加入语言切换和行号
4. 接入编辑态延迟高亮镜像层
5. 接入查看态高亮与行号
6. 调整样式，保证文档一体感
7. 补充测试并执行类型检查

## 结论

本次采用“编辑态纯文本输入层 + 延迟高亮镜像层 + 行号层，查看态完整高亮与行号展示”的方案。该方案在当前 `knowledge-editor-app` 技术栈下，能够在不破坏 ProseMirror 编辑稳定性的前提下，完成语言切换、语法高亮、查看态行号和编辑态行号需求。
