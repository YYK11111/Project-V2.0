import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('项目相关列表按钮权限守卫', () => {
  it('任务和工单列表行操作使用后端行级权限', () => {
    const taskSource = readBusinessView('taskManage/index.vue')
    const ticketSource = readBusinessView('ticketManage/index.vue')

    expect(taskSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(taskSource).toContain("canStartCurrentTask(row) ? { key: 'startTask'")
    expect(taskSource).toContain("canPauseCurrentTask(row) ? { key: 'pauseTask'")
    expect(taskSource).toContain("canResumeCurrentTask(row) ? { key: 'resumeTask'")
    expect(taskSource).toContain("canSubmitCompletionCurrentTask(row) ? { key: 'submitCompletionApproval'")
    expect(taskSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(taskSource).not.toContain('canTaskUpdate.value && row.canEdit')
    expect(ticketSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(ticketSource).toContain("row.canEdit === true && canSubmitTicketApproval(row)")
    expect(ticketSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(ticketSource).not.toContain('canTicketUpdate.value && row.canEdit')
  })

  it('风险、变更、里程碑列表行操作使用后端行级权限', () => {
    const riskSource = readBusinessView('riskManage/index.vue')
    const changeSource = readBusinessView('changeManage/index.vue')
    const milestoneSource = readBusinessView('milestoneManage/index.vue')

    expect(riskSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(riskSource).toContain("row.canEdit === true && row.status !== '4' && row.status !== '5'")
    expect(riskSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(changeSource).toContain("row.canEdit === true && canSubmitChangeApproval(row)")
    expect(changeSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(changeSource).toContain("row.canDelete === true ? { key: 'delete'")
    expect(milestoneSource).toContain("row.canEdit === true ? { key: 'edit'")
    expect(milestoneSource).toContain("row.canDelete === true ? { key: 'delete'")
  })

  it('交付单据列表行操作使用后端行级权限', () => {
    const files = [
      'goLiveManage/index.vue',
      'acceptanceManage/index.vue',
      'handoverManage/index.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toContain("row.canEdit === true ? { key: 'edit'")
      expect(source).toContain("row.canDelete === true ? { key: 'delete'")
    })
  })
})
