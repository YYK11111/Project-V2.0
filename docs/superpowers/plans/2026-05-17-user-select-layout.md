# 人员选择器布局实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `UserSelect` 改造成“顶部搜索 + 左侧部门树 + 中部 4 列人员卡片 + 底部已选区”的选择器。

**Architecture:** 保持现有弹窗式选择器，不新增页面级组件。把筛选条件收敛成 `deptTree / selectedDeptId / includeChildren / searchKeyword / pendingValue`，候选人员统一按部门树和关键词计算，已选区独立放在弹窗底部。实现时优先保持现有字段回显与确认逻辑不变，只替换中间的选择工作台布局。

**Tech Stack:** Vue 3 `<script setup>`, Element Plus, Vitest, scoped SCSS.

---

### Task 1: 重构 `UserSelect.vue` 布局和状态

**Files:**
- Modify: `nest-admin-frontend/src/components/UserSelect.vue`

- [ ] **Step 1: 先把状态收拢到部门树 + 候选池模型**

把现有 `searchDept`、`userList`、`pendingUsers` 的逻辑改成明确的筛选链：

```ts
const deptTree = ref([])
const selectedDeptId = ref(null)
const includeChildren = ref(true)
const searchKeyword = ref('')
const userList = ref([])
const filteredUserList = computed(() => {
  return userList.value.filter((user) => {
    const deptHit = !selectedDeptId.value || matchesDept(user, selectedDeptId.value, includeChildren.value)
    const keyword = searchKeyword.value.trim().toLowerCase()
    const keywordHit = !keyword || [user.name, user.nickname, user.account, user.employeeNo].some((value) =>
      String(value || '').toLowerCase().includes(keyword),
    )
    return deptHit && keywordHit
  })
})
```

保留 `pendingValue` / `selectedValues` / `fieldUsers` 逻辑，不改确认和回填语义。

- [ ] **Step 2: 把弹窗主结构改成三段式**

把现有三栏布局改成：

```vue
<div class="user-select-dialog">
  <div class="user-select-dialog__toolbar">...</div>
  <div class="user-select-dialog__body">
    <aside class="user-select-dialog__dept">...</aside>
    <section class="user-select-dialog__users">...</section>
  </div>
  <aside class="user-select-dialog__selected">...</aside>
</div>
```

其中：

- 头部工具栏只放搜索框和“包含下级”开关
- 中部左侧放部门树
- 中部右侧放 4 列人员卡片网格
- 底部放已选区域

- [ ] **Step 3: 把部门选择改成树**

用 `el-tree` 替换 `el-select`，节点点击只更新 `selectedDeptId`。

```vue
<el-tree
  :data="deptTree"
  node-key="id"
  :props="{ label: 'name', children: 'children' }"
  highlight-current
  default-expand-all
  @node-click="handleDeptNodeClick"
/>
```

`handleDeptNodeClick(node)` 只做：

```ts
selectedDeptId.value = node?.id || null
```

不做默认选人，不清空已选区。

- [ ] **Step 4: 把人员列表改成 4 列卡片**

改写人员列表模板为网格卡片，固定 4 列：

```vue
<div class="user-select-dialog__list">
  <button
    v-for="user in filteredUserList"
    :key="user.id"
    type="button"
    class="user-select-dialog__user"
    :class="{ 'is-selected': isUserSelected(user.id) }"
    @click="selectPendingUser(user)"
  >
    <el-avatar :size="28" :src="user.avatar || undefined">
      {{ getAvatarText(user) }}
    </el-avatar>
    <span class="user-select-dialog__user-main">
      <span class="user-name">{{ getDisplayName(user) }}</span>
      <span v-if="getSubLabel(user)" class="user-sub">{{ getSubLabel(user) }}</span>
    </span>
  </button>
</div>
```

配套样式要求：

```css
.user-select-dialog__list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  max-height: none;
}

.user-select-dialog__user {
  min-height: 60px;
  margin-left: 0;
  padding: 8px 10px;
}
```

- [ ] **Step 5: 把已选区挪到底部**

把原来的右侧已选栏移动到弹窗底部，并保留清空和单项删除：

```vue
<aside class="user-select-dialog__selected">
  <div class="user-select-dialog__selected-head">
    <span>已选人员 {{ pendingUsers.length }}</span>
    <el-button v-if="pendingUsers.length" link type="primary" @click="clearPendingUsers">清空</el-button>
  </div>
  <div class="user-select-dialog__selected-list">...</div>
</aside>
```

底部区域必须保持独立滚动或自动换行，不占中部候选人员宽度。

- [ ] **Step 6: 用中文注释保留关键边界**

在部门树过滤、4 列布局、底部已选区这三个关键位置补中文注释，说明：

```ts
// 点击部门只过滤候选池，不自动选择人员
// 默认穿透下级部门
// 已选区独立放底部，不参与候选过滤
```

### Task 2: 更新 `UserSelect` 测试守卫

**Files:**
- Modify: `nest-admin-frontend/src/components/UserSelect.spec.ts`

- [ ] **Step 1: 更新结构断言**

把原来针对 `el-select` 的断言改成部门树和底部已选区断言：

```ts
expect(source).toContain('el-tree')
expect(source).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
expect(source).toContain('user-select-dialog__selected')
expect(source).toContain('selectedDeptId')
expect(source).toContain('includeChildren')
```

- [ ] **Step 2: 更新交互测试**

保留“打开弹窗后可选择并确认回填”的测试，补一个树节点点击过滤的行为测试：

```ts
it('点击部门节点后只更新过滤条件不清空已选', async () => {
  // 先选中一个用户
  // 再切换部门
  // 断言 pendingValue 仍然保留
})
```

- [ ] **Step 3: 保留 includeAll 全量请求守卫**

继续断言 `getUserOptions` 带 `includeAll: '1'`，防止人员选择器又退回数据权限过滤。

### Task 3: 运行验证

**Files:**
- 无新增文件

- [ ] **Step 1: 前端类型检查**

Run:

```bash
cd nest-admin-frontend && npm run type-check
```

Expected:

- 通过，无类型错误

- [ ] **Step 2: 单测**

Run:

```bash
cd nest-admin-frontend && npm run test:unit -- src/components/UserSelect.spec.ts
```

Expected:

- 通过，断言覆盖新布局和关键交互

- [ ] **Step 3: 回看改动**

Run:

```bash
git diff -- nest-admin-frontend/src/components/UserSelect.vue nest-admin-frontend/src/components/UserSelect.spec.ts
```

Expected:

- 只包含 `UserSelect` 相关改动，没有波及业务页或后端文件

