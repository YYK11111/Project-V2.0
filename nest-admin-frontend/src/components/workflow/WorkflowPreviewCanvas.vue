<template>
  <div class="workflow-preview-canvas" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
    <svg class="flow-lines" :width="canvasWidth" :height="canvasHeight">
      <defs>
        <marker id="preview-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#409eff"/>
        </marker>
        <marker id="preview-arrow-conditional" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#e6a23c"/>
        </marker>
        <marker id="preview-arrow-default" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#909399"/>
        </marker>
      </defs>

      <g v-for="flow in flows" :key="flow.id">
        <path
          :d="getBezierPath(flow)"
          :stroke="getFlowColor(flow)"
          stroke-width="2"
          fill="none"
          :stroke-dasharray="flow.flowType === 'default' ? '5,5' : (flow.flowType === 'condition' ? '5,5' : 'none')"
          :marker-end="getArrowMarker(flow)"
        />
        <text
          v-if="getFlowLabel(flow)"
          :x="getFlowLabelPosition(flow).x"
          :y="getFlowLabelPosition(flow).y"
          class="flow-label"
          :class="[`flow-label--${flow.flowType || 'normal'}`]"
        >
          {{ getFlowLabel(flow) }}
        </text>
      </g>
    </svg>

    <div
      v-for="node in nodes"
      :key="node.id"
      class="canvas-node canvas-node--preview"
      :class="[`node-${node.type}`, { 'node-incomplete': isNodeIncomplete(node) }]"
      :style="{ left: (node.x || 100) + 'px', top: (node.y || 100) + 'px' }"
    >
      <div class="node-icon">{{ getNodeIcon(node.type) }}</div>
      <div class="node-name">{{ node.name }}</div>
      <div class="node-type">{{ getNodeTypeName(node.type) }}</div>
      <div class="node-preview-summary">{{ getPreviewNodeSummary(node) }}</div>
      <div v-if="isNodeIncomplete(node)" class="node-warning">配置未完成</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  nodes: { type: Array, default: () => [] },
  flows: { type: Array, default: () => [] },
  canvasWidth: { type: Number, default: 800 },
  canvasHeight: { type: Number, default: 600 },
  getBezierPath: { type: Function, required: true },
  getFlowColor: { type: Function, required: true },
  getArrowMarker: { type: Function, required: true },
  getFlowLabel: { type: Function, required: true },
  getFlowLabelPosition: { type: Function, required: true },
  getNodeIcon: { type: Function, required: true },
  getNodeTypeName: { type: Function, required: true },
  getPreviewNodeSummary: { type: Function, required: true },
  isNodeIncomplete: { type: Function, required: true },
})
</script>

<style scoped>
.workflow-preview-canvas {
  position: relative;
}

.canvas-node {
  position: absolute;
  min-width: 120px;
  min-height: 72px;
  padding: 12px 16px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.node-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.node-name {
  font-weight: 700;
  font-size: 13px;
  color: #303133;
}

.node-type {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.node-start,
.node-end {
  background: #ecf5ff;
  border-color: #409eff;
}

.node-approval {
  background: #f0f9eb;
  border-color: #67c23a;
}

.node-condition {
  background: #fef0f0;
  border-color: #f56c6c;
}

.node-notification {
  background: #fdf6ec;
  border-color: #e6a23c;
}

.node-cc {
  background: #f4f4f5;
  border-color: #909399;
}

.node-delay {
  background: #e6f7ff;
  border-color: #1890ff;
}

.node-form {
  background: #fff7e6;
  border-color: #fa8c16;
}

.flow-lines {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}

.canvas-node--preview {
  cursor: default;
  z-index: 1;
}

.canvas-node--preview:hover {
  border-color: inherit;
}

.node-preview-summary {
  margin-top: 6px;
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
}

.node-warning {
  margin-top: 6px;
  color: #f56c6c;
  font-size: 12px;
  font-weight: 600;
}

.node-incomplete {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.12);
}

.flow-label {
  font-size: 12px;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 3px;
  stroke-linejoin: round;
  fill: #606266;
  pointer-events: none;
}

.flow-label--condition {
  fill: #e6a23c;
}

.flow-label--default {
  fill: #909399;
}
</style>
