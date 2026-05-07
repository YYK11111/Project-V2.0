# Scheduled Jobs Log Detail Drawer Design

## Goal

补齐“定时任务管理”中的运行日志详情查看能力，让用户不只看到执行结果摘要，还能按需查看完整的执行统计、错误信息、执行上下文与触发人信息。

## Current Context

- 前端页面 `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue` 已有“运行日志”表格。
- 当前日志表格只展示：
  - 任务名称
  - 触发方式
  - 执行状态
  - 开始/结束时间
  - 耗时
  - 结果摘要
- 后端日志实体 `nest-admin/src/modules/systemScheduledJobs/log.entity.ts` 实际已经存有更多字段：
  - `processedCount`
  - `successCount`
  - `failedCount`
  - `errorMessage`
  - `errorStack`
  - `payload`
  - `operatorId`
  - `operatorName`
- 当前前端日志列表接口只做列表展示，没有单条详情查看入口。

## Confirmed Scope

- 使用抽屉展示日志详情，不使用弹窗或行内展开。
- 详情内容全部展示：
  - 执行统计
  - 错误信息
  - 执行上下文 `payload`
  - 触发人/操作人信息
- 详情数据来源走单独接口，打开抽屉时按需加载。
- 权限复用现有 `system/scheduledJobs/logs`，不新增独立详情权限点。

## Non-Goals

- 不改造定时任务主列表结构。
- 不把所有长字段直接塞进运行日志表格。
- 不新增日志编辑、导出、删除能力。
- 不新增第二套“日志详情页面”。

## Approaches Considered

### 方案 A：只在日志表格增加更多列

优点：改动最小。

缺点：`payload`、`errorStack` 这类长文本不适合表格展示，页面会非常拥挤。

### 方案 B：日志表格 + 详情抽屉 + 单独详情接口

优点：

- 列表继续轻量
- 详情信息完整
- 长文本展示体验更好
- 便于后续扩展更多日志字段

缺点：需要补一条接口和一组前端详情状态。

### 方案 C：日志表格 + 行内展开详情 + 单独详情接口

优点：操作路径短。

缺点：长文本在表格上下文里阅读体验较差，移动端尤其不理想。

### Recommendation

采用方案 B。

原因：这是最适合长文本和完整上下文信息的展示方式，同时不会破坏现有列表的紧凑度。

## Backend Changes

### 1. 新增日志详情接口

新增接口：

- `GET /system/scheduled-jobs/logs/:id`

职责：

- 按日志 `id` 返回单条完整执行日志详情
- 字段包含日志实体中现有的完整内容，不再额外裁剪

### 2. 服务层新增单条查询

在 `SystemScheduledJobsService` 中新增按 `id` 查询日志详情的方法：

- 输入：日志 `id`
- 输出：`SystemScheduledJobExecutionLog`
- 若不存在：抛出 `NotFoundException`

### 3. 权限策略

日志详情接口复用现有权限：

- `system/scheduledJobs/logs`

不新增 `system/scheduledJobs/logs/detail` 之类的新权限点。

原因：

- 当前“查看日志”本身已经是日志查看权限
- 详情只是同一权限下的更完整展示，不是新的业务动作
- 避免权限点膨胀

## Frontend Changes

### 1. 日志表格新增“详情”入口

在“运行日志”表格新增操作列：

- `详情`

点击后：

1. 打开抽屉
2. 显示加载状态
3. 调用单条日志详情接口
4. 成功后渲染完整详情

### 2. 新增详情抽屉

使用 `el-drawer` 展示日志详情。

建议交互：

- 桌面端宽度：`720px`
- 小屏：`100%`
- 支持关闭
- 在详情加载期间展示局部 loading

### 3. 详情信息分区

抽屉内容拆为 4 个区块：

#### 基本信息

- 任务名称
- 任务编码
- 任务类型
- 所属模块
- 触发方式
- 执行状态
- 开始时间
- 结束时间
- 耗时
- 操作人 ID
- 操作人名称

#### 执行统计

- 处理数量
- 成功数量
- 失败数量
- 结果摘要

#### 错误信息

- 错误摘要 `errorMessage`
- 错误堆栈 `errorStack`

#### 执行上下文

- `payload`

### 4. 长文本展示方式

`payload` 和 `errorStack` 使用只读预格式文本展示：

- 保留换行
- 保留缩进
- 不可编辑
- 空值显示 `--`

`payload` 若为对象，前端按格式化 JSON 展示。

### 5. 失败处理

若详情接口失败：

- 抽屉保持打开
- 显示错误提示
- 不影响定时任务主列表
- 不影响运行日志主列表
- 不清空页面其他已有数据状态

## Data Flow

### 日志详情查看链路

1. 用户进入“定时任务管理”页面
2. 页面加载日志列表
3. 用户点击某条日志的 `详情`
4. 前端打开抽屉并请求 `GET /system/scheduled-jobs/logs/:id`
5. 后端按 `id` 返回完整日志详情
6. 前端按四个区块渲染详情内容

### 权限链路

1. 前端只有在 `system/scheduledJobs/logs` 权限存在时才展示日志区域
2. 同一权限下展示 `详情` 入口
3. 后端详情接口也复用 `system/scheduledJobs/logs` 做最终拦截

## Error Handling

### 日志不存在

若指定日志 `id` 不存在：

- 后端返回 `NotFoundException`
- 前端抽屉保留打开状态
- 页面显示“日志详情不存在”或后端返回的错误信息

### 长文本为空

若 `payload`、`errorStack`、`errorMessage` 为空：

- 前端显示 `--`
- 不展示空白大块区域

### payload 非对象

若 `payload` 不是对象但有值：

- 按字符串形式展示
- 不强制 JSON 解析

## Testing Strategy

### Backend

- 为服务层新增详情查询测试：
  - 按 `id` 可返回日志详情
  - 不存在时抛 `NotFoundException`
- 为权限映射补测试：
  - `GET system/scheduled-jobs/logs/:id -> system/scheduledJobs/logs`

### Frontend

- API 层新增详情接口解包测试
- 页面行为测试覆盖：
  - 点击 `详情` 打开抽屉并请求接口
  - 成功时展示执行统计、错误信息、`payload`
  - 失败时显示错误提示
- 保持现有日志列表与主页面行为测试继续通过

## Verification Expectations

完成实现后，至少应验证以下结果：

- 运行日志表格中出现 `详情` 按钮
- 点击 `详情` 后可打开抽屉
- 抽屉能展示：
  - 执行统计
  - 错误信息
  - `payload`
  - 操作人信息
- 无日志权限时，日志区域与详情入口都不可见
- 详情接口失败时，不影响主页面已有数据展示

## Risks

- 若日志表记录的 `payload` 很大，抽屉中展示时需要注意性能和滚动体验
- 若错误堆栈过长，需确保样式允许滚动而不是撑坏布局
- 若后续日志实体字段扩展，前端详情分区需要保持和实体字段同步

## Success Criteria

- 用户不再只能看到“结果摘要”，而能查看完整日志详情
- 详情采用抽屉按需加载，不影响现有日志列表紧凑度
- 权限仍保持简单，复用现有 `system/scheduledJobs/logs`
