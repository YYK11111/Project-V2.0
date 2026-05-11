import { describe, expect, it } from 'vitest'

import {
  approvalViewStatuses,
  projectActionKeys,
  executionPermissionKeys,
} from '@/types/business-context'

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
})
