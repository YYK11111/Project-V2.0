import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('task index structure', () => {
  it('列表支持待完成审批状态展示', () => {
    const source = readSource()

    expect(source).toContain('待完成审批')
    expect(source).toContain("row.status === '6'")
  })

  it('列表提供任务生命周期动作入口', () => {
    const source = readSource()

    expect(source).toContain('handleStartTask')
    expect(source).toContain('handlePauseTask')
    expect(source).toContain('handleResumeTask')
    expect(source).toContain('submitCompletionApproval')
    expect(source).toContain('开始任务')
    expect(source).toContain('暂缓任务')
    expect(source).toContain('恢复任务')
    expect(source).toContain('提交完成审批')
  })

  it('生命周期动作包含关键守卫表达式', () => {
    const source = readSource()

    expect(source).toContain("const canStartCurrentTask = (row) => String(row.status || '') === '1' && row.canExecute !== false")
    expect(source).toContain("const canPauseCurrentTask = (row) => String(row.status || '') === '2' && row.canManage !== false")
    expect(source).toContain("const canResumeCurrentTask = (row) => String(row.status || '') === '5' && row.canManage !== false")
    expect(source).toContain("const canSubmitCompletionCurrentTask = (row) => String(row.status || '') === '2' && row.canExecute !== false && !['1', '2'].includes(String(row.approvalStatus || '0'))")
    expect(source).toContain("const canUpdateCurrentTaskProgress = (row) =>")
    expect(source).toContain("['2', '5', '6'].includes(String(row.status || ''))")
    expect(source).toContain(":disabled=\"!canUpdateCurrentTaskProgress(row)\"")
    expect(source).toContain("const canSubmitTaskApproval = (row) => String(row.status || '') === '1' && !['1', '2'].includes(String(row.approvalStatus || '0'))")
  })
})
