import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readProjectApprovalSource() {
  return readFileSync(resolve(__dirname, 'approval.vue'), 'utf-8')
}

function readWorkflowApprovalPanelSource() {
  return readFileSync(resolve(__dirname, '../../../components/workflow/WorkflowApprovalPanel.vue'), 'utf-8')
}

describe('projectManage 立项查看页治理守卫', () => {
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

  it('直接入口和工作流入口使用同一个最终流程实例加载流程信息', () => {
    const source = readProjectApprovalSource()

    expect(source).toContain('const finalWorkflowInstanceId = String(route.query.instanceId || projectRes.data?.workflowInstanceId || \'\')')
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
