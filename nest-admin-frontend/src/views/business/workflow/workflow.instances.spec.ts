import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatWorkflowDateTime } from './time'

function readInstancesSource() {
  return readFileSync(resolve(__dirname, 'instances.vue'), 'utf-8')
}

describe('workflow 实例详情可视化守卫', () => {
  it('详情默认展示审批组件同款流程图并加载历史和任务数据', () => {
    const source = readInstancesSource()

    expect(source).toContain("detailTab.value = 'flow'")
    expect(source).toContain('api.getWorkflowInstanceTasks(instance.id)')
    expect(source).toContain('WorkflowProgressView')
    expect(source).toContain('<el-tab-pane label="流程图" name="flow">')
    expect(source).not.toContain('<el-tab-pane label="流程进度" name="flow">')
    expect(source).not.toContain('api.getWorkflowDefinition(instance.definitionId)')
  })

  it('流程图使用审批组件的完整流转图，不再展示实例流转图画布', () => {
    const source = readInstancesSource()

    expect(source).toContain(':instance-info="currentInstance"')
    expect(source).toContain(':tasks="instanceTaskList"')
    expect(source).toContain(':current-task-id="currentTask?.id || \'\'"')
    expect(source).not.toContain('instance-flow-canvas')
    expect(source).not.toContain('instance-flow-node')
  })

  it('历史记录使用审批组件的历史记录展示，不再使用实例页表格历史', () => {
    const source = readInstancesSource()

    expect(source).toContain('WorkflowHistoryView')
    expect(source).toContain('<el-tab-pane label="历史记录" name="history">')
    expect(source).toContain(':history-list="historyList"')
    expect(source).toContain(':tasks="instanceTaskList"')
    expect(source).not.toContain('<el-table v-if="approvalHistoryTableList.length > 0"')
    expect(source).not.toContain('label="审批过程"')
  })

  it('历史记录兼容开始节点、重新提交和旧数据审批人回填', () => {
    const source = readInstancesSource()

    const historyViewSource = readFileSync(resolve(__dirname, '../../../components/workflow/WorkflowHistoryView.vue'), 'utf-8')
    expect(historyViewSource).toContain('isStartHistory')
    expect(historyViewSource).toContain('isApprovalHistoryVisible')
    expect(historyViewSource).toContain("return '发起'")
    expect(historyViewSource).toContain('props.instanceInfo?.starterName')
    expect(historyViewSource).toContain('approvalTask?.assigneeName')
    expect(source).not.toContain('label="流转类型"')
    expect(historyViewSource).not.toContain("'execute': '执行'")
  })

  it('审批历史时间把 ISO UTC 时间显示为本地年月日时分秒', () => {
    expect(formatWorkflowDateTime('2026-05-14T09:16:29.000Z')).toBe('2026-05-14 17:16:29')
    expect(formatWorkflowDateTime('2026-05-14T09:17:07.000Z')).toBe('2026-05-14 17:17:07')
  })
})
