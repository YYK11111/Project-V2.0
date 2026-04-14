<template>
  <div class="workflow-designer">
    <!-- 工具栏 -->
      <div class="designer-toolbar">
        <el-button-group>
        <el-button v-if="canWorkflowDefinitionSave" type="primary" @click="handleSave" :loading="saving">保存</el-button>
        <el-button v-if="canWorkflowDefinitionPublish" type="success" @click="handleSaveAndPublish" :loading="publishing">保存并发布</el-button>
        <el-button @click="handlePreview">预览</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-button-group>
      <el-button v-if="validationIssues.length" type="danger" plain style="margin-left: 12px;" @click="showIssuePanel = !showIssuePanel">
        问题 {{ validationIssues.length }} 项
      </el-button>
      <el-button-group style="margin-left: 12px;">
        <el-button @click="zoomOut">缩小</el-button>
        <el-button @click="resetViewport">100%</el-button>
        <el-button @click="zoomIn">放大</el-button>
        <el-button @click="fitCanvas">适应画布</el-button>
      </el-button-group>
      <el-select v-model="selectedDefinitionId" placeholder="选择流程" @change="loadDefinition" style="width: 200px; margin-left: 20px;">
        <el-option v-for="item in definitions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </div>

    <div class="designer-body">
      <!-- 左侧节点面板 -->
      <div class="designer-palette">
        <div class="panel-title">基础节点</div>
        <div
          v-for="node in basicNodes"
          :key="node.type"
          class="palette-node"
          draggable="true"
          @dragstart="onDragStart($event, node)"
        >
          <span class="node-icon">{{ node.icon }}</span>
          <span>{{ node.name }}</span>
        </div>

        <div class="panel-title">审批节点</div>
        <div
          v-for="node in approvalNodes"
          :key="node.type"
          class="palette-node approval-node"
          draggable="true"
          @dragstart="onDragStart($event, node)"
        >
          <span class="node-icon">{{ node.icon }}</span>
          <span>{{ node.name }}</span>
        </div>

        <div class="panel-title">逻辑节点</div>
        <div
          v-for="node in logicNodes"
          :key="node.type"
          class="palette-node"
          draggable="true"
          @dragstart="onDragStart($event, node)"
        >
          <span class="node-icon">{{ node.icon }}</span>
          <span>{{ node.name }}</span>
        </div>
      </div>

      <!-- 画布 -->
      <div class="designer-canvas" ref="canvasRef" @drop="onDrop" @dragover.prevent>
        <div class="canvas-hint" v-if="!hasNodes">
          <p>从左侧拖拽节点到此处开始设计流程</p>
        </div>
        <div class="canvas-content" v-else :style="canvasContentStyle" @click="onCanvasClick">
          <!-- SVG 连线层 -->
          <svg class="flow-lines" :width="canvasWidth" :height="canvasHeight">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#409eff"/>
              </marker>
              <marker id="arrow-conditional" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#e6a23c"/>
              </marker>
              <marker id="arrow-default" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#909399"/>
              </marker>
            </defs>
            
            <!-- 正式连线：贝塞尔曲线 -->
            <g v-for="flow in flows" :key="flow.id">
              <!-- 可点击区域（加粗透明） -->
              <path
                :d="getBezierPath(flow)"
                stroke="transparent"
                stroke-width="12"
                fill="none"
                style="cursor: pointer"
                @click="onFlowClick(flow, $event)"
              />
              <!-- 实际连线 -->
              <path
                :d="getBezierPath(flow)"
                :stroke="getFlowColor(flow)"
                stroke-width="2"
                fill="none"
                :stroke-dasharray="flow.flowType === 'default' ? '5,5' : (flow.flowType === 'condition' ? '5,5' : 'none')"
                :marker-end="getArrowMarker(flow)"
                :class="['flow-path', { selected: selectedFlowId === flow.id }]"
                @click="onFlowClick(flow, $event)"
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
              <!-- 连接线端点 - 起点（仅选中时显示） -->
              <circle
                v-if="selectedFlowId === flow.id && getFlowStartPoint(flow).x !== undefined"
                :cx="getFlowStartPoint(flow).x"
                :cy="getFlowStartPoint(flow).y"
                r="6"
                :fill="getFlowColor(flow)"
                stroke="#fff"
                stroke-width="2"
                class="flow-endpoint"
                @mousedown.stop="onFlowEndpointMouseDown($event, flow, 'source')"
              />
              <!-- 连接线端点 - 终点（仅选中时显示） -->
              <circle
                v-if="selectedFlowId === flow.id && getFlowEndPoint(flow).x !== undefined"
                :cx="getFlowEndPoint(flow).x"
                :cy="getFlowEndPoint(flow).y"
                r="6"
                :fill="getFlowColor(flow)"
                stroke="#fff"
                stroke-width="2"
                class="flow-endpoint"
                @mousedown.stop="onFlowEndpointMouseDown($event, flow, 'target')"
              />
            </g>
            
            <!-- 临时连线（拖拽中） -->
            <path
              v-if="connecting"
              :d="getTempBezierPath()"
              stroke="#409eff"
              stroke-width="2"
              stroke-dasharray="5,5"
              fill="none"
              opacity="0.7"
            />
          </svg>
          
          <!-- 节点层 -->
          <div
            v-for="(node, index) in nodes"
            :key="node.id"
            :data-node-id="node.id"
            class="canvas-node"
            :class="[`node-${node.type}`, { selected: selectedNodeId === node.id }]"
            :style="{ left: (node.x || 100) + 'px', top: (node.y || 100 + index * 80) + 'px' }"
            @click.stop="selectNode(node)"
            @mousedown="onNodeMouseDown($event, node)"
          >
            <!-- 连接点 -->
            <div class="anchor anchor-top" 
                 :class="{ 'anchor-active': hoveredAnchor?.nodeId === node.id && hoveredAnchor?.position === 'top', 'anchor-connectable': connecting && canConnectTo(node.id) }"
                 @mousedown.stop="onAnchorMouseDown($event, node.id, 'top')"></div>
            <div class="anchor anchor-bottom"
                 :class="{ 'anchor-active': hoveredAnchor?.nodeId === node.id && hoveredAnchor?.position === 'bottom', 'anchor-connectable': connecting && canConnectTo(node.id) }"
                 @mousedown.stop="onAnchorMouseDown($event, node.id, 'bottom')"></div>
            <div class="anchor anchor-left"
                 :class="{ 'anchor-active': hoveredAnchor?.nodeId === node.id && hoveredAnchor?.position === 'left', 'anchor-connectable': connecting && canConnectTo(node.id) }"
                 @mousedown.stop="onAnchorMouseDown($event, node.id, 'left')"></div>
            <div class="anchor anchor-right"
                 :class="{ 'anchor-active': hoveredAnchor?.nodeId === node.id && hoveredAnchor?.position === 'right', 'anchor-connectable': connecting && canConnectTo(node.id) }"
                 @mousedown.stop="onAnchorMouseDown($event, node.id, 'right')"></div>
            <div class="node-icon">{{ getNodeIcon(node.type) }}</div>
            <div class="node-name">{{ node.name }}</div>
            <div class="node-type">{{ getNodeTypeName(node.type) }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="designer-properties">
        <div v-if="showIssuePanel && validationIssues.length" class="issue-panel">
          <div class="issue-panel-title">发布前检查</div>
            <div v-for="(issue, index) in validationIssues" :key="`${issue.type}-${index}`" class="issue-item" @click="focusIssue(issue)">
            <div class="issue-item-title">{{ index + 1 }}. {{ issue.message }}</div>
            <div v-if="issue.nodeName" class="issue-item-meta">节点：{{ issue.nodeName }}</div>
          </div>
        </div>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="流程属性" name="process">
            <el-form label-width="80px" size="small">
              <el-form-item label="流程名称">
                <el-input v-model="workflowName" />
              </el-form-item>
              <el-form-item label="流程编码" v-show="false">
                <el-input v-model="workflowCode" />
              </el-form-item>
              <el-form-item label="流程分类">
                <el-input v-model="workflowCategory" />
              </el-form-item>
              <el-divider content-position="left">业务关联配置</el-divider>
              <el-form-item label="业务对象">
                <el-select v-model="businessType" placeholder="选择业务对象类型" @change="onBusinessTypeChange">
                  <el-option label="项目" value="project" />
                  <el-option label="任务" value="task" />
                  <el-option label="客户" value="customer" />
                  <el-option label="工单" value="ticket" />
                  <el-option label="变更请求" value="change" />
                </el-select>
              </el-form-item>
              <el-form-item label="业务场景">
                <el-select v-model="businessScene" placeholder="选择业务场景">
                  <el-option v-for="item in currentBusinessSceneOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="触发时机">
                <el-select v-model="triggerEvent" placeholder="选择触发时机">
                  <el-option label="手动触发" value="manual" />
                  <el-option label="创建时自动" value="onCreate" />
                  <el-option label="状态变更时" value="onStatusChange" />
                </el-select>
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="workflowDescription" type="textarea" :rows="3" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="节点属性" name="node">
            <template v-if="selectedNode">
              <el-form label-width="80px" size="small">
                <el-form-item label="节点名称">
                  <el-input v-model="selectedNode.name" />
                </el-form-item>
                <el-form-item label="节点类型">
                  <span>{{ getNodeTypeName(selectedNode.type) }}</span>
                </el-form-item>

                <!-- 审批节点属性 -->
                <template v-if="selectedNode.type === 'approval'">
                  <el-divider>审批配置</el-divider>
                  <el-form-item label="审批人配置">
                    <ApproverSelector
                      v-model="selectedNode.properties.approverConfig"
                      :business-type="businessType"
                    />
                  </el-form-item>
                  <el-form-item label="允许驳回">
                    <el-switch v-model="selectedNode.properties.allowRollback" />
                  </el-form-item>
                </template>

                <!-- 条件节点属性 -->
                <template v-if="selectedNode.type === 'condition'">
                  <el-divider>条件配置</el-divider>
                  <div class="condition-list">
                    <div v-for="(cond, idx) in selectedNode.properties.conditions" :key="cond.id" class="condition-item">
                      <div class="condition-header">
                        <span class="condition-label">分支 {{ idx + 1 }}</span>
                        <div class="condition-actions">
                          <el-radio
                            size="small"
                            :model-value="getDefaultFlow(selectedNode.id)?.conditionId || ''"
                            :label="getConditionFlow(selectedNode.id, cond.id)?.conditionId"
                            :disabled="!getConditionFlow(selectedNode.id, cond.id)?.targetNodeId"
                            @change="() => setDefaultConditionFlow(getConditionFlow(selectedNode.id, cond.id)?.id)"
                          >
                            设为默认分支
                          </el-radio>
                          <el-button size="small" text :disabled="idx === 0" @click="moveCondition(idx, -1)">上移</el-button>
                          <el-button size="small" text :disabled="idx === selectedNode.properties.conditions.length - 1" @click="moveCondition(idx, 1)">下移</el-button>
                          <el-button size="small" type="danger" text @click="removeCondition(idx)">删除</el-button>
                        </div>
                      </div>
                      <ConditionBuilder
                        v-model="selectedNode.properties.conditions[idx]"
                        :business-type="businessType"
                        :disabled="getConditionFlow(selectedNode.id, cond.id)?.flowType === 'default'"
                      />
                    </div>
                    <div class="condition-hint">从条件节点拖出分支连线，将自动生成对应条件配置</div>
                  </div>
                  
                  <el-divider>默认分支</el-divider>
                  <div class="default-branch">
                    <span>{{ getDefaultFlowSummary(selectedNode) }}</span>
                  </div>
                </template>

                <!-- 通知节点属性 -->
                <template v-if="selectedNode.type === 'notification'">
                  <el-divider>通知配置</el-divider>
                  <el-form-item label="通知类型">
                    <el-select v-model="selectedNode.properties.notificationType">
                      <el-option label="系统通知" value="system" />
                      <el-option label="邮件" value="email" />
                      <el-option label="短信" value="sms" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="接收人">
                    <el-input v-model="selectedNode.properties.notificationReceivers" placeholder="${initiator}" />
                  </el-form-item>
                  <el-form-item label="通知模板">
                    <el-input v-model="selectedNode.properties.notificationTemplate" type="textarea" :rows="3" />
                  </el-form-item>
                </template>

                <!-- 抄送节点属性 -->
                <template v-if="selectedNode.type === 'cc'">
                  <el-divider>抄送配置</el-divider>
                  <el-form-item label="抄送对象">
                    <ApproverSelector
                      v-model="selectedNode.properties.ccConfig"
                      :business-type="businessType"
                    />
                  </el-form-item>
                </template>

                <!-- 延时节点属性 -->
                <template v-if="selectedNode.type === 'delay'">
                  <el-divider>延时配置</el-divider>
                  <el-form-item label="延时类型">
                    <el-select v-model="selectedNode.properties.delayType">
                      <el-option label="固定延时" value="fixed" />
                      <el-option label="动态延时" value="dynamic" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="延时时间" v-if="selectedNode.properties.delayType === 'fixed'">
                    <el-input v-model.number="selectedNode.properties.delayValue" placeholder="毫秒" style="width: 150px;" />
                    <span style="margin-left: 10px; color: #999;">毫秒(默认1小时=3600000)</span>
                  </el-form-item>
                  <el-form-item label="延时变量" v-if="selectedNode.properties.delayType === 'dynamic'">
                    <el-input v-model="selectedNode.properties.delayExpr" placeholder="${variables.delayTime}" />
                  </el-form-item>
                </template>

                <!-- 表单节点属性 -->
                <template v-if="selectedNode.type === 'form'">
                  <el-divider>表单配置</el-divider>
                  <el-form-item label="表单标识">
                    <el-input v-model="selectedNode.properties.formId" placeholder="请输入表单ID" />
                  </el-form-item>
                  <el-form-item label="表单字段">
                    <el-input v-model="selectedNode.properties.formFieldsJson" type="textarea" :rows="4" placeholder='JSON格式，如: ["name", "remark"]' />
                  </el-form-item>
                </template>

                <el-divider />
                <el-form-item>
                  <el-button type="danger" @click="removeNode">删除节点</el-button>
                </el-form-item>
              </el-form>
            </template>
            <el-empty v-else description="请选择节点" />
          </el-tab-pane>

          <el-tab-pane label="连线属性" name="flow">
            <template v-if="selectedFlow">
              <el-form label-width="90px" size="small">
                <el-form-item label="连线类型">
                  <el-tag :type="selectedFlow.flowType === 'default' ? 'info' : selectedFlow.flowType === 'condition' ? 'warning' : 'primary'">
                    {{ getFlowTypeName(selectedFlow.flowType) }}
                  </el-tag>
                </el-form-item>
                <el-form-item label="源节点">
                  <span>{{ getNodeDisplayName(selectedFlow.sourceNodeId) }}</span>
                </el-form-item>
                <el-form-item label="目标节点">
                  <el-select
                    :model-value="selectedFlow.targetNodeId"
                    @update:model-value="(val) => updateSelectedFlowTarget(val)"
                    placeholder="选择目标节点"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="node in getAvailableFlowTargets(selectedFlow)"
                      :key="node.id"
                      :label="node.name"
                      :value="node.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="连接方向">
                  <span>{{ selectedFlow.sourceAnchor || '-' }} -> {{ selectedFlow.targetAnchor || '-' }}</span>
                </el-form-item>
                <el-form-item v-if="selectedFlow.flowType === 'condition'" label="关联条件">
                  <span>{{ getConditionSummaryByFlow(selectedFlow) }}</span>
                  <div v-if="getFlowStatusHint(selectedFlow)" class="flow-hint">
                    {{ getFlowStatusHint(selectedFlow) }}
                  </div>
                </el-form-item>
                <el-form-item v-if="selectedFlow.flowType === 'default'" label="说明">
                  <span>条件均不满足时走该默认分支</span>
                  <div v-if="getFlowStatusHint(selectedFlow)" class="flow-hint">
                    {{ getFlowStatusHint(selectedFlow) }}
                  </div>
                </el-form-item>
                <el-form-item>
                  <el-button type="danger" @click="deleteFlow(selectedFlow.id)">删除连线</el-button>
                </el-form-item>
              </el-form>
            </template>
            <el-empty v-else description="请选择连线" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 预览对话框 -->
    <!-- 流程预览对话框 -->
    <el-dialog v-model="previewVisible" title="流程预览" width="80%">
      <el-tabs v-model="previewActiveTab">
        <el-tab-pane label="可视化预览" name="visual">
          <div class="flow-preview">
            <WorkflowPreviewCanvas
              :nodes="nodes"
              :flows="flows"
              :canvas-width="canvasWidth"
              :canvas-height="canvasHeight"
              :get-bezier-path="getBezierPath"
              :get-flow-color="getFlowColor"
              :get-arrow-marker="getArrowMarker"
              :get-flow-label="getFlowLabel"
              :get-flow-label-position="getFlowLabelPosition"
              :get-node-icon="getNodeIcon"
              :get-node-type-name="getNodeTypeName"
              :get-preview-node-summary="getPreviewNodeSummary"
              :is-node-incomplete="isNodeIncomplete"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="JSON数据" name="json">
          <pre><code>{{ workflowData }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="配置摘要" name="summary">
          <div class="summary-panel">
            <div v-for="node in nodes" :key="node.id" class="summary-card">
              <div class="summary-title">
                <span>{{ node.name }}</span>
                <el-tag size="small">{{ getNodeTypeName(node.type) }}</el-tag>
              </div>
              <div class="summary-content">{{ getNodeSummary(node) }}</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as api from './api'
import ApproverSelector from '@/components/workflow/ApproverSelector.vue'
import ConditionBuilder from '@/components/workflow/ConditionBuilder.vue'
import WorkflowPreviewCanvas from '@/components/workflow/WorkflowPreviewCanvas.vue'
import { checkPermi } from '@/utils/permission'

const saving = ref(false)
const publishing = ref(false)
const previewVisible = ref(false)
const activeTab = ref('process')
const previewActiveTab = ref('visual')
const showIssuePanel = ref(true)
const canvasRef = ref(null)
const definitions = ref([])
const selectedDefinitionId = ref('')
const canWorkflowDefinitionAdd = computed(() => checkPermi(['business/workflow/definitions/add']))
const canWorkflowDefinitionUpdate = computed(() => checkPermi(['business/workflow/definitions/update']))
const canWorkflowDefinitionPublish = computed(() => checkPermi(['business/workflow/definitions/publish']))
const canWorkflowDefinitionSave = computed(() => (selectedDefinitionId.value ? canWorkflowDefinitionUpdate.value : canWorkflowDefinitionAdd.value))

// 节点尺寸常量（包含 padding 和 border 的估算值）
const NODE_WIDTH = 160
const NODE_HEIGHT = 80

// 节点尺寸缓存
const nodeSizeCache = reactive({})

// 流程基本信息
const workflowName = ref('')
const workflowCode = ref('')
const workflowCategory = ref('')
const workflowDescription = ref('')
const businessType = ref('')
const businessScene = ref('')
const triggerEvent = ref('')

// 节点配置
const nodes = ref([])
const selectedNodeId = ref('')
const flows = ref([])

// 连接线状态
const connecting = ref(false)          // 是否正在连接
const connectSource = ref(null)       // 连接源 { nodeId, position }
const tempLineEnd = ref({ x: 0, y: 0 }) // 临时连线终点
const hoveredAnchor = ref(null)       // 悬停的锚点 { nodeId, position }
const selectedFlowId = ref('')         // 选中的连线ID
const draggingFlowEndpoint = ref(null) // 拖动连线端点 { flow, endpoint: 'source' | 'target' }
const flowEndpointOffset = reactive({ x: 0, y: 0 })

const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value))
const selectedFlow = computed(() => flows.value.find(f => f.id === selectedFlowId.value))

const hasNodes = computed(() => nodes.value.length > 0)

// 可选的目标节点列表（排除自身）
const availableTargetNodes = computed(() => {
  if (!selectedNode.value) return []
  return nodes.value.filter(n => n.id !== selectedNode.value.id)
})

const workflowData = computed(() => JSON.stringify({
  name: workflowName.value,
  code: workflowCode.value,
  category: workflowCategory.value,
  description: workflowDescription.value,
  businessType: businessType.value,
  businessScene: businessScene.value,
  triggerEvent: triggerEvent.value,
  nodes: nodes.value,
  flows: flows.value,
}, null, 2))

const businessSceneOptions = {
  project: [
    { label: '立项审批', value: 'initiation' },
    { label: '结项审批', value: 'closure' },
  ],
  task: [{ label: '任务审批', value: 'approval' }],
  ticket: [{ label: '工单审批', value: 'approval' }],
  change: [{ label: '变更审批', value: 'approval' }],
  customer: [{ label: '客户审批', value: 'approval' }],
}

const currentBusinessSceneOptions = computed(() => businessSceneOptions[businessType.value] || [])

// Canvas 尺寸
const canvasWidth = computed(() => {
  if (nodes.value.length === 0) return 800
  const maxX = Math.max(...nodes.value.map(n => n.x + NODE_WIDTH))
  return Math.max(800, maxX + 100)
})

const getCanvasElements = () => {
  const canvasEl = canvasRef.value
  const contentEl = canvasEl?.querySelector('.canvas-content')
  return { canvasEl, contentEl }
}

const getCanvasPoint = (clientX, clientY) => {
  const { canvasEl, contentEl } = getCanvasElements()
  if (!canvasEl || !contentEl) return { x: 0, y: 0 }

  const rect = contentEl.getBoundingClientRect()
  return {
    x: (clientX - rect.left + canvasEl.scrollLeft) / zoom.value,
    y: (clientY - rect.top + canvasEl.scrollTop) / zoom.value,
  }
}

const canvasHeight = computed(() => {
  if (nodes.value.length === 0) return 600
  const maxY = Math.max(...nodes.value.map(n => n.y + NODE_HEIGHT))
  return Math.max(600, maxY + 100)
})

const zoom = ref(1)

const canvasContentStyle = computed(() => ({
  width: canvasWidth.value + 'px',
  height: canvasHeight.value + 'px',
  transform: `scale(${zoom.value})`,
  transformOrigin: 'top left',
}))

// 辅助函数：获取源节点和目标节点
const getSourceNode = (flow) => nodes.value.find(n => n.id === flow.sourceNodeId)
const getTargetNode = (flow) => nodes.value.find(n => n.id === flow.targetNodeId)

// 获取节点的4个连接点位置
const getNodeAnchors = (node) => {
  if (!node) return []
  
  // 使用缓存的尺寸，如果没有则使用默认值
  const cached = nodeSizeCache[node.id]
  const width = cached?.width || NODE_WIDTH
  const height = cached?.height || NODE_HEIGHT
  
  return [
    { position: 'top', x: node.x + width / 2, y: node.y },
    { position: 'bottom', x: node.x + width / 2, y: node.y + height },
    { position: 'left', x: node.x, y: node.y + height / 2 },
    { position: 'right', x: node.x + width, y: node.y + height / 2 },
  ]
}

// 获取指定连接点的坐标
const getAnchorPoint = (nodeId, position) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return { x: 0, y: 0 }
  const anchor = getNodeAnchors(node).find(a => a.position === position)
  return anchor || { x: 0, y: 0 }
}

// 获取连线起点坐标
const getFlowStartPoint = (flow) => {
  const anchor = getAnchorPoint(flow.sourceNodeId, flow.sourceAnchor || 'right')
  return anchor
}

// 获取连线终点坐标
const getFlowEndPoint = (flow) => {
  const anchor = getAnchorPoint(flow.targetNodeId, flow.targetAnchor || 'left')
  return anchor
}

// 贝塞尔曲线路径生成
const getBezierPath = (flow) => {
  const sourceNode = getSourceNode(flow)
  const targetNode = getTargetNode(flow)
  if (!sourceNode || !targetNode) return ''

  // 获取源和目标连接点（使用预定义的连接位置）
  const sourcePos = flow.sourceAnchor || 'right'
  const targetPos = flow.targetAnchor || 'left'
  
  const start = getAnchorPoint(flow.sourceNodeId, sourcePos)
  const end = getAnchorPoint(flow.targetNodeId, targetPos)

  // 计算控制点偏移
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const offset = Math.max(50, Math.min(dx, dy) * 0.5)

  let cp1x, cp1y, cp2x, cp2y

  // 根据连接方向确定控制点
  if (sourcePos === 'right' && targetPos === 'left') {
    cp1x = start.x + offset
    cp1y = start.y
    cp2x = end.x - offset
    cp2y = end.y
  } else if (sourcePos === 'left' && targetPos === 'right') {
    cp1x = start.x - offset
    cp1y = start.y
    cp2x = end.x + offset
    cp2y = end.y
  } else if (sourcePos === 'bottom' && targetPos === 'top') {
    cp1x = start.x
    cp1y = start.y + offset
    cp2x = end.x
    cp2y = end.y - offset
  } else if (sourcePos === 'top' && targetPos === 'bottom') {
    cp1x = start.x
    cp1y = start.y - offset
    cp2x = end.x
    cp2y = end.y + offset
  } else if (sourcePos === 'right' && targetPos === 'top') {
    cp1x = start.x + offset
    cp1y = start.y
    cp2x = end.x
    cp2y = end.y - offset
  } else if (sourcePos === 'right' && targetPos === 'bottom') {
    cp1x = start.x + offset
    cp1y = start.y
    cp2x = end.x
    cp2y = end.y + offset
  } else if (sourcePos === 'left' && targetPos === 'top') {
    cp1x = start.x - offset
    cp1y = start.y
    cp2x = end.x
    cp2y = end.y - offset
  } else if (sourcePos === 'left' && targetPos === 'bottom') {
    cp1x = start.x - offset
    cp1y = start.y
    cp2x = end.x
    cp2y = end.y + offset
  } else {
    // 默认情况
    cp1x = start.x + offset
    cp1y = start.y
    cp2x = end.x - offset
    cp2y = end.y
  }

  return `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`
}

// 临时连线路径（鼠标拖拽时）
const getTempBezierPath = () => {
  if (!connecting.value || !connectSource.value) return ''
  
  const start = getAnchorPoint(connectSource.value.nodeId, connectSource.value.position)
  const end = tempLineEnd.value
  
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const offset = Math.max(50, Math.min(dx, dy) * 0.5)

  let cp1x, cp1y, cp2x, cp2y
  const pos = connectSource.value.position

  if (pos === 'right') {
    cp1x = start.x + offset
    cp1y = start.y
    cp2x = end.x - offset
    cp2y = end.y
  } else if (pos === 'left') {
    cp1x = start.x - offset
    cp1y = start.y
    cp2x = end.x + offset
    cp2y = end.y
  } else if (pos === 'bottom') {
    cp1x = start.x
    cp1y = start.y + offset
    cp2x = end.x
    cp2y = end.y - offset
  } else {
    cp1x = start.x
    cp1y = start.y - offset
    cp2x = end.x
    cp2y = end.y + offset
  }

  return `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`
}

// 连线颜色
const getFlowColor = (flow) => {
  if (flow.flowType === 'default') return '#909399'  // 默认分支：灰色
  if (flow.flowType === 'condition') return '#e6a23c'  // 条件分支：橙色
  return '#409eff'                      // 普通连线：蓝色
}

// 箭头标记
const getArrowMarker = (flow) => {
  if (flow.flowType === 'default') return 'url(#arrow-default)'
  if (flow.flowType === 'condition') return 'url(#arrow-conditional)'
  return 'url(#arrow)'
}

const canConnectTo = (targetNodeId) => {
  return connecting.value && connectSource.value?.nodeId !== targetNodeId
}

const getInvalidConnectionReason = (source, target, flowType = 'normal') => {
  if (!source || !target) return '连接信息无效'
  if (source.nodeId === target.nodeId) return '节点不能连接到自身'

  if (flowType === 'normal' || flowType === 'condition') {
    const exists = flows.value.some(f =>
      f.sourceNodeId === source.nodeId &&
      f.targetNodeId === target.nodeId &&
      f.sourceAnchor === source.position &&
      f.targetAnchor === target.position &&
      (f.flowType || 'normal') === flowType
    )
    if (exists) return flowType === 'condition' ? '条件分支已存在' : '普通连线已存在'
  }

  return ''
}

// 节点定义
const basicNodes = [
  { type: 'start', name: '开始', icon: '▶' },
  { type: 'end', name: '结束', icon: '■' },
]

const approvalNodes = [
  { type: 'approval', name: '审批', icon: '✓' },
  { type: 'cc', name: '抄送', icon: '✉' },
]

const logicNodes = [
  { type: 'condition', name: '条件', icon: '？' },
  { type: 'notification', name: '通知', icon: '🔔' },
  { type: 'delay', name: '延时', icon: '⏰' },
  { type: 'form', name: '表单', icon: '📝' },
]

const getNodeIcon = (type) => {
  const icons = {
    start: '▶',
    end: '■',
    approval: '✓',
    condition: '？',
    notification: '🔔',
    cc: '✉',
    delay: '⏰',
    form: '📝',
  }
  return icons[type] || '○'
}

const getNodeTypeName = (type) => {
  const names = {
    start: '开始节点',
    end: '结束节点',
    approval: '审批节点',
    condition: '条件节点',
    notification: '通知节点',
    cc: '抄送节点',
    delay: '延时节点',
    form: '表单节点',
  }
  return names[type] || type
}

const getFlowTypeName = (flowType) => {
  const names = {
    normal: '普通连线',
    condition: '条件分支',
    default: '默认分支',
  }
  return names[flowType || 'normal'] || flowType
}

const getFlowLabel = (flow) => {
  if (flow.flowType === 'default') return '默认分支'
  if (flow.flowType === 'condition') {
    const summary = getConditionSummaryByFlow(flow)
    return summary === '未绑定条件' ? '条件分支' : summary
  }
  return ''
}

const getFlowStatusHint = (flow) => {
  if (flow.flowType === 'condition') {
    if (!flow.conditionId) return '未绑定条件'
    if (!flow.targetNodeId) return '未连接目标节点'
  }
  if (flow.flowType === 'default') {
    if (!flow.targetNodeId) return '未连接默认目标节点'
  }
  return ''
}

const getFlowLabelPosition = (flow) => {
  const start = getFlowStartPoint(flow)
  const end = getFlowEndPoint(flow)
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 - 8,
  }
}

const getNodeDisplayName = (nodeId) => {
  return nodes.value.find((node) => node.id === nodeId)?.name || '-'
}

const getAvailableFlowTargets = (flow) => {
  if (!flow) return []
  return nodes.value.filter((node) => node.id !== flow.sourceNodeId)
}

const getConditionSummaryByFlow = (flow) => {
  if (!flow?.conditionId) return '未绑定条件'
  const conditionNode = nodes.value.find((node) => node.type === 'condition' && (node.properties?.conditions || []).some((item) => item.id === flow.conditionId))
  const condition = conditionNode?.properties?.conditions?.find((item) => item.id === flow.conditionId)
  if (!condition) return '未绑定条件'
  return getConditionText(condition)
}

const getConditionFlow = (nodeId, conditionId) => {
  return flows.value.find((flow) => flow.sourceNodeId === nodeId && (flow.flowType === 'condition' || flow.flowType === 'default') && flow.conditionId === conditionId)
}

const getDefaultFlow = (nodeId) => {
  return flows.value.find((flow) => flow.sourceNodeId === nodeId && flow.flowType === 'default')
}

const getDefaultFlowSummary = (node) => {
  const defaultFlow = getDefaultFlow(node?.id)
  if (!defaultFlow?.targetNodeId) return '未设置默认分支'
  return `条件都不满足时，连至：${getNodeDisplayName(defaultFlow.targetNodeId)}`
}

const memberRoleLabelMap = {
  '1': '项目成员-项目经理',
  '2': '项目成员-交付经理',
  '3': '项目成员-技术负责人',
  '4': '项目成员-实施负责人',
  '5': '项目成员-测试负责人',
  '6': '项目成员-客户联系人',
  '7': '项目成员-商务接口人',
  '8': '项目成员-开发工程师',
  '9': '项目成员-实施顾问',
  A: '项目成员-测试工程师',
  B: '项目成员-运维工程师',
  C: '项目成员-培训顾问',
  D: '项目成员-数据迁移工程师',
  E: '项目成员-驻场支持',
  F: '项目成员-普通成员',
}

const getBusinessFieldLabel = (fieldPath) => {
  if (!fieldPath) return '未配置'
  const labelMap = {
    'leader.id': '项目负责人',
    submitterId: '工单提交人',
    handlerId: '工单处理人',
    requesterId: '变更申请人',
    approverId: '变更审批人',
    salesId: '销售负责人',
    'project.leaderId': '关联项目负责人',
    executorIds: '任务经办人',
  }
  if (labelMap[fieldPath]) return labelMap[fieldPath]
  if (fieldPath.startsWith('memberGroups.')) {
    return memberRoleLabelMap[fieldPath.replace('memberGroups.', '')] || fieldPath
  }
  return fieldPath
}

const getConditionText = (condition) => {
  const fieldPath = Array.isArray(condition.field) ? condition.field.join('.') : (condition.field || '未选字段')
  const fieldText = condition.fieldSource === 'field' ? getBusinessFieldLabel(fieldPath) : fieldPath
  const operatorMap = {
    eq: '等于',
    neq: '不等于',
    gt: '大于',
    gte: '大于等于',
    lt: '小于',
    lte: '小于等于',
    contains: '包含',
    memberOf: '属于部门',
    memberOfOrSubDept: '属于部门或子部门',
    containsUser: '包含人员',
    containsDept: '包含部门',
    isNull: '为空',
    isNotNull: '不为空',
  }
  const operatorText = operatorMap[condition.operator] || condition.operator || ''
  if (['isNull', 'isNotNull'].includes(condition.operator)) {
    return `${fieldText} ${operatorText}`.trim()
  }
  return `${fieldText} ${operatorText} ${condition.value || ''}`.trim()
}

const validationIssues = computed(() => {
  const issues = []

  if (!workflowName.value) {
    issues.push({ type: 'process', level: 'error', message: '流程名称未填写' })
  }
  if (!businessType.value) {
    issues.push({ type: 'process', level: 'error', message: '业务对象未选择' })
  }
  if (!businessScene.value) {
    issues.push({ type: 'process', level: 'error', message: '业务场景未选择' })
  }
  if (!triggerEvent.value) {
    issues.push({ type: 'process', level: 'error', message: '触发时机未选择' })
  }

  const startNodes = nodes.value.filter((node) => node.type === 'start')
  const endNodes = nodes.value.filter((node) => node.type === 'end')
  if (startNodes.length !== 1) {
    issues.push({ type: 'structure', level: 'error', message: '流程必须且只能包含一个开始节点' })
  }
  if (endNodes.length !== 1) {
    issues.push({ type: 'structure', level: 'error', message: '流程必须且只能包含一个结束节点' })
  }

  nodes.value.forEach((node) => {
    if (node.type === 'approval') {
      const config = node.properties?.approverConfig || {}
      if (!config.assigneeType) {
          issues.push({ type: 'approval', level: 'error', message: '审批人来源未配置', nodeName: node.name, nodeId: node.id })
      } else if (config.assigneeType === 'user' && !config.assigneeValue) {
          issues.push({ type: 'approval', level: 'error', message: '固定人员未选择', nodeName: node.name, nodeId: node.id })
      } else if (config.assigneeType === 'department' && (!config.departmentId || !config.departmentMode)) {
          issues.push({ type: 'approval', level: 'error', message: '固定部门配置不完整', nodeName: node.name, nodeId: node.id })
      } else if (config.assigneeType === 'business_field' && !config.fieldPath) {
          issues.push({ type: 'approval', level: 'error', message: '业务字段未选择', nodeName: node.name, nodeId: node.id })
      }
    }

    if (node.type === 'condition') {
      const conditions = node.properties?.conditions || []
      if (!conditions.length) {
        issues.push({ type: 'condition', level: 'error', message: '条件节点未配置任何条件', nodeName: node.name, nodeId: node.id })
      }
      conditions.forEach((condition, index) => {
        const flow = getConditionFlow(node.id, condition.id)
        if (!flow?.targetNodeId) {
          issues.push({ type: 'condition', level: 'error', message: `条件 ${index + 1} 未连接目标节点`, nodeName: node.name, nodeId: node.id })
        }
      })
      const defaultFlow = getDefaultFlow(node.id)
      if (!defaultFlow?.targetNodeId) {
        issues.push({ type: 'condition', level: 'warning', message: '未配置默认分支（运行时可能报错）', nodeName: node.name, nodeId: node.id })
      }
    }

    if (node.type === 'cc') {
      const config = node.properties?.ccConfig || {}
      if (!config.assigneeType) {
        issues.push({ type: 'cc', level: 'error', message: '抄送对象来源未配置', nodeName: node.name, nodeId: node.id })
      } else if (config.assigneeType === 'user' && !config.assigneeValue) {
        issues.push({ type: 'cc', level: 'error', message: '固定人员未选择', nodeName: node.name, nodeId: node.id })
      } else if (config.assigneeType === 'department' && (!config.departmentId || !config.departmentMode)) {
        issues.push({ type: 'cc', level: 'error', message: '固定部门配置不完整', nodeName: node.name, nodeId: node.id })
      } else if (config.assigneeType === 'business_field' && !config.fieldPath) {
        issues.push({ type: 'cc', level: 'error', message: '业务字段未选择', nodeName: node.name, nodeId: node.id })
      }
    }

    if (node.type === 'form' && !node.properties?.formId) {
      issues.push({ type: 'form', level: 'error', message: '表单节点未配置表单标识', nodeName: node.name, nodeId: node.id })
    }
  })

  flows.value.forEach((flow) => {
    if (!flow.sourceNodeId || !flow.targetNodeId) {
        issues.push({ type: 'flow', level: 'error', message: '存在未完成的连线', flowId: flow.id })
    }
  })

  if (hasCycle()) {
    issues.push({ type: 'structure', level: 'error', message: '流程存在环路' })
  }
  if (hasOrphanNodes()) {
    issues.push({ type: 'structure', level: 'error', message: '存在孤立节点，开始节点必须有出线，结束节点必须有入线' })
  }

  return issues
})

const focusIssue = (issue) => {
  if (issue.nodeId) {
    selectedNodeId.value = issue.nodeId
    selectedFlowId.value = ''
    activeTab.value = 'node'
    return
  }

  if (issue.flowId) {
    selectedFlowId.value = issue.flowId
    selectedNodeId.value = ''
    activeTab.value = 'flow'
    return
  }

  activeTab.value = 'process'
}

const isNodeIncomplete = (node) => {
  if (node.type === 'approval') {
    const config = node.properties?.approverConfig || {}
    if (!config.assigneeType) return true
    if (config.assigneeType === 'user' && !config.assigneeValue) return true
    if (config.assigneeType === 'department' && (!config.departmentId || !config.departmentMode)) return true
    if (config.assigneeType === 'business_field' && !config.fieldPath) return true
  }

  if (node.type === 'condition') {
    const conditions = node.properties?.conditions || []
    if (!conditions.length) return true
    if (conditions.some((condition) => !getConditionFlow(node.id, condition.id)?.targetNodeId)) return true
    if (!getDefaultFlow(node.id)?.targetNodeId) return false
  }

    if (node.type === 'cc') {
      const config = node.properties?.ccConfig || {}
      if (!config.assigneeType) return true
    if (config.assigneeType === 'user' && !config.assigneeValue) return true
    if (config.assigneeType === 'department' && (!config.departmentId || !config.departmentMode)) return true
    if (config.assigneeType === 'business_field' && !config.fieldPath) return true
  }

  if (node.type === 'form') {
    return !node.properties?.formId
  }

  return false
}

const getPreviewNodeSummary = (node) => {
  if (node.type === 'approval') {
    const config = node.properties?.approverConfig || {}
    if (config.assigneeType === 'business_field') {
      const fallback = config.assigneeEmptyFallbackFieldPath ? `，取空回退：${getBusinessFieldLabel(config.assigneeEmptyFallbackFieldPath)}` : ''
      return `业务字段：${getBusinessFieldLabel(config.fieldPath)}${fallback}`
    }
    if (config.assigneeType === 'department') {
      return `固定部门：${config.departmentMode === 'members' ? '部门成员' : '部门负责人'}${config.departmentId ? ` (${config.departmentId})` : ''}`
    }
    if (config.assigneeType === 'user') {
      return `固定人员${config.assigneeValue ? `：${config.assigneeValue}` : ''}`
    }
    return '审批人未配置'
  }

  if (node.type === 'condition') {
    const conditions = node.properties?.conditions || []
    if (!conditions.length) return '未配置条件'
    const conditionText = conditions.slice(0, 2).map(getConditionText).join('；')
    const defaultFlow = getDefaultFlow(node.id)
    const defaultTarget = defaultFlow?.targetNodeId ? getNodeDisplayName(defaultFlow.targetNodeId) : ''
    return `${conditionText}${defaultTarget ? `；默认分支 -> ${defaultTarget}` : '；默认分支未配置'}`
  }

  if (node.type === 'notification') {
    return `通知：${node.properties?.notificationType || 'system'}`
  }

  if (node.type === 'cc') {
    const config = node.properties?.ccConfig || {}
    if (config.assigneeType === 'business_field') {
      return `业务字段：${getBusinessFieldLabel(config.fieldPath)}`
    }
    if (config.assigneeType === 'department') {
      const fallback = config.assigneeEmptyFallbackFieldPath ? `，取空回退：${getBusinessFieldLabel(config.assigneeEmptyFallbackFieldPath)}` : ''
      return `固定部门：${config.departmentMode === 'members' ? '部门成员' : '部门负责人'}${config.departmentId ? ` (${config.departmentId})` : ''}${fallback}`
    }
    if (config.assigneeType === 'user') {
      return `固定人员${config.assigneeValue ? `：${config.assigneeValue}` : ''}`
    }
    return '抄送对象未配置'
  }

  if (node.type === 'delay') {
    return node.properties?.delayType === 'dynamic' ? '动态延时' : '固定延时'
  }

  if (node.type === 'form') {
    return node.properties?.formId ? `表单：${node.properties.formId}` : '表单未配置'
  }

  return ''
}

const getNodeSummary = (node) => {
  if (node.type === 'approval') {
    const config = node.properties?.approverConfig || {}
    if (config.assigneeType === 'business_field') {
      return `审批人来源：业务字段 ${getBusinessFieldLabel(config.fieldPath)}`
    }
    if (config.assigneeType === 'department') {
      return `审批人来源：固定部门 ${config.departmentId || '未配置'}（${config.departmentMode === 'members' ? '部门成员' : '部门负责人'}）`
    }
    if (config.assigneeType === 'user') {
      return `审批人来源：固定人员 ${config.assigneeValue || '未配置'}`
    }
    return '审批人配置未完成'
  }

  if (node.type === 'condition') {
    const conditionCount = node.properties?.conditions?.length || 0
    const hasDefault = !!getDefaultFlow(node.id)?.targetNodeId
    const conditions = (node.properties?.conditions || []).slice(0, 2).map(getConditionText).join('；')
    return `条件分支 ${conditionCount} 条，${hasDefault ? '已配置默认分支' : '未配置默认分支'}${conditions ? `：${conditions}` : ''}`
  }

  if (node.type === 'notification') {
    return `通知方式：${node.properties?.notificationType || 'system'}`
  }

    if (node.type === 'cc') {
      const config = node.properties?.ccConfig || {}
      if (config.assigneeType === 'business_field') {
      const fallback = config.assigneeEmptyFallbackFieldPath ? `，取空回退：${getBusinessFieldLabel(config.assigneeEmptyFallbackFieldPath)}` : ''
      return `抄送来源：业务字段 ${getBusinessFieldLabel(config.fieldPath)}${fallback}`
      }
      if (config.assigneeType === 'department') {
      const fallback = config.assigneeEmptyFallbackFieldPath ? `，取空回退：${getBusinessFieldLabel(config.assigneeEmptyFallbackFieldPath)}` : ''
      return `抄送来源：固定部门 ${config.departmentId || '未配置'}（${config.departmentMode === 'members' ? '部门成员' : '部门负责人'}）${fallback}`
      }
      if (config.assigneeType === 'user') {
      return `抄送来源：固定人员 ${config.assigneeValue || '未配置'}`
    }
    return '抄送对象配置未完成'
  }

  if (node.type === 'delay') {
    return `延时方式：${node.properties?.delayType === 'dynamic' ? '动态延时' : '固定延时'}`
  }

  if (node.type === 'form') {
    return `表单标识：${node.properties?.formId || '未配置'}`
  }

  return '无附加配置'
}

let nodeCounter = 1
let conditionCounter = 1

const generateConditionId = () => `cond_${Date.now()}_${conditionCounter++}`

const onDragStart = (event, node) => {
  event.dataTransfer.setData('nodeType', node.type)
  event.dataTransfer.setData('nodeName', node.name)
}

const onDrop = (event) => {
  const type = event.dataTransfer.getData('nodeType')
  const name = event.dataTransfer.getData('nodeName')
  if (!type) return

  // 获取 canvas-content 或使用 canvas 本身（当没有节点时只有 hint）
  const { x, y } = getCanvasPoint(event.clientX, event.clientY)

  const newNode = {
    id: `node_${type}_${nodeCounter++}`,
    name: name || type,
    type,
    x: Math.max(50, x),
    y: Math.max(50, y),
    properties: getDefaultProperties(type),
  }

  nodes.value.push(newNode)
  selectNode(newNode)
  
  // 延迟更新节点尺寸
  nextTick(() => updateNodeSizeCache())
}

// 更新节点尺寸缓存
const updateNodeSizeCache = () => {
  if (!canvasRef.value) return
  const nodeElements = canvasRef.value.querySelectorAll('.canvas-node')
  nodeElements.forEach((el) => {
    const nodeId = el.getAttribute('data-node-id')
    if (nodeId) {
      const rect = el.getBoundingClientRect()
      nodeSizeCache[nodeId] = { width: rect.width, height: rect.height }
    }
  })
}

const getDefaultProperties = (type) => {
  const defaults = {
    start: {},
    end: {},
    approval: {
      approverConfig: {
        assigneeType: 'business_field',
        assigneeValue: '',
        departmentId: '',
        departmentMode: 'leader',
        fieldPath: '',
        businessType: businessType.value,
        assigneeEmptyAction: 'error',
        assigneeEmptyFallbackUserId: '',
        assigneeEmptyFallbackFieldPath: '',
        multiInstanceType: 'sequential',
      },
      allowRollback: true,
    },
    condition: {
      conditions: [],
    },
    notification: {
      notificationType: 'system',
      notificationReceivers: '',
      notificationTemplate: '',
    },
    cc: {
      ccConfig: {
        assigneeType: 'business_field',
        assigneeValue: '',
        departmentId: '',
        departmentMode: 'leader',
        fieldPath: '',
        businessType: businessType.value,
        assigneeEmptyAction: 'error',
        assigneeEmptyFallbackUserId: '',
        assigneeEmptyFallbackFieldPath: '',
        multiInstanceType: 'parallel',
      },
    },
    delay: {
      delayType: 'fixed',
      delayValue: 3600000,
    },
    form: {
      formId: '',
      formFields: [],
    },
  }
  return defaults[type] || {}
}

const selectNode = (node) => {
  selectedNodeId.value = node.id
  selectedFlowId.value = '' // 取消连线选中
  activeTab.value = 'node' // 切换到节点属性标签页
}

// ========== 连接线拖拽相关 ==========

// 锚点鼠标按下，开始连线
const onAnchorMouseDown = (event, nodeId, position) => {
  event.stopPropagation()
  event.preventDefault()
  
  connecting.value = true
  connectSource.value = { nodeId, position }
  
  // 初始化临时连线终点
  const anchor = getAnchorPoint(nodeId, position)
  tempLineEnd.value = { x: anchor.x, y: anchor.y }
  
  // 监听鼠标移动和释放
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// ========== 工具函数 ==========

// 节流函数
const throttle = (fn, delay) => {
  let lastTime = 0
  return (...args) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    }
  }
}

// 鼠标移动（连线中）- 带节流
const onMouseMove = throttle((event) => {
  if (!connecting.value || !canvasRef.value) return

  tempLineEnd.value = getCanvasPoint(event.clientX, event.clientY)
  
  // 检测是否悬停在某个锚点上（带节流）
  updateHoveredAnchor(event)
}, 16)

// 更新悬停的锚点（带节流）
const updateHoveredAnchor = throttle((event) => {
  if (!canvasRef.value) return
  const { x: mouseX, y: mouseY } = getCanvasPoint(event.clientX, event.clientY)
  
  hoveredAnchor.value = null
  
  for (const node of nodes.value) {
    if (node.id === connectSource.value?.nodeId) continue // 跳过源节点
    
    const anchors = getNodeAnchors(node)
    for (const anchor of anchors) {
      const dist = Math.sqrt(
        Math.pow(mouseX - anchor.x, 2) + Math.pow(mouseY - anchor.y, 2)
      )
      if (dist < 15) { // 15px 范围内触发
        hoveredAnchor.value = { nodeId: node.id, position: anchor.position }
        break
      }
    }
    if (hoveredAnchor.value) break
  }
}, 16) // ~60fps

// 鼠标释放（结束连线）
const onMouseUp = (event) => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  
  if (connecting.value) {
    // 直接在 mouseup 时检测目标锚点（不依赖节流后的 hoveredAnchor）
    const target = findAnchorAtPoint(event.clientX, event.clientY)
    if (target) {
      createFlow(connectSource.value, target)
    } else {
      ElMessage.info('请将连线连接到其他节点的锚点')
    }
  }
  
  connecting.value = false
  connectSource.value = null
  tempLineEnd.value = { x: 0, y: 0 }
  hoveredAnchor.value = null
}

// 直接检测鼠标位置下的锚点
const findAnchorAtPoint = (clientX, clientY) => {
  if (!canvasRef.value) return null
  const { x: mouseX, y: mouseY } = getCanvasPoint(clientX, clientY)
  
  for (const node of nodes.value) {
    if (node.id === connectSource.value?.nodeId) continue
    
    const anchors = getNodeAnchors(node)
    for (const anchor of anchors) {
      const dist = Math.sqrt(
        Math.pow(mouseX - anchor.x, 2) + Math.pow(mouseY - anchor.y, 2)
      )
      if (dist < 20) { // 20px 范围内触发
        return { nodeId: node.id, position: anchor.position }
      }
    }
  }
  return null
}

// 查找最近的锚点（用于连线端点拖动）
const findNearestAnchor = (x, y, excludeFlowId) => {
  let nearest = null
  let minDist = 30 // 30px 范围内吸附
  
  for (const node of nodes.value) {
    const anchors = getNodeAnchors(node)
    for (const anchor of anchors) {
      const dist = Math.sqrt(Math.pow(x - anchor.x, 2) + Math.pow(y - anchor.y, 2))
      if (dist < minDist) {
        minDist = dist
        nearest = { nodeId: node.id, position: anchor.position }
      }
    }
  }
  
  return nearest
}

// 创建连线
const createFlow = (source, target) => {
  const sourceNode = nodes.value.find((node) => node.id === source.nodeId)
  const isConditionSource = sourceNode?.type === 'condition'
  const flowType = isConditionSource ? 'condition' : 'normal'
  const error = getInvalidConnectionReason(source, target, flowType)
  if (error) {
    ElMessage.warning(error)
    return
  }

  const flow = {
    id: `flow_${source.nodeId}_${target.nodeId}_${Date.now()}`,
    sourceNodeId: source.nodeId,
    targetNodeId: target.nodeId,
    sourceAnchor: source.position,
    targetAnchor: target.position,
    flowType,
  }

  if (isConditionSource) {
    if (!sourceNode.properties.conditions) {
      sourceNode.properties.conditions = []
    }
    const conditionId = generateConditionId()
    sourceNode.properties.conditions.push({
      id: conditionId,
      fieldSource: 'field',
      field: [],
      operator: 'eq',
      value: '',
    })
    flow.conditionId = conditionId
  }

  flows.value.push(flow)
}

// 删除连线
const deleteFlow = async (flowId) => {
  const flow = flows.value.find((item) => item.id === flowId)
  if (!flow) return

  const confirmed = await ElMessageBox.confirm(
    `确定删除连线「${getNodeDisplayName(flow.sourceNodeId)} -> ${getNodeDisplayName(flow.targetNodeId)}」吗？`,
    '删除连线',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(() => true).catch(() => false)

  if (!confirmed) return

  flows.value = flows.value.filter(f => f.id !== flowId)
  if (flow.conditionId) {
    const ownerNode = nodes.value.find((node) => node.type === 'condition' && (node.properties?.conditions || []).some((item) => item.id === flow.conditionId))
    if (ownerNode) {
      ownerNode.properties.conditions = ownerNode.properties.conditions.filter((item) => item.id !== flow.conditionId)
    }
  }
  if (selectedFlowId.value === flowId) {
    selectedFlowId.value = ''
  }

}

// 选中连线
const onFlowClick = (flow, event) => {
  event.stopPropagation()
  selectedFlowId.value = flow.id
  selectedNodeId.value = '' // 取消节点选中
  activeTab.value = 'flow'
}

const updateSelectedFlowTarget = (targetNodeId) => {
  if (!selectedFlow.value) return
  const flow = flows.value.find((item) => item.id === selectedFlow.value.id)
  if (!flow) return
  flow.targetNodeId = targetNodeId || ''
}

// 开始拖动连接线端点 - 需要先选中该连接线
const onFlowEndpointMouseDown = (event, flow, endpoint) => {
  event.preventDefault()
  event.stopPropagation()
  
  // 只有当该连接线已被选中时才允许拖动端点
  if (selectedFlowId.value !== flow.id) {
    selectedFlowId.value = flow.id
    return
  }
  
  draggingFlowEndpoint.value = { flow, endpoint }
  
  const anchor = endpoint === 'source' 
    ? getAnchorPoint(flow.sourceNodeId, flow.sourceAnchor || 'right')
    : getAnchorPoint(flow.targetNodeId, flow.targetAnchor || 'left')
  const point = getCanvasPoint(event.clientX, event.clientY)
  
  flowEndpointOffset.x = point.x - anchor.x
  flowEndpointOffset.y = point.y - anchor.y
  
  document.addEventListener('mousemove', onFlowEndpointMouseMove)
  document.addEventListener('mouseup', onFlowEndpointMouseUp)
}

// 拖动连接线端点中
const onFlowEndpointMouseMove = (event) => {
  if (!draggingFlowEndpoint.value || !canvasRef.value) return
  const point = getCanvasPoint(event.clientX, event.clientY)
  const mouseX = point.x - flowEndpointOffset.x
  const mouseY = point.y - flowEndpointOffset.y
  
  const nearest = findNearestAnchor(mouseX, mouseY, draggingFlowEndpoint.value.flow.id)
  
  if (nearest) {
    const { flow, endpoint } = draggingFlowEndpoint.value
    // 通过数组索引更新以确保响应式
    const flowIndex = flows.value.findIndex(f => f.id === flow.id)
    if (flowIndex !== -1) {
      const updatedFlow = { ...flows.value[flowIndex] }
      if (endpoint === 'source') {
        updatedFlow.sourceNodeId = nearest.nodeId
        updatedFlow.sourceAnchor = nearest.position
      } else {
        updatedFlow.targetNodeId = nearest.nodeId
        updatedFlow.targetAnchor = nearest.position
      }
      flows.value[flowIndex] = updatedFlow
      // 更新 draggingFlowEndpoint 的引用
      draggingFlowEndpoint.value.flow = updatedFlow
    }
  }
}

// 结束拖动连接线端点
const onFlowEndpointMouseUp = () => {
  document.removeEventListener('mousemove', onFlowEndpointMouseMove)
  document.removeEventListener('mouseup', onFlowEndpointMouseUp)
  draggingFlowEndpoint.value = null
}

// 按键删除
const onKeyDown = (event) => {
  if (event.key === 'Delete' && selectedFlowId.value) {
    deleteFlow(selectedFlowId.value)
  }
  if (event.key === 'Escape') {
    connecting.value = false
    connectSource.value = null
    tempLineEnd.value = { x: 0, y: 0 }
    hoveredAnchor.value = null
    selectedFlowId.value = ''
  }
}

// 节点拖拽
const draggingNode = ref(null)
const dragOffset = reactive({ x: 0, y: 0 })

const onNodeMouseDown = (event, node) => {
  if (event.button !== 0) return // 只响应左键
  const target = event.target
  if (target?.closest?.('.anchor')) return
  
  draggingNode.value = node
  
  // 使用 currentTarget 确保获取的是节点本身的 rect
  const nodeElement = event.currentTarget
  const nodeRect = nodeElement.getBoundingClientRect()
  
  // 计算鼠标相对于节点内部的偏移
  dragOffset.x = event.clientX - nodeRect.left
  dragOffset.y = event.clientY - nodeRect.top
  
  document.addEventListener('mousemove', onNodeMouseMove)
  document.addEventListener('mouseup', onNodeMouseUp)
}

const onNodeMouseMove = (event) => {
  if (!draggingNode.value || !canvasRef.value) return
  const point = getCanvasPoint(event.clientX, event.clientY)
  const x = point.x - dragOffset.x
  const y = point.y - dragOffset.y
  
  draggingNode.value.x = Math.max(0, x)
  draggingNode.value.y = Math.max(0, y)
  
  // 更新拖动节点的尺寸缓存
  updateDraggingNodeSizeCache()
}

// 更新拖动节点的尺寸缓存
const updateDraggingNodeSizeCache = () => {
  if (!draggingNode.value || !canvasRef.value) return

  const nodeElement = canvasRef.value.querySelector(`.canvas-node[data-node-id="${draggingNode.value.id}"]`)
  if (nodeElement) {
    const rect = nodeElement.getBoundingClientRect()
    nodeSizeCache[draggingNode.value.id] = { width: rect.width, height: rect.height }
  }
}

const onNodeMouseUp = () => {
  draggingNode.value = null
  document.removeEventListener('mousemove', onNodeMouseMove)
  document.removeEventListener('mouseup', onNodeMouseUp)
}

const removeNode = async () => {
  if (!selectedNodeId.value) return
  const currentNodeId = selectedNodeId.value
  const currentNodeName = getNodeDisplayName(currentNodeId)
  const relatedFlows = flows.value.filter(
    f => f.sourceNodeId === currentNodeId || f.targetNodeId === currentNodeId
  )

  const confirmed = await ElMessageBox.confirm(
    `确定删除节点「${currentNodeName}」吗？将同时删除 ${relatedFlows.length} 条相关连线。`,
    '删除节点',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(() => true).catch(() => false)

  if (!confirmed || selectedNodeId.value !== currentNodeId) return

  nodes.value = nodes.value.filter(n => n.id !== selectedNodeId.value)
  flows.value = flows.value.filter(
    f => f.sourceNodeId !== selectedNodeId.value && f.targetNodeId !== selectedNodeId.value
  )
  selectedNodeId.value = ''
}

const removeCondition = (index) => {
  if (!selectedNode.value) return

  const [removed] = selectedNode.value.properties.conditions.splice(index, 1)
  if (!removed) return

  const removedFlow = flows.value.find(f => (f.flowType === 'condition' || f.flowType === 'default') && f.conditionId === removed.id)
  flows.value = flows.value.filter(f => f.id !== removedFlow?.id)
}

const moveCondition = (index, direction) => {
  if (!selectedNode.value) return
  const conditions = selectedNode.value.properties.conditions || []
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= conditions.length) return
  const [current] = conditions.splice(index, 1)
  conditions.splice(targetIndex, 0, current)
}

const setDefaultConditionFlow = (flowId) => {
  if (!selectedNode.value || !flowId) return
  const currentNodeId = selectedNode.value.id
  flows.value = flows.value.map((flow) => {
    if (flow.sourceNodeId !== currentNodeId) return flow
    if (flow.id === flowId) {
      return { ...flow, flowType: 'default' }
    }
    if (flow.flowType === 'default') {
      return { ...flow, flowType: 'condition' }
    }
    return flow
  })
}

const normalizeLoadedData = (data) => {
  nodes.value = (data.nodes || []).map((node) => {
    if (node.type === 'approval') {
      node.properties = {
        approverConfig: {
          assigneeType: 'business_field',
          assigneeValue: '',
          departmentId: '',
          departmentMode: 'leader',
          fieldPath: '',
          businessType: businessType.value,
          assigneeEmptyAction: 'error',
          assigneeEmptyFallbackUserId: '',
          assigneeEmptyFallbackFieldPath: '',
          multiInstanceType: 'sequential',
          ...(node.properties?.approverConfig || {}),
        },
        allowRollback: true,
        ...node.properties,
      }
    }

    if (node.type === 'condition') {
      node.properties = {
        conditions: [],
        ...node.properties,
      }
      node.properties.conditions = (node.properties.conditions || []).map((condition) => ({
        id: condition.id || generateConditionId(),
        fieldSource: 'field',
        field: [],
        operator: 'eq',
        value: '',
        ...condition,
      }))
    }

    if (node.type === 'cc') {
      node.properties = {
        ccConfig: {
          assigneeType: 'business_field',
          assigneeValue: '',
          departmentId: '',
          departmentMode: 'leader',
          fieldPath: '',
          businessType: businessType.value,
          assigneeEmptyAction: 'error',
          assigneeEmptyFallbackUserId: '',
          assigneeEmptyFallbackFieldPath: '',
          multiInstanceType: 'parallel',
          ...(node.properties?.ccConfig || {}),
        },
        ...node.properties,
      }
    }

    return node
  })

  flows.value = (data.flows || []).map((flow) => ({
    ...flow,
    flowType: flow.flowType,
    conditionId: flow.conditionId || '',
  }))

  nodes.value.forEach((node) => {
    if (node.type !== 'condition') return

    const conditions = node.properties?.conditions || []
    conditions.forEach((condition) => {
      if (getConditionFlow(node.id, condition.id)) return
    })
  })
}

const onBusinessTypeChange = () => {
  if (!currentBusinessSceneOptions.value.some((item) => item.value === businessScene.value)) {
    businessScene.value = currentBusinessSceneOptions.value[0]?.value || ''
  }
  triggerEvent.value = ''
}

const zoomIn = () => {
  zoom.value = Math.min(2, Number((zoom.value + 0.1).toFixed(1)))
}

const zoomOut = () => {
  zoom.value = Math.max(0.5, Number((zoom.value - 0.1).toFixed(1)))
}

const resetViewport = () => {
  zoom.value = 1
}

const fitCanvas = () => {
  const canvasEl = canvasRef.value
  if (!canvasEl) return
  const availableWidth = canvasEl.clientWidth - 40
  const availableHeight = canvasEl.clientHeight - 40
  const scaleX = availableWidth / canvasWidth.value
  const scaleY = availableHeight / canvasHeight.value
  zoom.value = Math.max(0.5, Math.min(1.2, Number(Math.min(scaleX, scaleY).toFixed(2))))
}

const validateWorkflowDefinition = () => {
  if (validationIssues.value.length) {
    ElMessage.warning(`当前流程还有 ${validationIssues.value.length} 项问题待处理`)
    return false
  }

  return true
}

const buildSubmitNodes = () => {
  return nodes.value.map((node) => {
    if (node.type === 'condition') {
      return {
        ...node,
        properties: {
          ...node.properties,
          conditions: (node.properties.conditions || []).map((condition) => ({
            ...condition,
          })),
        },
      }
    }

    if (node.type === 'cc') {
      const restProperties = node.properties || {}
      return {
        ...node,
        properties: {
          ...restProperties,
          ccConfig: {
            assigneeType: 'business_field',
            assigneeValue: '',
            departmentId: '',
            departmentMode: 'leader',
            fieldPath: '',
            businessType: businessType.value,
            assigneeEmptyAction: 'error',
            assigneeEmptyFallbackUserId: '',
            assigneeEmptyFallbackFieldPath: '',
            multiInstanceType: 'parallel',
            ...(restProperties.ccConfig || {}),
          },
        },
      }
    }

    return node
  })
}

const buildSubmitFlows = () => {
  return flows.value.map((flow) => ({
    id: flow.id,
    sourceNodeId: flow.sourceNodeId,
    targetNodeId: flow.targetNodeId,
    sourceAnchor: flow.sourceAnchor,
    targetAnchor: flow.targetAnchor,
    flowType: flow.flowType || 'normal',
    conditionId: flow.conditionId || '',
  }))
}

// ========== 连线验证函数 ==========

const hasCycle = () => {
  const visited = new Set()
  const recStack = new Set()
  
  const dfs = (nodeId) => {
    visited.add(nodeId)
    recStack.add(nodeId)
    
    const outgoingFlows = flows.value.filter(f => f.sourceNodeId === nodeId && f.targetNodeId)
    for (const flow of outgoingFlows) {
      if (!visited.has(flow.targetNodeId)) {
        if (dfs(flow.targetNodeId)) return true
      } else if (recStack.has(flow.targetNodeId)) {
        return true
      }
    }
    
    recStack.delete(nodeId)
    return false
  }
  
  for (const node of nodes.value) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }
  return false
}

const hasOrphanNodes = () => {
  const startNodes = nodes.value.filter(n => n.type === 'start')
  const endNodes = nodes.value.filter(n => n.type === 'end')
  
  for (const node of startNodes) {
    const hasOutgoing = flows.value.some(f => f.sourceNodeId === node.id && f.targetNodeId)
    if (!hasOutgoing) return true
  }
  
  for (const node of endNodes) {
    const hasIncoming = flows.value.some(f => f.targetNodeId === node.id)
    if (!hasIncoming) return true
  }
  
  return false
}

const handleSave = async () => {
  if (!canWorkflowDefinitionSave.value) {
    ElMessage.warning('当前操作没有权限')
    return
  }
  if (!validateWorkflowDefinition()) return

  saving.value = true
  try {
    // 自动生成流程编码（如果为空）
    if (!workflowCode.value) {
      workflowCode.value = 'WF_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
    }
    
    const data = {
      name: workflowName.value,
      code: workflowCode.value,
      category: workflowCategory.value,
      description: workflowDescription.value,
      businessType: businessType.value,
      businessScene: businessScene.value,
      triggerEvent: triggerEvent.value,
      nodes: buildSubmitNodes(),
      flows: buildSubmitFlows(),
    }

    if (selectedDefinitionId.value) {
      await api.updateWorkflowDefinition(selectedDefinitionId.value, data)
    } else {
      const res = await api.createWorkflowDefinition(data)
      selectedDefinitionId.value = res.data?.id || ''
    }

    ElMessage.success('保存成功')
  } catch (error) {
    const message = error.response?.data?.message || error.message || '保存失败'
    ElMessage.error(message)
    console.error('Workflow Save Error:', error)
  } finally {
    saving.value = false
  }
}

const handleSaveAndPublish = async () => {
  if (!canWorkflowDefinitionPublish.value) {
    ElMessage.warning('当前操作没有权限')
    return
  }
  if (!workflowCode.value) {
    ElMessage.warning('请填写流程名称和编码')
    return
  }
  if (!validateWorkflowDefinition()) return

  publishing.value = true
  try {
    const data = {
      name: workflowName.value,
      code: workflowCode.value,
      category: workflowCategory.value,
      description: workflowDescription.value,
      businessType: businessType.value,
      businessScene: businessScene.value,
      triggerEvent: triggerEvent.value,
      nodes: buildSubmitNodes(),
      flows: buildSubmitFlows(),
    }

    let definitionId = selectedDefinitionId.value
    
    if (definitionId) {
      await api.updateWorkflowDefinition(definitionId, data)
    } else {
      const res = await api.createWorkflowDefinition(data)
      definitionId = res.data?.id || ''
    }

    await api.publishWorkflowDefinition(definitionId)
    
    ElMessage.success('保存并发布成功')
    selectedDefinitionId.value = definitionId
    loadDefinitions()
  } catch (error) {
    const message = error.response?.data?.message || error.message || '发布失败'
    ElMessage.error(message)
  } finally {
    publishing.value = false
  }
}

const handlePreview = () => {
  previewVisible.value = true
}

const handleReset = () => {
  ElMessageBox.confirm('确定要重置吗？当前未保存的内容将会丢失。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    workflowName.value = ''
    workflowCode.value = ''
    workflowCategory.value = ''
    workflowDescription.value = ''
    businessType.value = ''
    businessScene.value = ''
    triggerEvent.value = ''
    nodes.value = []
    flows.value = []
    selectedDefinitionId.value = ''
    selectedNodeId.value = ''
    ElMessage.success('已重置')
  }).catch(() => {})
}

const loadDefinition = async (id) => {
  if (!id) return
  try {
    const res = await api.getWorkflowDefinition(id)
    const data = res.data
    workflowName.value = data.name
    workflowCode.value = data.code
    workflowCategory.value = data.category || ''
    workflowDescription.value = data.description || ''
    businessType.value = data.businessType || ''
    businessScene.value = data.businessScene || ''
    triggerEvent.value = data.triggerEvent || ''
    normalizeLoadedData(data)
    
    // 更新节点尺寸缓存
    nextTick(() => updateNodeSizeCache())
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const loadDefinitions = async () => {
  try {
    const res = await api.getWorkflowDefinitions()
    definitions.value = res.list || []
  } catch (error) {
    console.error('加载流程列表失败', error)
  }
}

onMounted(() => {
  loadDefinitions()

  // 检查URL参数
  const urlParams = new URLSearchParams(window.location.search)
  const id = urlParams.get('id')
  if (id) {
    selectedDefinitionId.value = id
    loadDefinition(id)
  }
  
  // 添加键盘事件监听
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
})

// 画布点击（取消选中）
const onCanvasClick = () => {
  selectedNodeId.value = ''
  selectedFlowId.value = ''
}
</script>

<style scoped>
.workflow-designer {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: #f5f5f5;
}

.designer-toolbar {
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
}

.designer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.designer-palette {
  width: 200px;
  background: #fff;
  padding: 10px;
  overflow-y: auto;
  border-right: 1px solid #ddd;
}

.panel-title {
  font-weight: bold;
  font-size: 14px;
  margin: 15px 0 10px;
  color: #666;
}

.palette-node {
  padding: 10px;
  margin: 5px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
  background: #fff;
}

.palette-node:hover {
  background: #f5f5f5;
  border-color: #409eff;
}

.palette-node.approval-node {
  border-left: 3px solid #409eff;
}

.node-icon {
  margin-right: 8px;
  font-size: 16px;
}

.designer-canvas {
  flex: 1;
  padding: 20px;
  overflow: auto;
  position: relative;
}

.canvas-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}

.canvas-content {
  position: relative;
  min-width: 800px;
  min-height: 600px;
}

.flow-lines {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  z-index: 0;
  overflow: visible;
}

.canvas-node {
  position: absolute;
  padding: 15px 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  min-width: 120px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.canvas-node:hover {
  border-color: #409eff;
}

.canvas-node.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
}

.canvas-node.node-start,
.canvas-node.node-end {
  background: #ecf5ff;
  border-color: #409eff;
}

.canvas-node.node-approval {
  background: #f0f9eb;
  border-color: #67c23a;
}

.canvas-node.node-condition {
  background: #fef0f0;
  border-color: #f56c6c;
}

.canvas-node .node-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.canvas-node .node-name {
  font-weight: bold;
  margin-bottom: 3px;
}

.canvas-node .node-type {
  font-size: 12px;
  color: #999;
}

/* 连接点样式 */
.anchor {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid #409eff;
  border-radius: 50%;
  cursor: crosshair;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s, background-color 0.2s;
  z-index: 10;
}

.canvas-node:hover .anchor {
  opacity: 0.5;
}

.anchor-connectable {
  opacity: 0.4 !important;
  border-color: #67c23a;
}

.anchor:hover,
.anchor-active {
  opacity: 1 !important;
  transform: scale(1.4);
  background-color: #409eff;
}

.anchor-top {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.anchor-top:hover,
.anchor-top.anchor-active {
  transform: translateX(-50%) scale(1.4);
}

.anchor-bottom {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.anchor-bottom:hover,
.anchor-bottom.anchor-active {
  transform: translateX(-50%) scale(1.4);
}

.anchor-left {
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
}

.anchor-left:hover,
.anchor-left.anchor-active {
  transform: translateY(-50%) scale(1.4);
}

.anchor-right {
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
}

.anchor-right:hover,
.anchor-right.anchor-active {
  transform: translateY(-50%) scale(1.4);
}

/* 连线样式 */
.flow-path {
  cursor: pointer;
}

.flow-path:hover {
  stroke-width: 3;
}

.flow-path.selected {
  stroke-dasharray: none;
  stroke-width: 3;
  filter: drop-shadow(0 0 3px rgba(64, 158, 255, 0.5));
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

/* 连接线端点样式 */
.flow-endpoint {
  cursor: move;
  transition: r 0.15s, filter 0.15s;
}

.flow-endpoint:hover {
  filter: drop-shadow(0 0 4px rgba(64, 158, 255, 0.8));
}

.designer-properties {
  width: 320px;
  background: #fff;
  border-left: 1px solid #ddd;
  padding: 10px;
  overflow-y: auto;
}

.issue-panel {
  margin-bottom: 12px;
  padding: 12px;
  background: #fff7e6;
  border: 1px solid #f5dab1;
  border-radius: 8px;
}

.issue-panel-title {
  margin-bottom: 8px;
  color: #e6a23c;
  font-weight: 600;
}

.issue-item {
  padding: 8px 0;
  border-top: 1px dashed #f2d3a2;
}

.issue-item:first-child {
  border-top: none;
  padding-top: 0;
}

.issue-item-title {
  color: #303133;
  font-size: 13px;
  line-height: 1.5;
}

.issue-item-meta {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

.condition-list {
  padding: 10px 0;
}

.condition-item {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.condition-hint {
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.condition-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.condition-label {
  font-weight: bold;
  color: #e6a23c;
}

.condition-target {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: #666;
  font-size: 12px;
}

.default-branch {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 12px;
}

.flow-hint {
  margin-top: 6px;
  color: #e67e22;
  font-size: 12px;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow: auto;
}

.summary-card {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.summary-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
}

.summary-content {
  color: #606266;
  line-height: 1.6;
  font-size: 13px;
}

/* 流程预览样式 */
.flow-preview {
  min-height: 400px;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
  overflow: auto;
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

.flow-hint {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
</style>
