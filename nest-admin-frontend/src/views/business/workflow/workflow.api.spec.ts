import { describe, expect, it } from 'vitest'
import { selectLatestPublishedWorkflowDefinitions } from './api'

describe('workflow 列表版本筛选', () => {
  it('优先显示每个流程已发布的最新版本', () => {
    const list = [
      { id: 'def-v3-draft', code: 'WF_PROJECT_APPROVAL', version: 3, isActive: '0', createTime: '2026-05-14 10:00:00' },
      { id: 'def-v2-pub', code: 'WF_PROJECT_APPROVAL', version: 2, isActive: '1', createTime: '2026-05-13 10:00:00' },
      { id: 'def-b1-pub', code: 'WF_TASK_APPROVAL', version: 1, isActive: '1', createTime: '2026-05-12 10:00:00' },
      { id: 'def-b2-draft', code: 'WF_TASK_APPROVAL', version: 2, isActive: '0', createTime: '2026-05-14 11:00:00' },
    ]

    const result = selectLatestPublishedWorkflowDefinitions(list)

    expect(result).toEqual([
      expect.objectContaining({ id: 'def-v2-pub', version: 2, isActive: '1' }),
      expect.objectContaining({ id: 'def-b1-pub', version: 1, isActive: '1' }),
    ])
  })

  it('没有已发布版本时回退到最新草稿', () => {
    const list = [
      { id: 'def-a1', code: 'WF_ACCEPTANCE_APPROVAL', version: 1, isActive: '0', createTime: '2026-05-12 10:00:00' },
      { id: 'def-a2', code: 'WF_ACCEPTANCE_APPROVAL', version: 2, isActive: '0', createTime: '2026-05-14 10:00:00' },
    ]

    const result = selectLatestPublishedWorkflowDefinitions(list)

    expect(result).toEqual([
      expect.objectContaining({ id: 'def-a2', version: 2, isActive: '0' }),
    ])
  })
})
