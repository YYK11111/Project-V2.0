import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'WorkflowApprovalPanel.vue'), 'utf-8')
}

function readProgressSource() {
  return readFileSync(resolve(__dirname, 'WorkflowProgressView.vue'), 'utf-8')
}

function readHistorySource() {
  return readFileSync(resolve(__dirname, 'WorkflowHistoryView.vue'), 'utf-8')
}

function getTabsBlock(source: string) {
  const match = source.match(/<el-tabs[\s\S]*?<\/el-tabs>/)
  return match?.[0] || ''
}

describe('WorkflowApprovalPanel contract', () => {
  const source = readSource()
  const progressSource = readProgressSource()
  const historySource = readHistorySource()
  const tabsBlock = getTabsBlock(source)

  it('使用标签页拆分审批操作、流程进度和历史记录', () => {
    expect(tabsBlock).toContain('label="审批操作"')
    expect(tabsBlock).toContain('label="流程进度"')
    expect(tabsBlock).toContain('label="历史记录"')
  })

  it('不展示普通用户不需要的技术标识字段', () => {
    expect(source).not.toContain('label="实例ID"')
    expect(source).not.toContain('label="流程编码"')
    expect(source).not.toContain('label="任务ID"')
  })

  it('流程进度标签保留业务标题、业务编号、发起人和实例状态', () => {
    expect(progressSource).toContain('label="业务标题"')
    expect(progressSource).toContain('label="业务编号"')
    expect(progressSource).toContain('label="发起人"')
    expect(progressSource).toContain('label="实例状态"')
  })

  it('历史记录标签显示表格化审批过程、到达时间、通过时间和停留时长', () => {
    expect(historySource).toContain('<el-table')
    expect(historySource).toContain('label="审批过程"')
    expect(historySource).toContain('label="到达时间"')
    expect(historySource).toContain('label="审批通过时间"')
    expect(historySource).toContain('label="停留时长"')
    expect(historySource).toContain('审批意见')
    expect(historySource).toContain('审批人')
    expect(historySource).not.toContain('<el-timeline')
  })

  it('流程进度用连接式步骤视图展示当前节点和待处理状态', () => {
    expect(progressSource).toContain("task.id === currentTaskId")
    expect(progressSource).toContain('workflow-progress-step--active')
    expect(progressSource).toContain('workflow-progress-line')
    expect(progressSource).not.toContain('progress-task-card')
  })

  it('历史记录兼容开始节点、重新提交和旧数据审批人回填', () => {
    expect(historySource).toContain('isStartHistory')
    expect(historySource).toContain("return '发起'")
    expect(historySource).toContain('props.instanceInfo?.starterName')
    expect(historySource).toContain('approvalTask?.assigneeName')
    expect(historySource).not.toContain("'execute': '执行'")
  })

  it('审批上下文不依赖流程定义详情权限', () => {
    expect(source).not.toContain('getWorkflowDefinition')
    expect(source).toContain('buildRejectableNodes')
  })
})
