<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  instanceInfo: { type: Object, default: () => ({}) },
  tasks: { type: Array, default: () => [] },
  currentTaskId: { type: [String, Number], default: '' },
  nodeName: { type: String, default: '' },
})

const workflowStatusText = computed(() => {
  if (props.instanceInfo?.status === '1') return '进行中'
  if (props.instanceInfo?.status === '2') return '已完成'
  return '已取消'
})

const workflowStatusType = computed(() => {
  if (props.instanceInfo?.status === '1') return 'warning'
  if (props.instanceInfo?.status === '2') return 'success'
  return 'info'
})

const progressTaskCards = computed(() => {
  return (props.tasks || []).map((task: any, index: number) => ({
    ...task,
    stepNumber: index + 1,
    isActive: String(task.id) === String(props.currentTaskId || ''),
    isCompleted: task.status === '2',
    statusText: task.status === '1' ? '待处理' : task.status === '2' ? '已完成' : '已取消',
    statusType: task.status === '1' ? 'warning' : task.status === '2' ? 'success' : 'info',
  }))
})
</script>

<template>
  <div>
    <div class="progress-overview">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="业务标题">{{ instanceInfo?.businessTitle || '-' }}</el-descriptions-item>
        <el-descriptions-item label="业务编号">{{ instanceInfo?.businessCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发起人">{{ instanceInfo?.starterName || instanceInfo?.starterId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实例状态">
          <el-tag :type="workflowStatusType">{{ workflowStatusText }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前节点">{{ nodeName || instanceInfo?.currentNodeName || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="progressTaskCards.length" class="workflow-progress-line">
      <div
        v-for="task in progressTaskCards"
        :key="task.id"
        class="workflow-progress-step"
        :class="{
          'workflow-progress-step--active': task.id === currentTaskId,
          'workflow-progress-step--completed': task.isCompleted,
        }"
      >
        <div class="workflow-progress-step__marker">{{ task.stepNumber }}</div>
        <div class="workflow-progress-step__content">
          <div class="workflow-progress-step__head">
            <div>
              <div class="workflow-progress-step__title">{{ task.nodeName || '流程节点' }}</div>
              <div class="workflow-progress-step__subtitle">办理人：{{ task.assigneeName || task.assigneeId || '-' }}</div>
            </div>
            <el-tag :type="task.statusType" size="small">{{ task.statusText }}</el-tag>
          </div>
          <div class="workflow-progress-step__meta">
            <span>到达时间：{{ task.startTime || task.createTime || '-' }}</span>
            <span>完成时间：{{ task.completeTime || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无流程进度" />
  </div>
</template>

<style scoped>
.progress-overview {
  margin-bottom: 16px;
}

.workflow-progress-line {
  position: relative;
  display: grid;
  gap: 14px;
  padding-left: 28px;
}

.workflow-progress-line::before {
  content: "";
  position: absolute;
  left: 13px;
  top: 18px;
  bottom: 18px;
  width: 2px;
  background: var(--el-border-color-light);
}

.workflow-progress-step {
  position: relative;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.workflow-progress-step__marker {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 2px solid var(--el-border-color-light);
  border-radius: 50%;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 700;
}

.workflow-progress-step__content {
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.workflow-progress-step--active .workflow-progress-step__marker {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning);
  color: #fff;
}

.workflow-progress-step--active .workflow-progress-step__content {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.12);
}

.workflow-progress-step--completed .workflow-progress-step__marker {
  border-color: var(--el-color-success);
  background: var(--el-color-success);
  color: #fff;
}

.workflow-progress-step__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.workflow-progress-step__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.workflow-progress-step__subtitle,
.workflow-progress-step__meta {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}

.workflow-progress-step__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}

@media (max-width: 768px) {
  .workflow-progress-line {
    padding-left: 22px;
  }

  .workflow-progress-step {
    grid-template-columns: 28px minmax(0, 1fr);
  }

  .workflow-progress-step__head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
