import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'WorkflowApprovalPanel.vue'), 'utf-8')
}

function getTabsBlock(source: string) {
  const match = source.match(/<el-tabs[\s\S]*?<\/el-tabs>/)
  return match?.[0] || ''
}

describe('WorkflowApprovalPanel contract', () => {
  const source = readSource()
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
    expect(source).toContain('label="业务标题"')
    expect(source).toContain('label="业务编号"')
    expect(source).toContain('label="发起人"')
    expect(source).toContain('label="实例状态"')
  })

  it('历史记录标签显示审批动作、操作人和审批意见', () => {
    expect(source).toContain('审批意见')
    expect(source).toContain('操作人')
    expect(source).toContain('history-title')
  })

  it('流程进度对当前节点和待处理状态有显著高亮', () => {
    expect(source).toContain("task.id === currentTask?.id")
    expect(source).toContain('progress-task-card--active')
    expect(source).toContain('progress-task-card__step')
  })

  it('历史记录卡片应展示更易扫读的元信息分层', () => {
    expect(source).toContain('history-card')
    expect(source).toContain('history-meta')
    expect(source).toContain('history-comment')
  })
})
