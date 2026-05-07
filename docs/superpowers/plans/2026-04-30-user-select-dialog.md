# User Select Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `UserSelect` multi-select dropdown behavior with a dialog selector and show selected users inside the field.

**Architecture:** Keep `UserSelect` as the only public component so existing callers do not change. Single-select continues to use `el-select`; multi-select renders a custom field that opens an `el-dialog` with department filter, searchable user list, and selected-user panel. Selection changes are staged in a temporary array and emitted only on confirm.

**Tech Stack:** Vue 3 `<script setup>`, Element Plus, Vitest source-guard tests, existing user/dept APIs.

---

## File Structure

- Modify: `nest-admin-frontend/src/components/UserSelect.vue`
  - Add multi-select custom field and dialog.
  - Keep single-select behavior unchanged.
  - Remove field-below selected preview.
- Create: `nest-admin-frontend/src/components/UserSelect.spec.ts`
  - Source guard for multi-select dialog structure and no below-field preview.

---

### Task 1: Add Source Guard For Multi-Select Dialog

**Files:**
- Create: `nest-admin-frontend/src/components/UserSelect.spec.ts`

- [ ] **Step 1: Write failing test**

Create `nest-admin-frontend/src/components/UserSelect.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readUserSelectSource() {
  return readFileSync(resolve(__dirname, 'UserSelect.vue'), 'utf-8')
}

describe('UserSelect 多选弹窗结构守卫', () => {
  it('多选人员使用弹窗选择器并在字段内部展示结果', () => {
    const source = readUserSelectSource()

    expect(source).toContain('user-select-multiple-field')
    expect(source).toContain('<el-dialog')
    expect(source).toContain('已选人员')
    expect(source).toContain('confirmSelection')
    expect(source).toContain('selected-user-overflow')
    expect(source).not.toContain('selected-user-preview')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/components/UserSelect.spec.ts
```

Expected: FAIL because `UserSelect.spec.ts` is new and `UserSelect.vue` still contains `selected-user-preview` and no dialog structure.

- [ ] **Step 3: Commit test if following strict checkpoints**

Do not commit yet if implementation will follow immediately in the same working set.

---

### Task 2: Implement Multi-Select Dialog In UserSelect

**Files:**
- Modify: `nest-admin-frontend/src/components/UserSelect.vue`

- [ ] **Step 1: Replace state and helpers with staged multi-select support**

Update the `<script setup>` block to include these refs and helpers while preserving existing props and emits:

```js
const dialogVisible = ref(false)
const pendingValue = ref([])
const searchKeyword = ref('')
let searchTimer = 0

const selectedValues = computed(() => {
  if (!props.multiple) return props.modelValue ? [props.modelValue] : []
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

const pendingUsers = computed(() =>
  pendingValue.value.map((value) => ({ value, user: getSelectedUser(value) })).filter((item) => item.value),
)

const fieldUsers = computed(() =>
  selectedValues.value.map((value) => ({ value, user: getSelectedUser(value) })).filter((item) => item.value),
)

const visibleFieldUsers = computed(() => fieldUsers.value.slice(0, 3))
const hiddenFieldUserCount = computed(() => Math.max(fieldUsers.value.length - visibleFieldUsers.value.length, 0))

function isUserSelected(id) {
  return pendingValue.value.includes(id)
}

function openDialog() {
  if (props.disabled) return
  pendingValue.value = [...selectedValues.value]
  dialogVisible.value = true
  loadUserList(searchKeyword.value)
}

function closeDialog() {
  dialogVisible.value = false
  pendingValue.value = [...selectedValues.value]
}

function togglePendingUser(user) {
  if (!user?.id) return
  updateSelectedUserMap([user])
  if (pendingValue.value.includes(user.id)) {
    pendingValue.value = pendingValue.value.filter((id) => id !== user.id)
    return
  }
  pendingValue.value = [...pendingValue.value, user.id]
}

function removePendingUser(id) {
  pendingValue.value = pendingValue.value.filter((value) => value !== id)
}

function clearPendingUsers() {
  pendingValue.value = []
}

function clearSelectedUsers(event) {
  event?.stopPropagation?.()
  if (props.disabled) return
  emit('update:modelValue', [])
  emit('change', [])
}

function confirmSelection() {
  const nextValue = [...pendingValue.value]
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
  dialogVisible.value = false
}
```

- [ ] **Step 2: Add search debounce**

Replace `handleSearch(query)` with:

```js
function handleSearch(query) {
  searchKeyword.value = query || ''
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    loadUserList(searchKeyword.value)
  }, 250)
}
```

- [ ] **Step 3: Adjust model watcher**

Replace the current `watch(() => props.modelValue, ...)` with:

```js
watch(
  () => props.modelValue,
  () => {
    if (props.multiple) {
      pendingValue.value = [...selectedValues.value]
      return
    }
    nextTick(() => {
      loadUserList()
    })
  },
)
```

- [ ] **Step 4: Replace template multi-select branch**

Use a conditional template:

```vue
<template>
  <template v-if="!multiple">
    <el-select
      class="user-select"
      :model-value="modelValue"
      :disabled="disabled"
      :clearable="clearable"
      :placeholder="placeholder"
      :filterable="true"
      :remote="true"
      :reserve-keyword="false"
      :loading="loading"
      :remote-method="handleSearch"
      @change="handleChange"
      @clear="handleClear"
      @visible-change="handleVisibleChange"
      style="width: 100%"
    >
      <template #label>
        <div v-if="fieldUsers[0]?.user" class="user-selected-label">
          <el-avatar :size="20" :src="fieldUsers[0].user.avatar || undefined">
            {{ getAvatarText(fieldUsers[0].user) }}
          </el-avatar>
          <span class="user-selected-text">{{ getDisplayName(fieldUsers[0].user) }}</span>
        </div>
      </template>
      <el-option v-for="user in userList" :key="user.id" :label="getDisplayName(user)" :value="user.id">
        <div class="user-option">
          <el-avatar :size="24" :src="user.avatar || undefined">{{ getAvatarText(user) }}</el-avatar>
          <div class="user-main">
            <div class="user-name">{{ getDisplayName(user) }}</div>
            <div v-if="getSubLabel(user)" class="user-sub">{{ getSubLabel(user) }}</div>
          </div>
        </div>
      </el-option>
      <template #empty><div class="empty-text">暂无数据</div></template>
    </el-select>
  </template>

  <template v-else>
    <div class="user-select-multiple-field" :class="{ 'is-disabled': disabled }" @click="openDialog">
      <div v-if="fieldUsers.length" class="user-select-multiple-field__tags">
        <div v-for="item in visibleFieldUsers" :key="item.value" class="user-select-chip">
          <el-avatar :size="18" :src="item.user?.avatar || undefined">{{ getAvatarText(item.user) }}</el-avatar>
          <span>{{ getDisplayName(item.user) }}</span>
        </div>
        <span v-if="hiddenFieldUserCount" class="selected-user-overflow">+{{ hiddenFieldUserCount }}</span>
      </div>
      <span v-else class="user-select-multiple-field__placeholder">{{ placeholder }}</span>
      <button v-if="clearable && fieldUsers.length && !disabled" class="user-select-multiple-field__clear" type="button" @click="clearSelectedUsers">×</button>
      <span class="user-select-multiple-field__suffix">选择</span>
    </div>

    <el-dialog v-model="dialogVisible" title="选择人员" width="820px" append-to-body @close="closeDialog">
      <div class="user-select-dialog">
        <aside class="user-select-dialog__dept">
          <div class="user-select-dialog__title">部门</div>
          <el-select v-if="filterDept" v-model="searchDept" placeholder="筛选部门" clearable filterable size="small" @change="handleDeptChange">
            <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
          <div v-else class="user-select-dialog__hint">当前显示全部人员</div>
        </aside>
        <section class="user-select-dialog__users">
          <el-input v-model="searchKeyword" placeholder="搜索姓名 / 账号" clearable @input="handleSearch" />
          <div v-loading="loading" class="user-select-dialog__list">
            <button v-for="user in userList" :key="user.id" type="button" class="user-select-dialog__user" :class="{ 'is-selected': isUserSelected(user.id) }" @click="togglePendingUser(user)">
              <el-avatar :size="28" :src="user.avatar || undefined">{{ getAvatarText(user) }}</el-avatar>
              <span class="user-select-dialog__user-main">
                <span class="user-name">{{ getDisplayName(user) }}</span>
                <span v-if="getSubLabel(user)" class="user-sub">{{ getSubLabel(user) }}</span>
              </span>
              <span v-if="isUserSelected(user.id)" class="user-select-dialog__check">已选</span>
            </button>
            <div v-if="!loading && !userList.length" class="empty-text">暂无数据</div>
          </div>
        </section>
        <aside class="user-select-dialog__selected">
          <div class="user-select-dialog__selected-head">
            <span>已选人员 {{ pendingUsers.length }}</span>
            <el-button v-if="pendingUsers.length" link type="primary" @click="clearPendingUsers">清空</el-button>
          </div>
          <div class="user-select-dialog__selected-list">
            <div v-for="item in pendingUsers" :key="item.value" class="user-select-dialog__selected-item">
              <el-avatar :size="24" :src="item.user?.avatar || undefined">{{ getAvatarText(item.user) }}</el-avatar>
              <span>{{ getDisplayName(item.user) }}</span>
              <button type="button" @click="removePendingUser(item.value)">×</button>
            </div>
            <div v-if="!pendingUsers.length" class="empty-text">暂未选择人员</div>
          </div>
        </aside>
      </div>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="confirmSelection">确认</el-button>
      </template>
    </el-dialog>
  </template>
</template>
```

- [ ] **Step 5: Replace styles**

Remove `.selected-user-preview*` styles and add styles for:

```css
.user-select-multiple-field { display: flex; align-items: center; min-height: 32px; width: 100%; padding: 4px 8px; border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base); background: var(--el-fill-color-blank); cursor: pointer; }
.user-select-multiple-field.is-disabled { cursor: not-allowed; background: var(--el-disabled-bg-color); color: var(--el-disabled-text-color); }
.user-select-multiple-field__tags { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; overflow: hidden; }
.user-select-chip { display: inline-flex; align-items: center; gap: 5px; max-width: 120px; padding: 2px 7px; border-radius: 999px; background: var(--el-fill-color-light); border: 1px solid var(--el-border-color-lighter); font-size: 12px; }
.user-select-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selected-user-overflow { flex: none; font-size: 12px; color: var(--el-text-color-secondary); }
.user-select-multiple-field__placeholder { flex: 1; color: var(--el-text-color-placeholder); }
.user-select-multiple-field__clear { border: 0; background: transparent; color: var(--el-text-color-secondary); cursor: pointer; }
.user-select-multiple-field__suffix { flex: none; margin-left: 8px; color: var(--el-text-color-secondary); font-size: 12px; }
.user-select-dialog { display: grid; grid-template-columns: 180px minmax(0, 1fr) 220px; min-height: 420px; border: 1px solid var(--el-border-color-lighter); border-radius: 12px; overflow: hidden; }
.user-select-dialog__dept, .user-select-dialog__selected { padding: 12px; background: var(--el-fill-color-extra-light); }
.user-select-dialog__users { padding: 12px; border-left: 1px solid var(--el-border-color-lighter); border-right: 1px solid var(--el-border-color-lighter); }
.user-select-dialog__title, .user-select-dialog__selected-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-weight: 600; }
.user-select-dialog__hint { color: var(--el-text-color-secondary); font-size: 12px; }
.user-select-dialog__list { display: flex; flex-direction: column; gap: 8px; max-height: 360px; margin-top: 12px; overflow: auto; }
.user-select-dialog__user { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-bg-color); text-align: left; cursor: pointer; }
.user-select-dialog__user.is-selected { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
.user-select-dialog__user-main { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.user-select-dialog__check { flex: none; color: var(--el-color-primary); font-size: 12px; }
.user-select-dialog__selected-list { display: flex; flex-direction: column; gap: 8px; max-height: 370px; overflow: auto; }
.user-select-dialog__selected-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 10px; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); }
.user-select-dialog__selected-item span { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-select-dialog__selected-item button { border: 0; background: transparent; color: var(--el-text-color-secondary); cursor: pointer; }
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
npx vitest run src/components/UserSelect.spec.ts
```

Expected: PASS.

---

### Task 3: Verification

**Files:**
- `nest-admin-frontend/src/components/UserSelect.vue`
- `nest-admin-frontend/src/components/UserSelect.spec.ts`

- [ ] **Step 1: Run targeted test**

Run:

```bash
npx vitest run src/components/UserSelect.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run frontend type check**

Run:

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Check git diff**

Run:

```bash
git diff -- nest-admin-frontend/src/components/UserSelect.vue nest-admin-frontend/src/components/UserSelect.spec.ts
```

Expected: Diff only contains UserSelect multi-select dialog implementation and its test.

---

## Self-Review

Spec coverage:

- Dialog multi-select selector: Task 2 template and styles.
- Field-internal selected users: Task 2 field branch and `selected-user-overflow`.
- Remove below-field preview: Task 1 guard and Task 2 style/template removal.
- Existing API compatibility: Task 2 preserves props and events.
- Confirm/cancel staged selection: Task 2 `pendingValue`, `confirmSelection`, `closeDialog`.

Placeholder scan:

- No placeholders or undefined steps remain.

Type consistency:

- `confirmSelection`, `selected-user-overflow`, `user-select-multiple-field`, and `selected-user-preview` names are consistent across test and implementation steps.
