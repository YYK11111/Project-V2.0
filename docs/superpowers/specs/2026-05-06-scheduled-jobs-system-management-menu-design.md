# Scheduled Jobs System Management Menu Design

## Goal

补齐“定时任务管理”在系统中的完整接入链路，使其可以稳定显示在“系统管理”导航下，并同时具备菜单管理可维护、角色授权可分配、前后端权限一致拦截、以及对新老环境都可自动补齐的能力。

## Current Context

- 前端页面已经存在：`nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue`
- 前端页面对应接口已经存在：
  - `GET system/scheduled-jobs/list`
  - `GET system/scheduled-jobs/logs`
  - `POST system/scheduled-jobs/run/:jobKey`
  - `POST system/scheduled-jobs/enable/:jobKey`
  - `POST system/scheduled-jobs/disable/:jobKey`
- 后端已有独立模块：`nest-admin/src/modules/systemScheduledJobs`
- 当前问题不是页面不存在，而是菜单、权限、角色授权链路没有完整接入
- 当前前端动态菜单由后端菜单数据驱动，页面文件所在目录不会决定它显示在哪个一级菜单下

## Confirmed Scope

- 菜单显示位置：挂到“系统管理”下，不挂到“系统监控”
- 页面文件处理：复用现有页面，不迁移页面文件
- 权限颗粒度：标准管理页
  - 页面访问
  - 查看日志
  - 手动执行
  - 启用
  - 停用
- 环境覆盖方式：同时支持新环境初始化和老环境启动后自动修复
- 角色授权策略：只创建菜单与权限，不自动授予任何角色

## Non-Goals

- 不改造定时任务页面的业务布局或交互结构
- 不新增独立的“系统管理版”页面副本
- 不自动为 `admin` 或其他角色分配新权限
- 不重构现有系统监控菜单体系

## Approaches Considered

### 方案 A：只补数据库初始化脚本

优点：实现直接。

缺点：只能覆盖新环境，对老环境缺失菜单、误删菜单、或历史环境不一致问题没有自动修复能力。

### 方案 B：只做启动时幂等补齐

优点：老环境可自动修复，误删后可恢复。

缺点：新环境初始化来源不够清晰，缺少显式的菜单基线定义。

### 方案 C：初始化基线 + 启动时幂等补齐

优点：同时覆盖新环境和已有环境，符合本次目标。

缺点：需要谨慎控制同步字段，避免覆盖人工维护的非关键展示信息。

### Recommendation

采用方案 C。

原因：这是唯一同时满足“新环境自动带出”和“老环境自动修复”的方案，同时仍然可以把影响面收敛在目标菜单自身，不波及其他菜单。

## Information Architecture

新增一组菜单资产，挂载关系如下：

- 系统管理（已有父菜单）
  - 定时任务管理（页面菜单）
    - 查看日志（按钮权限）
    - 立即执行（按钮权限）
    - 启用（按钮权限）
    - 停用（按钮权限）

## Menu Definition

### Page Menu

- 名称：`定时任务管理`
- 类型：`menu`
- 父级：`系统管理`
- 路由路径：由后端菜单数据定义到系统管理树下
- 组件路径：继续使用 `systemMonitor/scheduledJobs/index`
- 页面权限标识：`system/scheduledJobs/list`

这里刻意复用现有页面组件路径，而不是迁移到 `views/system` 或新建副本。这样可以保持最小改动，同时仍然通过父菜单关系把页面显示到“系统管理”下。

### Button Permissions

- 查看日志：`system/scheduledJobs/logs`
- 立即执行：`system/scheduledJobs/run`
- 启用：`system/scheduledJobs/enable`
- 停用：`system/scheduledJobs/disable`

## Backend Changes

### 1. 菜单基线定义

后端需要新增一份可复用的目标菜单定义，作为：

- 新环境初始化基线
- 启动时幂等补齐输入源

定义中至少包含以下结构性字段：

- `name`
- `type`
- `parent`
- `path`
- `component`
- `permissionKey`
- `order`
- `icon`
- `isHidden`
- `isActive`

该定义只描述“定时任务管理”这一组菜单，不扩展到无关菜单。

### 2. 启动时幂等补齐

后端启动后执行一次目标菜单同步，行为如下：

1. 定位“系统管理”父菜单
2. 按稳定标识检查“定时任务管理”页面菜单是否存在
3. 若不存在，则创建页面菜单
4. 若存在，则仅校正关键结构字段
5. 对四个按钮权限执行同样的幂等补齐
6. 不向任何角色写入菜单关联关系

### 3. 幂等匹配规则

优先按 `permissionKey` 做唯一定位，因为 `sys_menu.permissionKey` 已有唯一约束，且比名称更稳定。

匹配规则：

- 页面菜单：`system/scheduledJobs/list`
- 按钮权限：各自对应的权限标识

### 4. 字段同步边界

为避免误覆盖人工调整，仅同步本组菜单自身的结构性字段：

- `parentId`
- `name`
- `path`
- `component`
- `type`
- `permissionKey`
- `order`
- `icon`
- `isHidden`
- `isActive`

不批量修改无关菜单，也不写入角色授权数据。

### 5. 权限映射补齐

后端权限守卫补齐以下接口到权限标识的映射：

- `GET system/scheduled-jobs/list -> system/scheduledJobs/list`
- `GET system/scheduled-jobs/logs -> system/scheduledJobs/logs`
- `POST system/scheduled-jobs/run/:jobKey -> system/scheduledJobs/run`
- `POST system/scheduled-jobs/enable/:jobKey -> system/scheduledJobs/enable`
- `POST system/scheduled-jobs/disable/:jobKey -> system/scheduledJobs/disable`

这样即使前端按钮被绕过，接口仍然会被后端权限拦截。

## Frontend Changes

### 1. 页面复用

前端继续复用 `src/views/systemMonitor/scheduledJobs/index.vue`，不复制页面。

原因：

- 组件已存在且功能完整
- 左侧导航展示位置由后端菜单树决定，不由页面文件路径决定
- 这样改动最小，测试影响范围也最小

### 2. 页面级权限

页面访问依赖菜单权限 `system/scheduledJobs/list`。

当角色未分配该页面菜单时：

- 左侧导航不显示该项
- 动态路由中不会获得该页面
- 直接访问路径时会被现有权限体系拦截

### 3. 按钮级权限

页面内按钮增加显隐控制：

- `system/scheduledJobs/logs` 控制“运行日志”
- `system/scheduledJobs/run` 控制“立即执行”
- `system/scheduledJobs/enable` 控制“启用”
- `system/scheduledJobs/disable` 控制“停用”

无权限时按钮直接不显示，不提供弱提示占位。

## Data Flow

### 菜单与授权链路

1. 后端菜单补齐逻辑确保 `sys_menu` 中存在目标菜单和按钮权限
2. 菜单管理页可以查询并维护这组菜单
3. 角色授权页可以在授权树中看到这组节点
4. 角色勾选后，登录用户菜单与权限集自动包含对应权限标识
5. 前端根据动态菜单与 `checkPermi` 控制页面和按钮显隐

### 接口调用链路

1. 用户进入“定时任务管理”页面
2. 前端调用 `list` 与 `logs` 接口
3. 后端根据 `auth.guard.ts` 权限映射完成拦截
4. 用户点击“立即执行 / 启用 / 停用”时，前端先通过按钮权限控制显示
5. 请求到达后端时再次由守卫做最终校验

## Error Handling

### 父菜单不存在

如果启动时未找到“系统管理”父菜单，补齐逻辑应明确失败并输出错误日志，而不是把页面菜单创建成孤儿节点。

这样做的原因是：

- 本次设计已经明确要求挂到“系统管理”下
- 自动挂到错误父级会造成更难排查的权限与导航问题

### 重复权限标识

如果发现目标 `permissionKey` 已被其他无关菜单占用，应中止补齐并输出冲突信息，避免静默覆盖。

### 前端无按钮权限

前端按既有模式直接隐藏相关按钮，不新增额外错误状态分支。

## Testing Strategy

### Backend

- 为菜单补齐逻辑增加测试，覆盖：
  - 页面菜单不存在时创建
  - 页面菜单已存在时幂等更新
  - 按钮权限缺失时补齐
  - 不自动创建角色关联
- 为权限守卫映射增加测试，确保五个接口都映射到正确权限标识

### Frontend

- 为 `scheduledJobs` 页面增加按钮显隐测试，覆盖：
  - 仅有页面权限时只显示列表，不显示敏感按钮
  - 分别授予按钮权限时显示对应按钮
- 保留现有行为测试，确保点击后仍调用正确接口并刷新列表或日志

## Verification Expectations

完成实现后，至少应验证以下结果：

- 菜单管理中可看到“系统管理 / 定时任务管理”
- 角色授权树中可勾选该页面及四个按钮权限
- 未授权角色看不到该菜单
- 已授权页面但未授权按钮时，只能查看页面，不可执行敏感操作
- 后端直接访问受限接口时会被权限体系拒绝

## Risks

- 如果项目当前没有统一菜单初始化入口，启动期补齐逻辑的挂载位置需要谨慎选择，避免在应用未就绪前运行
- 如果历史环境中“系统管理”父菜单名称被人工改动，需要使用稳定标识而不是中文名称做定位；若当前系统缺少该稳定标识，则实现时需要先验证现有父菜单的可靠匹配方式
- 如果当前页面尚未显式使用 `checkPermi`，补按钮权限后需要补充测试，避免渲染桩与真实权限注入方式不一致

## Open Implementation Notes

- 实现前需要先确认项目中现有菜单初始化或系统启动扩展点，以便把幂等补齐挂到最小合适位置
- 如果现有路由命名映射对该页面有特殊要求，实现时应一并补齐对应映射，避免菜单可见但路由名称异常

## Success Criteria

- “定时任务管理”稳定显示在“系统管理”导航下
- 菜单管理、角色授权、前端按钮权限、后端接口权限全部贯通
- 新环境具备初始化基线，老环境可自动补齐缺失项
- 不自动赋权给任何角色
