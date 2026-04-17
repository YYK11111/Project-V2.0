<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

export interface OperationButton {
  key: string
  label: string
  type?: string
  disabled?: boolean
  show?: boolean
  danger?: boolean
  onClick?: (row: any) => void
}

function shouldRenderButton(button: OperationButton | null | undefined) {
  if (!button) return false
  if (button.show === false) return false
  if (button.disabled) return false
  return true
}

const props = withDefaults(defineProps<{
  buttons: Array<OperationButton | null | undefined>
  row?: any
  rctRef?: any
  maxVisible?: number
}>(), {
  maxVisible: 3,
})

const normalizedButtons = computed(() => props.buttons.filter(shouldRenderButton) as OperationButton[])

const visibleButtons = computed(() => {
  return normalizedButtons.value.slice(0, props.maxVisible)
})

const overflowButtons = computed(() => {
  return normalizedButtons.value.slice(props.maxVisible)
})

const handleClick = (btn: OperationButton) => {
  btn.onClick?.(props.row)
}
</script>

<template>
  <div class="table-operation">
    <el-button
      v-for="btn in visibleButtons"
      :key="btn.key"
      :type="btn.type as any"
      :disabled="btn.disabled"
      :danger="btn.danger"
      text
      size="small"
      class="op-btn"
      @click="handleClick(btn)"
    >
      {{ btn.label }}
    </el-button>

    <el-dropdown v-if="overflowButtons.length" trigger="click">
      <el-button text size="small" class="op-btn">
        更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="btn in overflowButtons"
            :key="btn.key"
            :disabled="btn.disabled"
            class="op-dropdown-item"
            :class="{ 'is-danger': btn.danger }"
            @click="handleClick(btn)"
          >
            {{ btn.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.table-operation {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

/* 按钮 hover 主题色 */
.op-btn {
  transition: color 0.15s;
}

.el-button.op-btn:not(.is-disabled):hover {
  color: var(--el-color-primary) !important;
}

/* 危险按钮 hover 红色 */
:deep(.el-button.op-btn.is-danger:not(.is-disabled):hover),
:deep(.el-button.op-btn.danger:not(.is-disabled):hover) {
  color: var(--el-color-danger) !important;
}

/* 下拉菜单项 hover 效果 */
:deep(.op-dropdown-item:not(.is-disabled):hover) {
  color: var(--el-color-primary);
  background-color: var(--el-fill-color-light);
}

/* 下拉危险项 hover 红色 */
:deep(.op-dropdown-item.is-danger:not(.is-disabled):hover) {
  color: var(--el-color-danger) !important;
  background-color: var(--el-color-danger-light-9);
}
</style>
