import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readProjectApprovalSource() {
  return readFileSync(resolve(__dirname, 'approval.vue'), 'utf-8')
}

function readWorkflowApprovalPanelSource() {
  return readFileSync(resolve(__dirname, '../../../components/workflow/WorkflowApprovalPanel.vue'), 'utf-8')
}

function readRoutesSource() {
  return readFileSync(resolve(__dirname, '../../../router/routes.js'), 'utf-8')
}

describe('projectManage 项目查看页治理守卫', () => {
  it('项目查看页作为长期入口并保留旧审批页兼容入口', () => {
    const routeSource = readRoutesSource()

    expect(routeSource).toContain("path: '/projectManage/view'")
    expect(routeSource).toContain("name: 'ProjectViewHidden'")
    expect(routeSource).toContain("meta: { title: '项目查看' }")
    expect(routeSource).toContain("path: '/projectManage/approval'")
    expect(routeSource).toContain("component: () => import('@/views/business/projectManage/approval.vue')")
  })

  it('查看页标题为项目查看并展示审批记录列表', () => {
    const source = readProjectApprovalSource()

    expect(source).toContain('title="项目查看"')
    expect(source).toContain('const selectedApprovalContextId = ref(\'\')')
    expect(source).toContain('function selectApprovalContext(context)')
    expect(source).toContain('function getApprovalContextStatusText(context)')
    expect(source).toContain('<section v-if="approvalContexts.length" class="section-card section-card--approval-contexts">')
    expect(source).toContain('v-for="context in approvalContexts"')
    expect(source).toContain('@click="selectApprovalContext(context)"')
    expect(source).toContain('审批记录')
  })

  it('直接查看立项页时展示只读流程图和审批历史', () => {
    const source = readProjectApprovalSource()
    const panelSource = readWorkflowApprovalPanelSource()

    expect(source).toContain('const showWorkflowPanel')
    expect(source).toContain('const isWorkflowReadonly')
    expect(source).toContain('v-if="showWorkflowPanel"')
    expect(source).toContain(':readonly="isWorkflowReadonly"')
    expect(source).toContain("isWorkflowReadonly ? '流程图与审批历史' : '审批处理'")
    expect(panelSource).toContain('readonly: { type: Boolean, default: false }')
    expect(panelSource).toContain("const activeTab = ref(props.readonly ? 'progress' : 'actions')")
    expect(panelSource).toContain('v-if="!props.readonly"')
  })

  it('立项查看页补充展示业务、阶段、质量和风险信息', () => {
    const source = readProjectApprovalSource()

    expect(source).toContain('phaseMap[project.phase]')
    expect(source).toContain('riskLevelMap[project.riskLevel]')
    expect(source).toContain('qualityLevelMap[project.qualityLevel]')
    expect(source).toContain('label="业务线"')
    expect(source).toContain('label="行业"')
    expect(source).toContain('label="项目来源"')
    expect(source).toContain('label="阶段起止"')
    expect(source).toContain('label="实际成本"')
  })

  it('项目查看页统一展示计划周期和实际周期，不再同时展示旧开始结束字段', () => {
    const source = readProjectApprovalSource()

    expect(source).toContain('label="计划周期"')
    expect(source).toContain('getDateRange(project.planStartDate || project.startDate, project.planEndDate || project.endDate)')
    expect(source).toContain('label="实际周期"')
    expect(source).toContain('getDateRange(project.actualStartDate, project.actualEndDate)')
    expect(source).not.toContain('label="开始时间"')
    expect(source).not.toContain('label="结束时间"')
    expect(source).not.toContain('label="计划开始"')
    expect(source).not.toContain('label="计划结束"')
  })

  it('项目查看页操作按钮使用项目内权限上下文', () => {
    const source = readProjectApprovalSource()

    expect(source).toContain('const projectPermissionContext = ref({})')
    expect(source).toContain("const canEditProject = computed(() => projectPermissionContext.value?.canEdit === true && String(project.value?.status || '') !== '3')")
    expect(source).toContain("const canSubmitApprovalCurrentProject = computed(() => projectPermissionContext.value?.canSubmitApproval === true)")
    expect(source).not.toContain('const canEditProject = computed(() => canProjectUpdate.value')
    expect(source).not.toContain('if (!canProjectSubmitApproval.value) return $sdk.msgWarning')
  })

  it('立项审批页里程碑计划不展示延期原因', () => {
    const source = readProjectApprovalSource()

    expect(source).not.toContain('label="延期原因"')
    expect(source).not.toContain('row.delayReason')
  })

  it('项目描述和项目附件在同一区块展示，不放在基本信息中', () => {
    const source = readProjectApprovalSource()
    const basicSection = source.slice(
      source.indexOf('<div class="section-title">基本信息</div>'),
      source.indexOf('<div class="section-title">项目成员</div>'),
    )
    const attachmentSection = source.slice(
      source.indexOf('<div class="section-title">项目附件</div>'),
      source.indexOf('<section v-if="showWorkflowPanel"'),
    )

    expect(basicSection).not.toContain('label="项目描述"')
    expect(attachmentSection).toContain('label="项目描述"')
    expect(attachmentSection).toContain('label="项目附件"')
  })

  it('直接入口和工作流入口使用审批上下文选择最终流程实例', () => {
    const source = readProjectApprovalSource()

    expect(source).toContain('getViewContext(projectId.value, { instanceId: route.query.instanceId })')
    expect(source).toContain('const currentApprovalContext = ref(null)')
    expect(source).toContain('const finalWorkflowInstanceId = String(route.query.instanceId || currentApprovalContext.value?.workflowInstanceId || projectResData?.workflowInstanceId || \'\')')
    expect(source).toContain('workflowInstance.value = finalWorkflowInstanceId ? workflowInstanceRes.data || null : null')
    expect(source).not.toContain('if (!workflowInstance.value && project.value?.workflowInstanceId)')
  })

  it('审批页项目字段展示不受字段组权限和工作流入口参数影响', () => {
    const source = readProjectApprovalSource()
    const projectContent = source.slice(
      source.indexOf('<div class="approval-sections">'),
      source.indexOf('<section v-if="showWorkflowPanel"'),
    )

    expect(projectContent).not.toContain('canViewGroup')
    expect(projectContent).not.toContain('fromWorkflow')
    expect(projectContent).not.toContain('workflowTaskId')
  })
})
