# Superpowers 技能使用说明

## 文档目的

本文档说明当前项目内已安装的 `obra/superpowers` 技能如何使用、各技能的主要功能、推荐使用顺序，以及在本仓库中的典型用法。

适用范围：

- 当前项目 `Project-V2.0`
- 当前项目级技能目录 `.agents/skills/`
- 面向在本项目中使用 OpenCode/其他兼容代理执行开发任务的场景

## 当前安装状态

当前项目已安装以下 `obra/superpowers` 子技能：

- `using-superpowers`
- `brainstorming`
- `dispatching-parallel-agents`
- `executing-plans`
- `finishing-a-development-branch`
- `receiving-code-review`
- `requesting-code-review`
- `subagent-driven-development`
- `systematic-debugging`
- `test-driven-development`
- `using-git-worktrees`
- `verification-before-completion`
- `writing-plans`
- `writing-skills`

项目内还存在以下非 Superpowers 技能：

- `project-form-polish`
- `refactoring-ui`

安装位置：

```text
Project-V2.0/.agents/skills/
```

## 使用前提

这些技能本质上不是项目运行时插件，而是代理执行任务时使用的方法论和流程约束。

它们的使用特点如下：

- 不会给前后端项目增加 npm 命令
- 不会直接修改业务代码，除非代理在执行任务时按技能流程去改
- 主要作用是指导代理在什么时机、按什么步骤完成任务

### 当前会话注意事项

当前项目已经安装了这些技能，但是否能在“当前已打开的代理会话”中被立即识别，取决于宿主是否支持会话内热加载。

如果发现新装技能在当前会话中不能直接调用，处理方式如下：

1. 重新打开一个新的项目会话
2. 在新会话中直接提出任务
3. 明确说明希望使用的技能名称

## 总体使用方式

### 方式一：直接在需求里点名技能

直接在消息中带上技能名和任务内容。

示例：

```text
用 systematic-debugging 排查这个接口 500 的问题，不要直接猜原因。
```

```text
用 writing-plans 先拆解这个需求，再开始改代码：给项目列表新增批量导出。
```

```text
用 requesting-code-review 检查我这次改动的风险点和遗漏项。
```

### 方式二：按推荐流程组合使用

复杂任务一般不是单技能完成，而是按顺序组合使用。

常见组合：

1. 新功能开发：`brainstorming` -> `writing-plans` -> `test-driven-development` -> `verification-before-completion`
2. Bug 修复：`systematic-debugging` -> `test-driven-development` -> `verification-before-completion`
3. 大任务拆分：`writing-plans` -> `dispatching-parallel-agents` 或 `subagent-driven-development`
4. 提交前收尾：`requesting-code-review` -> `verification-before-completion` -> `finishing-a-development-branch`

## 各技能功能说明

### 1. using-superpowers

作用：

- 入口技能
- 用来建立“先检查是否应该使用技能，再开始做事”的规则
- 更像总控流程，不直接解决某个业务问题

适用时机：

- 新会话开始时
- 任何任务开始前

适合说法：

```text
先按 using-superpowers 的方式检查这次任务应该套用哪些技能，再开始处理。
```

### 2. brainstorming

作用：

- 在创意型、开放型、需求不清晰的任务开始前进行方案发散
- 帮助梳理目标、约束、候选方案和取舍

适用时机：

- 做新功能
- 做页面或交互设计
- 需求还不够明确
- 有多个实现路线需要比较

适合说法：

```text
用 brainstorming 先梳理这个审批页面改版需求的方案分支和取舍。
```

### 3. dispatching-parallel-agents

作用：

- 把多个互不依赖的子任务并行分发
- 提高搜索、分析、实现和验证效率

适用时机：

- 任务可以明显拆成 2 个以上相互独立的部分
- 同时处理多个模块
- 同时做多个独立检查

适合说法：

```text
这个任务可以拆成前端页面、接口适配、联调检查三部分，用 dispatching-parallel-agents 并行推进。
```

### 4. executing-plans

作用：

- 在已经有明确实施计划后，按阶段执行
- 强调按计划推进和检查，而不是边做边漂移

适用时机：

- 已经写好了计划
- 任务跨多个步骤
- 需要按检查点推进

适合说法：

```text
按现有实施计划使用 executing-plans 执行，并在每个阶段给出验证结果。
```

### 5. finishing-a-development-branch

作用：

- 在开发完成后，帮助决定如何收尾
- 包括整理状态、准备合并、发起 PR、清理分支等

适用时机：

- 改动已经完成
- 验证已通过
- 准备进入交付或合并阶段

适合说法：

```text
这次开发已经完成，用 finishing-a-development-branch 帮我整理下一步收尾动作。
```

### 6. receiving-code-review

作用：

- 用于处理收到的 code review 意见
- 重点是验证评论是否成立，而不是盲目照改

适用时机：

- 收到 reviewer 评论
- 评论本身不够清楚
- 怀疑评论可能不完全正确

适合说法：

```text
用 receiving-code-review 分析这几条 review 意见哪些必须改，哪些需要先验证。
```

### 7. requesting-code-review

作用：

- 在交付前先做自查式代码评审
- 帮助发现风险、遗漏、回归点和验证缺口

适用时机：

- 一个需求完成后
- 准备提交、合并或发起 PR 前

适合说法：

```text
用 requesting-code-review 对这次改动做一次严格检查，优先看回归风险和遗漏测试。
```

### 8. subagent-driven-development

作用：

- 在当前会话中用子代理配合推进独立实现块
- 适合中大型任务的拆分执行

适用时机：

- 已经有计划
- 任务可拆为多个相对独立的实现块
- 希望边拆边做，而不是完全串行

适合说法：

```text
这个需求已经拆清楚了，用 subagent-driven-development 并行推进独立模块实现。
```

### 9. systematic-debugging

作用：

- 遇到 bug、报错、测试失败或异常行为时，先按系统化方式定位根因
- 要求先复现、再缩小范围、再验证根因、最后修复

适用时机：

- 接口报错
- 页面异常
- 构建失败
- 测试失败
- 行为与预期不一致

适合说法：

```text
用 systematic-debugging 排查这个页面提交后数据没有刷新的问题，先确认根因，不要直接改。
```

### 10. test-driven-development

作用：

- 先写失败测试，再写实现，再让测试通过
- 用于功能开发和 bug 修复时约束实现质量

适用时机：

- 需求边界明确
- 存在可验证的输入输出
- 修复回归问题时需要锁定行为

适合说法：

```text
用 test-driven-development 修这个回归问题，先补测试，再改实现。
```

### 11. using-git-worktrees

作用：

- 使用 git worktree 隔离工作区
- 避免当前工作区已有改动和新任务互相污染

适用时机：

- 当前工作区很脏
- 需要同时做多个任务
- 新任务不适合在当前分支直接处理

适合说法：

```text
当前工作区还有别的改动，用 using-git-worktrees 为这个需求创建隔离工作区。
```

### 12. verification-before-completion

作用：

- 在声称“完成了”“修好了”“通过了”之前，必须先做验证
- 强调证据优先，避免口头完成

适用时机：

- 任何任务收尾前
- 任何需要给出完成结论前

适合说法：

```text
不要先给完成结论，用 verification-before-completion 先跑验证并贴出结果。
```

### 13. writing-plans

作用：

- 在正式改代码前编写实施计划
- 说明影响范围、文件范围、风险点、验证方式

适用时机：

- 多步骤任务
- 跨模块任务
- 复杂改动
- 前后端联动改动

适合说法：

```text
用 writing-plans 先拆解这个跨前后端需求，列出改动点、风险和验证步骤。
```

### 14. writing-skills

作用：

- 用于编写、修改和验证技能本身
- 面向技能开发，不是日常业务开发主流程

适用时机：

- 你想新增项目内技能
- 你要优化已有技能文档

适合说法：

```text
用 writing-skills 帮我给这个项目写一个新的内部技能。
```

## 推荐场景与组合

### 场景一：做新功能

推荐顺序：

1. `brainstorming`
2. `writing-plans`
3. `test-driven-development`
4. `verification-before-completion`

示例提示词：

```text
用 brainstorming 先梳理“项目列表新增批量导出”的方案，然后用 writing-plans 生成实施步骤，再按 test-driven-development 实现，最后用 verification-before-completion 验证。
```

### 场景二：修 Bug

推荐顺序：

1. `systematic-debugging`
2. `test-driven-development`
3. `verification-before-completion`

示例提示词：

```text
用 systematic-debugging 排查这个接口 500 错误，确认根因后用 test-driven-development 修复，并在完成前执行 verification-before-completion。
```

### 场景三：复杂需求先规划

推荐顺序：

1. `writing-plans`
2. `executing-plans`

示例提示词：

```text
先用 writing-plans 为“重构合同审批表单页”写计划，再使用 executing-plans 按计划逐步实施。
```

### 场景四：并行推进复杂任务

推荐顺序：

1. `writing-plans`
2. `dispatching-parallel-agents` 或 `subagent-driven-development`
3. `verification-before-completion`

示例提示词：

```text
这个任务可以拆成前端改造、接口适配和验证三部分，先用 writing-plans 拆解，再用 dispatching-parallel-agents 并行推进。
```

### 场景五：准备提交或合并

推荐顺序：

1. `requesting-code-review`
2. `verification-before-completion`
3. `finishing-a-development-branch`

示例提示词：

```text
先用 requesting-code-review 检查这次改动的风险，再用 verification-before-completion 完成验证，最后用 finishing-a-development-branch 整理收尾动作。
```

### 场景六：处理 Code Review 反馈

推荐顺序：

1. `receiving-code-review`
2. `verification-before-completion`

示例提示词：

```text
用 receiving-code-review 分析这些 review 意见是否成立，确认后再修改，并用 verification-before-completion 做回归验证。
```

## 结合本仓库的推荐用法

本仓库包含两个独立 npm 项目：

- `nest-admin`
- `nest-admin-frontend`

因此在本仓库中，Superpowers 技能最适合以下场景。

### 前端页面开发

推荐技能：

- `brainstorming`
- `writing-plans`
- `verification-before-completion`
- 视觉优化时可结合 `project-form-polish` 或 `refactoring-ui`

建议提示词：

```text
用 writing-plans 先拆解这个前端页面改造任务，保持现有设计体系，再实现并在完成前运行 nest-admin-frontend 的 type-check，用 verification-before-completion 汇总结论。
```

### 后端接口开发

推荐技能：

- `writing-plans`
- `test-driven-development`
- `verification-before-completion`

建议提示词：

```text
用 writing-plans 先分析这个后端接口需求涉及的 controller、service 和数据结构，再按 test-driven-development 实现，并在完成前运行 nest-admin 的 lint 和最小相关测试。
```

### 前后端联动改动

推荐技能：

- `writing-plans`
- `dispatching-parallel-agents` 或 `subagent-driven-development`
- `verification-before-completion`

建议提示词：

```text
用 writing-plans 拆解这个前后端联动改动，必要时并行处理后端接口和前端适配，最后按 verification-before-completion 运行前后端验证和根目录的 check:api-contract。
```

### 排查异常和回归问题

推荐技能：

- `systematic-debugging`
- `verification-before-completion`

建议提示词：

```text
用 systematic-debugging 排查这个页面回显异常问题，确认根因后修复，并在完成前用 verification-before-completion 验证页面行为和相关命令输出。
```

## 常用验证要求

结合本仓库现有约定，任务完成前建议按改动类型选择验证方式。

### 后端改动

优先验证：

```text
cd nest-admin
npm run lint
```

必要时补充最小相关测试。

### 前端改动

优先验证：

```text
cd nest-admin-frontend
npm run type-check
```

### API 契约改动

跨前后端变更后建议补充：

```text
npm run check:api-contract
```

## 最短可复制模板

### 模板 1：做功能

```text
用 writing-plans 先拆解任务，再实现，完成前使用 verification-before-completion 做验证。
```

### 模板 2：修 Bug

```text
用 systematic-debugging 先定位根因，不要直接猜，修复后做 verification-before-completion。
```

### 模板 3：前后端联动

```text
用 writing-plans 拆解这个前后端联动改动，必要时并行推进，最后完成前验证前后端和 API 契约。
```

### 模板 4：提交前检查

```text
先用 requesting-code-review 做自查，再用 verification-before-completion 运行验证后给结论。
```

### 模板 5：处理评审意见

```text
用 receiving-code-review 分析这些 review 评论是否成立，确认后再改。
```

## 常见问题

### 1. 已经安装了，为什么当前会话不能直接调用？

原因通常是当前会话没有重新加载项目技能目录。

处理方式：

1. 重新打开一个针对本项目的新会话
2. 再明确指定要使用的技能

### 2. 这些技能会自动运行吗？

不一定。

更稳妥的方式是：

- 在任务里主动写出希望使用的技能名
- 或明确要求“先按某技能流程处理，再开始实现”

### 3. 技能会不会替代项目约定？

不会。

本项目已有 `AGENTS.md`、项目边界、验证顺序和代码规范，这些仍然有效。技能主要是补充执行流程，不应覆盖项目本身的约束。

## 建议结论

如果你在本项目里只想记住最重要的 5 个技能，优先记这几个：

1. `systematic-debugging`
2. `writing-plans`
3. `verification-before-completion`
4. `requesting-code-review`
5. `test-driven-development`

对于本仓库的大多数开发任务，推荐最常用工作流如下：

1. 复杂任务先 `writing-plans`
2. Bug 先 `systematic-debugging`
3. 功能实现可用 `test-driven-development`
4. 收尾前必须 `verification-before-completion`
5. 准备提交前加一次 `requesting-code-review`
