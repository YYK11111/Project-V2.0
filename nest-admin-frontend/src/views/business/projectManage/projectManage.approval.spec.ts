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
})
