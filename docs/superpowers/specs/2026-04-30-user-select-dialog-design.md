# User Select Dialog Design

## Goal

优化 `UserSelect` 人员选择器，重点改善多选人员场景。多选时使用弹窗选择器，已选人员在字段内部展示，不再在字段下方额外显示头像和名称。

## Current Context

- 组件位置：`nest-admin-frontend/src/components/UserSelect.vue`。
- 现有能力：单选、多选、远程搜索、部门筛选、头像和姓名展示。
- 多选使用场景包括任务经办人、知识分类管理员、默认可见人员、知识可见用户。
- 当前多选会在字段下方渲染 `.selected-user-preview`，造成高密度表单变长、字段对齐不稳定。

## Chosen Approach

采用弹窗式多选人员选择器：

- 单选保持现有下拉体验，降低对已有业务页影响。
- 多选字段变成自定义选择入口，点击后打开 `el-dialog`。
- 多选结果只在字段内部以 chip 形式展示。
- 弹窗内采用三栏布局：左侧部门，中间人员，右侧已选。

## Multi-Select Field Display

字段内部显示规则：

- 未选择：显示 `placeholder`。
- 已选择 1-3 人：显示头像/姓名 chip。
- 超过 3 人：显示前 3 个 chip 和 `+N` 溢出计数。
- 支持 `clearable` 时，在字段内显示清空入口。
- `disabled` 时字段不可点击、不可清空。
- 不再渲染字段下方的 `.selected-user-preview`。

## Dialog Layout

弹窗标题沿用调用方语义，默认可用 `选择人员`。

弹窗区域：

- 左侧部门栏：展示部门列表或树，支持 `filterDept` 场景下按部门筛选人员。
- 中间人员栏：提供姓名/账号搜索，展示人员头像、姓名、账号、部门，已选人员有选中态。
- 右侧已选栏：展示已选人员列表，支持单个移除和清空。
- 底部操作：`取消` 和 `确认`。

## Data Flow

- 多选弹窗打开时，把当前 `modelValue` 复制到临时选择数组。
- 弹窗内勾选、移除、清空只修改临时选择数组。
- 点击 `确认` 后才触发 `update:modelValue` 和 `change`。
- 点击 `取消` 或关闭弹窗不改变外部表单值。
- 已加载过的用户写入 `selectedUserMap`，用于字段内部回显和远程搜索后的稳定展示。

## Compatibility

保持现有调用方式不变：

```vue
<UserSelect v-model="form.leaderId" placeholder="请选择负责人" clearable />
<UserSelect v-model="form.executorIds" placeholder="请选择经办人" clearable multiple />
```

保留现有 props：

- `modelValue`
- `multiple`
- `disabled`
- `clearable`
- `placeholder`
- `filterDept`

保留事件：

- `update:modelValue`
- `change`

## Error And Empty States

- 人员列表加载中显示 loading。
- 搜索无结果显示空状态。
- 部门加载失败不阻断人员选择，部门区域显示空状态。
- 已选用户信息暂未加载时，字段 chip 使用用户 ID 兜底显示，后续列表加载后自动补全姓名。

## Testing

新增或更新 `UserSelect` 源码守卫测试，覆盖：

- 多选模式包含 `el-dialog`。
- 多选模式包含 `已选人员` 区域。
- 多选确认函数存在，例如 `confirmSelection`。
- 字段内部包含溢出计数样式或标识，例如 `selected-user-overflow`。
- 不再包含 `.selected-user-preview`。

验证命令：

- `npx vitest run <UserSelect 相关 spec>`
- `npm run type-check`

## Out Of Scope

- 不重做所有业务表单布局。
- 不改变后端用户接口。
- 不引入分页虚拟列表，除非后续发现 100 条人员限制不足。
- 不把单选改成弹窗。
