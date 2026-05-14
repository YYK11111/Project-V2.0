import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readDesignerSource() {
  return readFileSync(resolve(__dirname, 'designer.vue'), 'utf-8')
}

describe('workflow 设计器契约守卫', () => {
  it('业务对象覆盖上线单、验收单和运维交接单', () => {
    const source = readDesignerSource()

    expect(source).toContain('<el-option label="上线单" value="goLive" />')
    expect(source).toContain('<el-option label="验收单" value="acceptance" />')
    expect(source).toContain('<el-option label="运维交接单" value="handover" />')
    expect(source).toContain("goLive: [{ label: '上线审批', value: 'approval' }]")
    expect(source).toContain("acceptance: [{ label: '验收审批', value: 'approval' }]")
    expect(source).toContain("handover: [{ label: '运维交接审批', value: 'approval' }]")
  })

  it('保存校验只阻断 error，不阻断 warning', () => {
    const source = readDesignerSource()

    expect(source).toContain('const blockingIssues = computed(() => validationIssues.value.filter((issue) => issue.level === \'error\'))')
    expect(source).toContain('if (blockingIssues.value.length)')
    expect(source).toContain('当前流程还有 ${blockingIssues.value.length} 项错误待处理')
  })

  it('通知节点未配置接收人时只提示 warning', () => {
    const source = readDesignerSource()

    expect(source).toContain("issues.push({ type: 'notification', level: 'warning', message: '通知对象来源未配置，运行时将跳过通知'")
    expect(source).toContain("issues.push({ type: 'notification', level: 'warning', message: '固定人员未选择，运行时将跳过通知'")
    expect(source).toContain("issues.push({ type: 'notification', level: 'warning', message: '固定部门配置不完整，运行时将跳过通知'")
    expect(source).toContain("issues.push({ type: 'notification', level: 'warning', message: '业务字段未选择，运行时将跳过通知'")
  })

  it('新建流程保存并发布前会自动生成编码', () => {
    const source = readDesignerSource()

    expect(source).toContain('ensureWorkflowCode()')
    expect(source).not.toContain("ElMessage.warning('请填写流程名称和编码')")
  })

  it('条件分支禁止拖动源端以避免 conditionId 脏数据', () => {
    const source = readDesignerSource()

    expect(source).toContain("if (endpoint === 'source' && (flow.flowType === 'condition' || flow.flowType === 'default'))")
    expect(source).toContain("ElMessage.warning('条件分支不能拖动源端，请删除后从条件节点重新连线')")
  })

  it('问题面板区分错误和警告并优先展示错误', () => {
    const source = readDesignerSource()

    expect(source).toContain('错误 {{ errorIssues.length }} / 警告 {{ warningIssues.length }}')
    expect(source).toContain('const errorIssues = computed(() => validationIssues.value.filter((issue) => issue.level === \'error\'))')
    expect(source).toContain('const warningIssues = computed(() => validationIssues.value.filter((issue) => issue.level === \'warning\'))')
    expect(source).toContain('const sortedValidationIssues = computed(() => [')
    expect(source).toContain('...errorIssues.value')
    expect(source).toContain('...warningIssues.value')
  })

  it('删除节点和连线后支持最近一步撤销', () => {
    const source = readDesignerSource()

    expect(source).toContain('const undoAction = ref(null)')
    expect(source).toContain('recordUndoAction({')
    expect(source).toContain('const undoLastAction = () => {')
    expect(source).toContain('@click="undoLastAction"')
    expect(source).toContain('撤销')
  })

  it('删除条件分支连线只记录一次撤销并保留条件配置', () => {
    const source = readDesignerSource()
    const deleteFlowBlock = source.match(/const deleteFlow = async \(flowId\) => \{[\s\S]*?\/\/ 选中连线/)?.[0] || ''

    expect(deleteFlowBlock).toContain('let undoPayload = {')
    expect(deleteFlowBlock).toContain('recordUndoAction(undoPayload)')
    expect(deleteFlowBlock.match(/recordUndoAction\(/g)).toHaveLength(1)
    expect(source).toContain('ownerNode.properties.conditions = [')
    expect(source).toContain('action.condition')
  })

  it('条件节点支持手动新增条件并用按钮设置默认分支', () => {
    const source = readDesignerSource()

    expect(source).toContain('@click="addCondition(selectedNode)"')
    expect(source).toContain('const addCondition = (node = selectedNode.value) => {')
    expect(source).toContain('@click="setDefaultConditionFlow(getConditionFlow(selectedNode.id, cond.id)?.id)"')
    expect(source).toContain('设为默认')
  })

  it('连接线拖拽过程展示当前非法原因', () => {
    const source = readDesignerSource()

    expect(source).toContain('const connectionHint = ref(\'\')')
    expect(source).toContain('connectionHint.value = error || \'释放鼠标创建连线\'')
    expect(source).toContain('class="connection-hint"')
  })

  it('提供流程模板、节点搜索折叠和业务对象变更确认', () => {
    const source = readDesignerSource()

    expect(source).toContain('workflowTemplates')
    expect(source).toContain('applyWorkflowTemplate')
    expect(source).toContain('项目立项模板')
    expect(source).toContain('任务审批模板')
    expect(source).toContain('上线审批模板')
    expect(source).toContain('验收审批模板')
    expect(source).toContain('nodeSearchKeyword')
    expect(source).toContain('paletteCollapse')
    expect(source).toContain('ElMessageBox.confirm(\'切换业务对象会影响审批人、通知对象和条件字段配置')
  })

  it('画布增强保留缩放和当前节点居中并移除小地图入口', () => {
    const source = readDesignerSource()

    expect(source).toContain('{{ Math.round(zoom * 100) }}%')
    expect(source).toContain('@click="centerSelectedNode"')
    expect(source).toContain('const centerSelectedNode = () => {')
    expect(source).not.toContain('class="canvas-minimap"')
    expect(source).not.toContain('minimapViewportStyle')
    expect(source).not.toContain('getMinimapNodeStyle')
    expect(source).not.toContain('小地图')
  })

  it('画布节点只显示图标和节点名称并使用长方形布局', () => {
    const source = readDesignerSource()

    expect(source).toContain('<div class="node-icon">{{ getNodeIcon(node.type) }}</div>')
    expect(source).toContain('<div class="node-name">{{ node.name }}</div>')
    expect(source).not.toContain('<div class="node-type">{{ getNodeTypeName(node.type) }}</div>')
    expect(source).not.toContain('<div v-if="getCanvasNodeSummary(node)" class="node-summary">{{ getCanvasNodeSummary(node) }}</div>')
    expect(source).toContain('width: 180px;')
    expect(source).toContain('height: 56px;')
    expect(source).toContain('display: flex;')
    expect(source).toContain('align-items: center;')
    expect(source).toContain('gap: 10px;')
  })

  it('拖拽生成节点时以鼠标落点为中心定位', () => {
    const source = readDesignerSource()

    expect(source).toContain('<div class="canvas-content" :style="canvasContentStyle" @click="onCanvasClick">')
    expect(source).not.toContain('<div class="canvas-content" v-else')
    expect(source).toContain('const getDropNodePosition = (event) => {')
    expect(source).toContain('point.x - NODE_WIDTH / 2')
    expect(source).toContain('point.y - NODE_HEIGHT / 2')
    expect(source).toContain('const { x, y } = getDropNodePosition(event)')
  })

  it('开始和结束节点每个流程只允许拖入一个', () => {
    const source = readDesignerSource()

    expect(source).toContain('const getSingleNodeDropWarning = (type) => {')
    expect(source).toContain("const singleNodeNames = { start: '开始节点', end: '结束节点' }")
    expect(source).toContain('if (!singleNodeNames[type]) return \'\'')
    expect(source).toContain('nodes.value.some((node) => node.type === type)')
    expect(source).toContain('ElMessage.warning(dropWarning)')
    expect(source).toContain('if (dropWarning) {')
    expect(source).toContain('return\n  }')
  })

  it('线条标签位置按同向连线错开', () => {
    const source = readDesignerSource()

    expect(source).toContain('const sameDirectionIndex = flows.value')
    expect(source).toContain('y: (start.y + end.y) / 2 - 8 - sameDirectionIndex * 18')
  })

  it('发布前展示差异摘要并移除流程选择筛选', () => {
    const source = readDesignerSource()

    expect(source).not.toContain('definitionFilterBusinessType')
    expect(source).not.toContain('filteredDefinitions')
    expect(source).not.toContain('placeholder="筛选业务"')
    expect(source).not.toContain('placeholder="选择流程"')
    expect(source).not.toContain('loadDefinitions()')
    expect(source).not.toContain('const loadDefinitions = async () => {')
    expect(source).toContain('showPublishDiffConfirm')
    expect(source).toContain('const buildPublishDiffSummary = () => {')
    expect(source).toContain('发布前差异确认')
  })

  it('顶部展示发布状态和未发布改动状态', () => {
    const source = readDesignerSource()

    expect(source).toContain('class="definition-state"')
    expect(source).toContain('currentDefinitionStateText')
    expect(source).toContain('hasUnpublishedChanges')
    expect(source).toContain('未发布改动')
    expect(source).toContain('const buildCurrentDefinitionSnapshot = () => ({')
    expect(source).toContain('triggerEvent: triggerEvent.value')
    expect(source).toContain('currentDefinitionMeta.isActive = data.isActive || \'0\'')
  })

  it('加载流程详情时兼容响应包裹并回填触发时机', () => {
    const source = readDesignerSource()

    expect(source).toContain('const unwrapWorkflowDefinition = (res) => res?.data?.data || res?.data || res')
    expect(source).toContain('const data = unwrapWorkflowDefinition(res)')
    expect(source).toContain("triggerEvent.value = data.triggerEvent || ''")
  })

  it('业务对象变更不清空已回填的触发时机', () => {
    const source = readDesignerSource()
    const businessTypeChangeBlock = source.match(/const onBusinessTypeChange = async[\s\S]*?return true\n}/)?.[0] || ''

    expect(businessTypeChangeBlock).not.toContain("triggerEvent.value = ''")
  })

  it('流程分类使用字典选择并在加载时兼容旧值', () => {
    const source = readDesignerSource()

    expect(source).toMatch(/<el-select v-model="workflowCategory" placeholder="请选择流程分类">/)
    expect(source).toContain('<el-option v-for="item in workflowCategoryOptions"')
    expect(source).toContain("const normalizeWorkflowCategory = (category = '') =>")
    expect(source).toContain('workflowCategory.value = normalizeWorkflowCategory(data.category || \'\')')
  })

  it('保存已发布流程返回新草稿时切换到新定义 ID', () => {
    const source = readDesignerSource()

    expect(source).toContain('const syncSavedDefinitionState = (savedDefinition) => {')
    expect(source).toContain('selectedDefinitionId.value = savedDefinition.id')
    expect(source).toContain('currentDefinitionMeta.isActive = savedDefinition.isActive || \'0\'')
    expect(source).toContain('currentDefinitionMeta.version = savedDefinition.version || \'\'')
  })
})
