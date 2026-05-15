<script setup lang="ts">
import { computed } from 'vue'

const nodeWidth = 144
const nodeHeight = 86

const props = defineProps({
  instanceInfo: { type: Object, default: () => ({}) },
  definition: { type: Object, default: () => ({}) },
  tasks: { type: Array, default: () => [] },
  historyList: { type: Array, default: () => [] },
  currentTaskId: { type: [String, Number], default: '' },
  nodeName: { type: String, default: '' },
})

const sourceNodes = computed<any[]>(() => {
  const nodes = props.definition?.nodes || props.instanceInfo?.nodes || []
  return Array.isArray(nodes) ? nodes : []
})

const sourceFlows = computed<any[]>(() => {
  const flows = props.definition?.flows || props.instanceInfo?.flows || []
  return Array.isArray(flows) ? flows : []
})

const currentTask = computed<any>(() => {
  return (props.tasks || []).find((task: any) => String(task.id) === String(props.currentTaskId || ''))
    || (props.tasks || []).find((task: any) => String(task.status || '') === '1')
    || null
})

const currentNodeId = computed(() => {
  return String(props.instanceInfo?.currentNodeId || currentTask.value?.nodeId || '')
})

const completedNodeIds = computed(() => {
  const ids = new Set<string>()
  ;(props.historyList || []).forEach((item: any) => {
    const nodeId = String(item?.nodeId || '')
    if (nodeId) ids.add(nodeId)
  })
  ;(props.tasks || []).forEach((task: any) => {
    const nodeId = String(task?.nodeId || '')
    if (nodeId && String(task?.status || '') === '2') ids.add(nodeId)
  })
  return ids
})

const nodeNameCountMap = computed(() => {
  const map = new Map<string, number>()
  sourceNodes.value.forEach((node: any) => {
    const nodeName = String(node?.name || '')
    if (!nodeName) return
    map.set(nodeName, (map.get(nodeName) || 0) + 1)
  })
  return map
})

const getIsUniqueNodeName = (nodeName: string) => {
  return !!nodeName && (nodeNameCountMap.value.get(nodeName) || 0) === 1
}

const getIsNodeMatchedByIdOrUniqueName = (item: any, node: any) => {
  const nodeId = String(node?.id || '')
  const itemNodeId = String(item?.nodeId || '')
  if (nodeId && itemNodeId) return itemNodeId === nodeId

  const nodeName = String(node?.name || '')
  const itemNodeName = String(item?.nodeName || '')
  return !!nodeName && getIsUniqueNodeName(nodeName) && itemNodeName === nodeName
}

const nodeStateMap = computed(() => {
  const map = new Map<string, string>()
  sourceNodes.value.forEach((node: any) => {
    const nodeId = String(node.id || '')
    const nodeName = String(node.name || '')
    const matchesUniqueName = !currentNodeId.value && getIsUniqueNodeName(nodeName) && String(props.nodeName || '') === nodeName
    if (nodeId && (nodeId === currentNodeId.value || matchesUniqueName)) {
      map.set(nodeId, 'current')
      return
    }
    if (nodeId && completedNodeIds.value.has(nodeId)) {
      map.set(nodeId, 'completed')
      return
    }
    map.set(nodeId, 'pending')
  })
  return map
})

const flowNodes = computed(() => {
  return sourceNodes.value.map((node: any, index: number) => {
    const fallbackColumn = index % 4
    const fallbackRow = Math.floor(index / 4)
    const x = Number(node.x ?? 40 + fallbackColumn * 220)
    const y = Number(node.y ?? 40 + fallbackRow * 150)
    return {
      ...node,
      x,
      y,
      state: nodeStateMap.value.get(String(node.id || '')) || 'pending',
    }
  })
})

const nodeById = computed(() => {
  const map = new Map<string, any>()
  flowNodes.value.forEach((node: any) => map.set(String(node.id || ''), node))
  return map
})

const canvasWidth = computed(() => {
  if (!flowNodes.value.length) return 800
  return Math.max(800, Math.max(...flowNodes.value.map((node: any) => node.x + nodeWidth)) + 60)
})

const canvasHeight = computed(() => {
  if (!flowNodes.value.length) return 360
  return Math.max(360, Math.max(...flowNodes.value.map((node: any) => node.y + nodeHeight)) + 60)
})

const getNodeTypeName = (type: string) => {
  const map: Record<string, string> = {
    start: '开始',
    end: '结束',
    approval: '审批',
    condition: '条件',
    notification: '通知',
    cc: '抄送',
    delay: '延时',
    form: '表单',
  }
  return map[type] || type || '节点'
}

const getNodeIcon = (type: string) => {
  const map: Record<string, string> = {
    start: '始',
    end: '终',
    approval: '审',
    condition: '判',
    notification: '通',
    cc: '抄',
    delay: '延',
    form: '表',
  }
  return map[type] || '节'
}

const getNodeSummary = (node: any) => {
  if (node.state === 'current') return '当前节点'
  if (node.state === 'completed') return '已流转'
  if (node.type === 'condition') return '条件分支'
  return '未流转'
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = { '1': '同意', '2': '驳回', '3': '撤回', '4': '转交', '5': '加签', '6': '终止', execute: '系统流转' }
  return texts[action] || action || '-'
}

const getIsApprovalHistory = (item: any) => {
  return String(item?.action || '') !== 'execute'
}

const getNodeApprovalRecords = (node: any) => {
  const nodeId = String(node?.id || '')
  const nodeName = String(node?.name || '')
  if (!nodeId && !nodeName) return []

  const matchedHistory = (props.historyList || [])
    .filter(getIsApprovalHistory)
    .filter((item: any) => getIsNodeMatchedByIdOrUniqueName(item, node))

  if (matchedHistory.length) {
    return matchedHistory.map((item: any) => {
      const matchedTask = (props.tasks || []).find((task: any) => {
        if (item?.taskId && String(task?.id || '') === String(item.taskId)) return true
        return String(task?.nodeId || '') === String(item?.nodeId || '') && String(task?.completeTime || '') === String(item?.createTime || '')
      }) as any
      const operatorName = item?.operatorName || matchedTask?.assigneeName || item?.operatorId || matchedTask?.assigneeId || '-'
      return {
        operatorText: item?.operatorId && item?.operatorName ? `${item.operatorName}（${item.operatorId}）` : operatorName,
        actionText: getActionText(item?.action),
        commentText: item?.comment || '无审批意见',
      }
    })
  }

  return (props.tasks || [])
    .filter((task: any) => getIsNodeMatchedByIdOrUniqueName(task, node))
    .map((task: any) => ({
      operatorText: task?.assigneeName || task?.assigneeId || '-',
      actionText: getActionText(task?.action || (String(task?.status || '') === '1' ? '待处理' : '')),
      commentText: task?.comment || '无审批意见',
    }))
}

const getAnchorPoint = (nodeId: string, position = 'right') => {
  const node = nodeById.value.get(String(nodeId || ''))
  if (!node) return { x: 0, y: 0 }
  if (position === 'left') return { x: node.x, y: node.y + nodeHeight / 2 }
  if (position === 'top') return { x: node.x + nodeWidth / 2, y: node.y }
  if (position === 'bottom') return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight }
  return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 }
}

const getFlowPath = (flow: any) => {
  const source = nodeById.value.get(String(flow.sourceNodeId || ''))
  const target = nodeById.value.get(String(flow.targetNodeId || ''))
  if (!source || !target) return ''
  const sourceAnchor = flow.sourceAnchor || (source.x <= target.x ? 'right' : 'left')
  const targetAnchor = flow.targetAnchor || (source.x <= target.x ? 'left' : 'right')
  const start = getAnchorPoint(flow.sourceNodeId, sourceAnchor)
  const end = getAnchorPoint(flow.targetNodeId, targetAnchor)
  const offset = Math.max(48, Math.min(Math.abs(end.x - start.x), 140) * 0.5)
  const cp1x = sourceAnchor === 'left' ? start.x - offset : sourceAnchor === 'right' ? start.x + offset : start.x
  const cp1y = sourceAnchor === 'top' ? start.y - offset : sourceAnchor === 'bottom' ? start.y + offset : start.y
  const cp2x = targetAnchor === 'left' ? end.x - offset : targetAnchor === 'right' ? end.x + offset : end.x
  const cp2y = targetAnchor === 'top' ? end.y - offset : targetAnchor === 'bottom' ? end.y + offset : end.y
  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`
}

const getFlowLabel = (flow: any) => {
  if (flow.flowType === 'default') return '默认分支'
  if (flow.flowType === 'condition') return flow.label || flow.name || '条件分支'
  return flow.label || ''
}

const getFlowLabelPosition = (flow: any) => {
  const source = nodeById.value.get(String(flow.sourceNodeId || ''))
  const target = nodeById.value.get(String(flow.targetNodeId || ''))
  if (!source || !target) return { x: 0, y: 0 }
  return {
    x: (source.x + target.x + nodeWidth) / 2,
    y: (source.y + target.y + nodeHeight) / 2 - 10,
  }
}

const isFlowCompleted = (flow: any) => {
  const sourceState = nodeStateMap.value.get(String(flow.sourceNodeId || ''))
  const targetState = nodeStateMap.value.get(String(flow.targetNodeId || ''))
  return ['completed', 'current'].includes(String(sourceState)) && ['completed', 'current'].includes(String(targetState))
}
</script>

<template>
  <div>
    <div v-if="flowNodes.length" class="workflow-progress-diagram">
      <div class="workflow-progress-canvas" :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }">
        <svg class="workflow-progress-svg" :width="canvasWidth" :height="canvasHeight">
          <defs>
            <marker id="workflow-progress-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#909399" />
            </marker>
            <marker id="workflow-progress-arrow-active" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#409eff" />
            </marker>
          </defs>
          <g v-for="flow in sourceFlows" :key="flow.id || `${flow.sourceNodeId}-${flow.targetNodeId}`">
            <path
              class="workflow-progress-flow"
              :class="{ 'workflow-progress-flow--completed': isFlowCompleted(flow), [`workflow-progress-flow--${flow.flowType || 'normal'}`]: true }"
              :d="getFlowPath(flow)"
              fill="none"
              :marker-end="isFlowCompleted(flow) ? 'url(#workflow-progress-arrow-active)' : 'url(#workflow-progress-arrow)'"
            />
            <text
              v-if="getFlowLabel(flow)"
              class="workflow-progress-flow__label"
              :x="getFlowLabelPosition(flow).x"
              :y="getFlowLabelPosition(flow).y"
            >
              {{ getFlowLabel(flow) }}
            </text>
          </g>
        </svg>

        <el-popover
          v-for="node in flowNodes"
          :key="node.id"
          placement="top"
          trigger="hover"
          width="300"
          popper-class="workflow-progress-node-popover"
        >
          <div class="workflow-progress-node-popover__title">{{ node.name || '流程节点' }}</div>
          <template v-if="node.state !== 'pending'">
            <div v-if="getNodeApprovalRecords(node).length" class="workflow-progress-node-popover__records">
              <div v-for="(record, recordIndex) in getNodeApprovalRecords(node)" :key="recordIndex" class="workflow-progress-node-popover__record">
                <div class="workflow-progress-node-popover__row">
                  <span>审批人</span>
                  <strong>{{ record.operatorText }}</strong>
                </div>
                <div class="workflow-progress-node-popover__row">
                  <span>审批操作</span>
                  <strong>{{ record.actionText }}</strong>
                </div>
                <div class="workflow-progress-node-popover__row">
                  <span>审批意见</span>
                  <strong>{{ record.commentText }}</strong>
                </div>
              </div>
            </div>
            <div v-else class="workflow-progress-node-popover__empty">暂无审批信息</div>
          </template>
          <div v-else class="workflow-progress-node-popover__empty">节点尚未流经</div>

          <template #reference>
            <div
              class="workflow-progress-node"
              :class="[
                `workflow-progress-node--${node.type || 'normal'}`,
                `workflow-progress-node--${node.state}`,
                {
                  'workflow-progress-node--current': node.state === 'current',
                  'workflow-progress-node--completed': node.state === 'completed',
                  'workflow-progress-node--pending': node.state === 'pending',
                },
              ]"
              :style="{ left: `${node.x}px`, top: `${node.y}px` }"
            >
              <div class="workflow-progress-node__icon">{{ getNodeIcon(node.type) }}</div>
              <div class="workflow-progress-node__body">
                <div class="workflow-progress-node__name">{{ node.name || '流程节点' }}</div>
                <div class="workflow-progress-node__type">{{ getNodeTypeName(node.type) }}</div>
                <div class="workflow-progress-node__summary">{{ getNodeSummary(node) }}</div>
              </div>
            </div>
          </template>
        </el-popover>
      </div>
    </div>
    <el-empty v-else description="暂无流程图" />
  </div>
</template>

<style scoped>
.workflow-progress-diagram {
  width: 100%;
  overflow: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background:
    linear-gradient(var(--el-fill-color-lighter) 1px, transparent 1px),
    linear-gradient(90deg, var(--el-fill-color-lighter) 1px, transparent 1px),
    var(--el-bg-color);
  background-size: 24px 24px;
}

.workflow-progress-canvas {
  position: relative;
  min-width: 100%;
}

.workflow-progress-svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}

.workflow-progress-flow {
  stroke: #909399;
  stroke-width: 2;
}

.workflow-progress-flow--condition,
.workflow-progress-flow--default {
  stroke-dasharray: 5 5;
}

.workflow-progress-flow--completed {
  stroke: #409eff;
  stroke-width: 3;
}

.workflow-progress-flow__label {
  fill: #606266;
  font-size: 12px;
  text-anchor: middle;
  paint-order: stroke;
  stroke: var(--el-bg-color);
  stroke-width: 4px;
  stroke-linejoin: round;
}

.workflow-progress-node {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 144px;
  min-height: 86px;
  padding: 12px;
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.workflow-progress-node__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
}

.workflow-progress-node__body {
  min-width: 0;
}

.workflow-progress-node__name {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.workflow-progress-node__type,
.workflow-progress-node__summary {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.3;
}

.workflow-progress-node--start,
.workflow-progress-node--end {
  border-color: #409eff;
}

.workflow-progress-node--approval {
  border-color: #67c23a;
}

.workflow-progress-node--condition {
  border-color: #e6a23c;
}

.workflow-progress-node--current {
  border-color: #409eff;
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.16), 0 8px 18px rgba(64, 158, 255, 0.16);
}

.workflow-progress-node--current .workflow-progress-node__icon {
  background: #409eff;
  color: #fff;
}

.workflow-progress-node--completed {
  border-color: #67c23a;
  background: var(--el-color-success-light-9);
}

.workflow-progress-node--completed .workflow-progress-node__icon {
  background: #67c23a;
  color: #fff;
}

.workflow-progress-node--pending {
  opacity: 0.72;
}

.workflow-progress-node-popover__title {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}

.workflow-progress-node-popover__records {
  display: grid;
  gap: 10px;
}

.workflow-progress-node-popover__record {
  display: grid;
  gap: 6px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.workflow-progress-node-popover__record:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.workflow-progress-node-popover__row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
}

.workflow-progress-node-popover__row strong {
  color: var(--el-text-color-primary);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.workflow-progress-node-popover__empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
