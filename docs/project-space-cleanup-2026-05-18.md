# 项目空间治理清单

日期：2026-05-18

## 1. 当前问题概览

当前项目空间的主要问题不是单个功能实现，而是代码、分支、运行态数据和 worktree 同时失控：

- 同一分支混入多个主题提交
- 远端长期保留半成品分支，主线不清晰
- 本地存在大量历史 worktree，部分已 `prunable`
- 菜单这类运行态配置依赖数据库热修，未完全纳入代码管理
- worktree 验证容易生成临时产物，污染状态判断

## 2. 当前建议主线

建议把下面这条分支作为知识问答后续收敛主线：

- `feat/knowledge-qa-cleanup`

原因：

- 仅保留知识问答相关提交
- 已显式剥离 Docker 部署提交
- 分支范围清晰，可作为后续 PR 或继续整理的基线

当前知识问答收敛分支包含的提交：

- `0aafc4f` `feat: add knowledge qa frontend`
- `d33ae89` `fix: keep knowledge qa page within spec`
- `82b7595` `fix: read knowledge qa backend error message`
- `90058e8` `test: strengthen knowledge qa page coverage`
- `13e76fe` `feat: add knowledge qa backend`
- `84bf49e` `fix: align knowledge qa backend with spec`
- `44a4d65` `fix: finish knowledge qa backend spec alignment`
- `ebb63e4` `fix: trim knowledge qa preview api`
- `e48b1b5` `fix: harden knowledge qa backend review follow-ups`
- `f48c77d` `fix: wrap embedding rebuild persistence in transaction`
- `2e62d26` `test: fix knowledge qa spec type-check`
- `ee41024` `fix: restore backend knowledge qa type safety`

## 3. 分支治理建议

### 3.1 保留

这些分支仍有明确主题或可作为后续整理基线：

- `feat/knowledge-qa-cleanup`
- `feat/project-lifecycle-approval-phase1`
- `fix/workflow-management-hardening`
- `feature/frontend-workbench-design`
- `main`

### 3.2 归档

这些分支有历史价值，但不建议继续作为开发主线：

- `feat/scheduled-jobs-log-detail-drawer-inline`
- `feat/knowledge-qa-backend`
- `feat/knowledge-qa-frontend`
- `feat/project-lifecycle-approval-pr`
- `feat/scheduled-jobs-log-detail-drawer`
- `feat/scheduled-jobs-system-management-menu`
- `feat-homepage-polish-and-default-routing`
- `feature/login-province-map`
- `feat/isle-image-content`
- `fix-system-branding-files`
- `menu-permission-sync`
- `feature/role-permission-remediation`
- `feature-knowledge-view`
- `feature/document-editor-v2`
- `feature/isle-editor-knowledge`
- `feature/knowledge-editor-subapp`
- `feature/knowledge-code-blocks`

说明：

- `feat/scheduled-jobs-log-detail-drawer-inline` 已混入知识问答、类型修复、Docker 工作流等多个主题，不应继续承接新需求
- `feat/knowledge-qa-backend` 和 `feat/knowledge-qa-frontend` 已被 `feat/knowledge-qa-cleanup` 吸收

### 3.3 删除候选

下面这些不是“分支立即删除”，而是优先清理对象：

- 已被新收敛分支完全替代的 `feat/knowledge-qa-backend`
- 已被新收敛分支完全替代的 `feat/knowledge-qa-frontend`
- 所有 `prunable` worktree 对应的分支和目录

删除前提：

- 先确认远端是否还需要保留
- 先确认没有未合并提交需要迁移

## 4. 远端治理建议

当前远端分支非常少，反而说明“本地空间比远端更乱”：

- `origin/main`
- `origin/feat/project-lifecycle-approval-phase1`
- `origin/feat/scheduled-jobs-log-detail-drawer-inline`

建议后续远端只保留：

- `main`
- 当前活跃主题分支
- 已提交 PR 但尚未合并的分支

建议新增推送：

- `feat/knowledge-qa-cleanup`

建议后续下线：

- `origin/feat/scheduled-jobs-log-detail-drawer-inline`

前提：

- `feat/knowledge-qa-cleanup` 已完成最终验证并替代其职责

## 5. Worktree 治理建议

当前 worktree 数量过多，且包含多个外部目录和 `prunable` 项：

- 优先保留：当前主工作区、`feat/knowledge-qa-cleanup`、仍在开发中的 1 到 3 条活跃分支
- 优先清理：`git worktree list` 中所有标记为 `prunable` 的目录
- 不再保留“同一主题拆成 backend/frontend/cleanup 三条长期 worktree”的状态，完成收敛后应及时关闭旧 worktree

建议保留的 worktree：

- 主工作区 `/Users/yyk/work/Code/Project-V2.0`
- `/Users/yyk/work/Code/Project-V2.0/.worktrees/feat-knowledge-qa-cleanup`
- 当前确实还在继续开发的 1 到 2 条业务分支 worktree

## 6. 代码与运行态配置治理建议

当前最危险的不是代码本身，而是“代码改了，系统还不一定生效”：

- 路由在前端
- 权限在后端
- 菜单显示在数据库 `sys_menu`

后续必须执行：

- 所有菜单变更必须留代码记录
- 不再接受只改库不留痕的长期方案

建议最小落地方式：

- 为菜单增加统一 seed 或同步服务
- 至少把本次知识问答菜单补齐动作沉淀为 SQL 或代码 seed

## 7. 推荐执行顺序

1. 推送 `feat/knowledge-qa-cleanup`
2. 以该分支为知识问答唯一后续主线
3. 冻结 `feat/scheduled-jobs-log-detail-drawer-inline`
4. 清理 `prunable` worktree
5. 为知识问答菜单补代码化 seed / SQL
6. 再决定是否删除旧知识问答 backend/frontend 分支

## 8. 最低协作规则

后续建议强制遵守下面 4 条：

- 一个分支只做一个主题
- 未提交改动不得跨主题
- 菜单/权限/配置热修必须留脚本或 seed
- 设计文档批准后，代码只能按文档收敛，不沿脏分支继续堆功能
