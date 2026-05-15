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
    expect(tabsBlock).toContain('label="流程图"')
    expect(tabsBlock).not.toContain('label="流程进度"')
    expect(tabsBlock).toContain('label="历史记录"')
  })

  it('不展示普通用户不需要的技术标识字段', () => {
    expect(source).not.toContain('label="实例ID"')
    expect(source).not.toContain('label="流程编码"')
    expect(source).not.toContain('label="任务ID"')
  })

  it('流程图不展示实例概览字段，只保留流转图内容', () => {
    expect(progressSource).not.toContain('progress-overview')
    expect(progressSource).not.toContain('label="业务标题"')
    expect(progressSource).not.toContain('label="业务编号"')
    expect(progressSource).not.toContain('label="发起人"')
    expect(progressSource).not.toContain('label="实例状态"')
    expect(progressSource).not.toContain('label="当前节点"')
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

  it('流程进度用完整流转图展示当前节点和已流转节点', () => {
    expect(progressSource).toContain('workflow-progress-diagram')
    expect(progressSource).toContain('workflow-progress-node--current')
    expect(progressSource).toContain('workflow-progress-node--completed')
    expect(progressSource).toContain('workflow-progress-node--pending')
    expect(progressSource).toContain('workflow-progress-flow')
    expect(progressSource).not.toContain('progress-task-card')
    expect(progressSource).not.toContain('workflow-progress-line')
  })

  it('流程图节点悬浮显示已流经节点的审批信息，未流经节点不显示审批操作和审批意见', () => {
    expect(progressSource).toContain('<el-popover')
    expect(progressSource).toContain('getNodeApprovalRecords')
    expect(progressSource).toContain('审批人')
    expect(progressSource).toContain('审批操作')
    expect(progressSource).toContain('审批意见')
    expect(progressSource).toContain("node.state !== 'pending'")
  })

  it('流程图按节点ID匹配当前节点和审批记录，避免同名审批节点串数据', () => {
    expect(progressSource).toContain('getIsUniqueNodeName')
    expect(progressSource).toContain('!currentNodeId.value && getIsUniqueNodeName')
    expect(progressSource).toContain('getIsNodeMatchedByIdOrUniqueName')
    expect(progressSource).not.toContain("String(item?.nodeName || '') === nodeName")
    expect(progressSource).not.toContain("String(task?.nodeName || '') === nodeName")
  })

  it('流程图节点审批信息过滤系统流转记录', () => {
    expect(progressSource).toContain('getIsApprovalHistory')
    expect(progressSource).toContain("String(item?.action || '') !== 'execute'")
    expect(progressSource).toContain('.filter(getIsApprovalHistory)')
  })

  it('历史记录兼容开始节点、重新提交和旧数据审批人回填', () => {
    expect(historySource).toContain('isStartHistory')
    expect(historySource).toContain("return '发起'")
    expect(historySource).toContain('props.instanceInfo?.starterName')
    expect(historySource).toContain('approvalTask?.assigneeName')
    expect(historySource).not.toContain("'execute': '执行'")
  })

  it('审批上下文不依赖流程定义详情权限', () => {
    expect(source).not.toContain('getWorkflowDefinition(')
    expect(source).toContain('getWorkflowInstanceDefinition')
    expect(source).toContain('instanceDefinition')
    expect(source).toContain('buildRejectableNodes')
  })

  it('审批动作完成后通知消息角标立即刷新', () => {
    expect(source).toContain("new CustomEvent('message-center:refresh'")
    expect(source).toContain("window.dispatchEvent")
  })

  it('审批动作完成后不再弹窗倒计时返回上一页', () => {
    expect(source).not.toContain('autoBackVisible')
    expect(source).not.toContain('autoBackSeconds')
    expect(source).not.toContain('autoBackTimer')
    expect(source).not.toContain('startAutoBack')
    expect(source).not.toContain('goBackAfterApproval')
    expect(source).not.toContain('秒后自动返回上一页')
    expect(source).not.toContain('立即返回')
  })

  it('只读模式默认停留在流程图并响应实例切换', () => {
    expect(source).toContain("const activeTab = ref(props.readonly ? 'progress' : 'actions')")
    expect(source).toContain('v-if="!props.readonly"')
    expect(source).toContain('() => [props.instanceId, props.taskId]')
    expect(source).toContain("activeTab.value = 'progress'")
  })
})
