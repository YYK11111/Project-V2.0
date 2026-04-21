# 项目页面暗黑模式继续治理设计

## 目标

继续治理 `projectManage` 相关页面的暗黑模式兼容问题，覆盖 `detail.vue`、`approval.vue`，并顺带检查 `cockpit.vue`。本次只处理视觉层样式，不改业务逻辑、接口和交互流程。

## 范围

- 必修页面：`nest-admin-frontend/src/views/business/projectManage/detail.vue`
- 必修页面：`nest-admin-frontend/src/views/business/projectManage/approval.vue`
- 顺带检查：`nest-admin-frontend/src/views/business/projectManage/cockpit.vue`
- 对齐基准：`nest-admin-frontend/src/views/business/projectManage/form.vue`

## 问题归类

### approval.vue

- 存在固定浅色背景 `#fff`
- 存在固定浅色边框 `#ebeef5`
- 存在固定浅色文本色 `#303133`、`#909399`

### detail.vue

- 顶部 hero 卡片使用浅色渐变背景，暗黑模式下会明显发白
- 多个统计块和操作块使用半透明白底，暗黑模式下层次不协调
- 多处告警块和标签块使用浅色透明底，需保证暗黑模式下仍保留语义色但不过亮

### cockpit.vue

- 没有明显硬编码纯白背景，但多个摘要卡和告警块依赖浅色渐变或浅色填充
- 需要校正暗黑模式下的层次和语义块对比度，避免发灰和漂浮感

## 设计原则

- 复用 Element Plus 主题变量，如 `var(--el-bg-color)`、`var(--el-fill-color-*)`、`var(--el-border-color-*)`、`var(--el-text-color-*)`
- 参考 `form.vue` 已采用的 `color-mix(...)` 写法，避免新增另一套主题分支
- 保留原有视觉语义，不改信息结构和业务表达
- 优先做最小必要修改，不抽公共样式，不额外重构页面结构

## 方案对比

### 方案一：统一变量化治理

- 将固定浅色背景、边框、文字色替换为主题变量
- 将浅色渐变和半透明白底改为基于主题底色的 `color-mix(...)` 或 Element Plus 填充色
- 对语义告警块保留红黄蓝绿语义，但降低暗黑模式下的白雾感

优点：与 `form.vue` 一致，后续维护简单。

缺点：样式改动面稍大。

### 方案二：只修硬编码浅色值

- 只处理 `#fff`、`#ebeef5`、`#303133`、`#909399` 这类明确问题

优点：改动小。

缺点：会残留暗黑模式下视觉层次不一致的问题。

### 方案三：增加 `.dark` 覆盖

- 保留现有浅色样式，单独在暗黑模式覆盖

优点：局部见效快。

缺点：与现有页面治理方向不一致，后续维护容易分叉。

## 选定方案

选择方案一：统一变量化治理。

原因：用户明确要求继续检查其他页面是否存在同类问题，并且 `form.vue` 已经形成可复用的主题变量治理方向。本次继续沿用相同策略，可以保证项目页面暗黑模式风格一致。

## 实施设计

### approval.vue

- 将 `.section-card` 背景改为 `var(--el-bg-color)`
- 将边框改为 `var(--el-border-color-lighter)`
- 将标题和描述文字分别改为 `var(--el-text-color-primary)`、`var(--el-text-color-secondary)`

### detail.vue

- 将 `.project-hero` 浅色渐变改为基于 `var(--el-bg-color)` 与 `var(--el-fill-color-extra-light)` 的混合渐变
- 将 `.hero-action-card`、`.hero-stat-card` 的半透明白底改为基于主题底色的 `color-mix(...)`
- 将计划区块、冲刺区块、健康度告警块、语义提示块中的浅色背景改为基于主题变量和语义色的混合背景

### cockpit.vue

- 将摘要卡的浅色语义渐变改为基于主题底色和语义色的 `color-mix(...)`
- 将告警块的背景和边框统一为暗黑兼容写法
- 保留现有卡片结构，仅修正视觉对比度和层次

## 验证设计

- 添加一个前端单测，直接检查这三个页面源码：
  - 不允许再出现固定浅色背景和文本色，如 `#fff`、`#ffffff`、`#ebeef5`、`#303133`、`#909399`
  - 要求目标页面继续使用 `var(--el-*)` 或 `color-mix(...)` 作为主题适配手段
- 运行 `npm run test:unit`
- 运行 `npm run type-check`
- 查看 git diff，确认改动仅限目标页面和新增测试文档

## 风险与边界

- 本次单测是源码守卫，不是视觉快照测试，主要用于防止回归到固定浅色值
- 不新增浏览器级暗黑截图测试，避免为这次样式治理引入过重基建
- 如果页面内部依赖第三方组件默认浅色外观，本次仅处理当前文件内可控样式
