import { describe, expect, it } from 'vitest'

import {
  approvalViewStatuses,
  projectActionKeys,
  executionPermissionKeys,
} from '@/types/business-context'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('business context types', () => {
  it('导出统一审批状态常量', () => {
    expect(approvalViewStatuses).toEqual([
      'none',
      'pending',
      'approved',
      'rejected',
      'returned',
    ])
  })

  it('导出项目动作与执行对象权限常量', () => {
    expect(projectActionKeys).toEqual([
      'canEdit',
      'canSubmitApproval',
      'canSubmitClose',
      'canArchive',
      'canDelete',
    ])
    expect(executionPermissionKeys).toEqual([
      'canEdit',
      'canDelete',
      'canManage',
      'canExecute',
    ])
  })

  it('核心项目与任务页面开始引用共享业务上下文类型', () => {
    const projectIndex = readFileSync(resolve(__dirname, 'projectManage/index.vue'), 'utf-8')
    const projectForm = readFileSync(resolve(__dirname, 'projectManage/form.vue'), 'utf-8')
    const taskIndex = readFileSync(resolve(__dirname, 'taskManage/index.vue'), 'utf-8')
    const taskForm = readFileSync(resolve(__dirname, 'taskManage/form.vue'), 'utf-8')

    expect(projectIndex).toContain("@/types/business-context")
    expect(projectForm).toContain("@/types/business-context")
    expect(taskIndex).toContain("@/types/business-context")
    expect(taskForm).toContain("@/types/business-context")
  })
})
