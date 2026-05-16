<script setup>
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  canAddTask: {
    type: Boolean,
    default: false,
  },
  canAddRisk: {
    type: Boolean,
    default: false,
  },
  canAddChange: {
    type: Boolean,
    default: false,
  },
  canAddTicket: {
    type: Boolean,
    default: false,
  },
  canAddSprint: {
    type: Boolean,
    default: false,
  },
  canAddKnowledge: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['createRecord', 'createKnowledge'])

const primaryActions = computed(() => [
  { label: '新增任务', path: '/taskManage/form', visible: props.canAddTask },
  { label: '新增风险', path: '/projectManage/riskManage/form', visible: props.canAddRisk },
  { label: '新增变更', path: '/changeManage/form', visible: props.canAddChange },
].filter((item) => item.visible))

const secondaryActions = computed(() => [
  { label: '新增工单', command: 'ticket', path: '/ticketManage/form', visible: props.canAddTicket },
  { label: '新增 Sprint', command: 'sprint', path: '/sprintManage/form', visible: props.canAddSprint },
  { label: '新增知识', command: 'knowledge', visible: props.canAddKnowledge },
].filter((item) => item.visible))

const hasAnyAction = computed(() => primaryActions.value.length > 0 || secondaryActions.value.length > 0)

function handleCreateRecord(path) {
  emit('createRecord', path)
}

function handleSecondaryCommand(command) {
  const action = secondaryActions.value.find((item) => item.command === command)
  if (!action) return
  if (action.command === 'knowledge') {
    emit('createKnowledge')
    return
  }
  emit('createRecord', action.path)
}
</script>

<template>
  <div v-if="hasAnyAction" class="hero-action-card">
    <div class="hero-action-card__header">
      <div>
        <div class="hero-action-card__title">快捷发起</div>
        <div class="hero-action-card__desc">常用项目动作</div>
      </div>
      <el-dropdown v-if="secondaryActions.length" trigger="click" @command="handleSecondaryCommand">
        <el-button>
          更多操作
          <el-icon class="hero-action-card__dropdown-icon"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in secondaryActions" :key="item.command" :command="item.command">
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="hero-action-card__actions">
      <el-button
        v-for="item in primaryActions"
        :key="item.path"
        type="primary"
        plain
        @click="handleCreateRecord(item.path)"
      >
        {{ item.label }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.hero-action-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-fill-color-extra-light));
}

.hero-action-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hero-action-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.hero-action-card__desc {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.hero-action-card__dropdown-icon {
  margin-left: 4px;
}

.hero-action-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.hero-action-card__actions :deep(.el-button) {
  margin-left: 0;
}
</style>
