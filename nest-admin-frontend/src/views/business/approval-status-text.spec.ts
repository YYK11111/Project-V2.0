import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const approvalStatusFiles = [
  'crm/customerManage/form.vue',
  'crm/customerManage/index.vue',
  'projectManage/index.vue',
  'projectManage/detail.vue',
  'projectManage/approval.vue',
  'changeManage/form.vue',
  'changeManage/index.vue',
  'taskManage/form.vue',
  'taskManage/index.vue',
  'ticketManage/form.vue',
  'ticketManage/index.vue',
]

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

type ProjectApprovalRow = {
  approvalStatus?: string | null
  workflowInstanceId?: string | null
  currentNodeName?: string | null
}

function getProjectApprovalHelper(relativePath: string) {
  const source = readBusinessView(relativePath)
  const match = source.match(/function getProjectApprovalText\([^)]*\) \{[\s\S]*?\n\}/)

  expect(match?.[0]).toBeTruthy()

  return new Function(`${match?.[0]}; return getProjectApprovalText;`) as () => (row: ProjectApprovalRow) => string
}

describe('审批状态展示文案守卫', () => {
  it('关键审批页面将 approvalStatus=0 统一展示为未提交审批', () => {
    approvalStatusFiles.forEach((file) => {
      const source = readBusinessView(file)

      expect(source).toContain("'0': '未提交审批'")
      expect(source).not.toContain("'0': '无需审批'")
      expect(source).not.toMatch(/\|\|\s*'无需审批'/)
    })
  })

  it('列表和详情页保留退回发起人的例外展示逻辑', () => {
    const filesWithReturnedStarterText = [
      'crm/customerManage/index.vue',
      'projectManage/index.vue',
      'projectManage/detail.vue',
      'changeManage/index.vue',
      'taskManage/index.vue',
      'ticketManage/index.vue',
    ]

    filesWithReturnedStarterText.forEach((file) => {
      const source = readBusinessView(file)

      expect(source).toContain("approvalStatus === '3'")
      expect(source).toContain("includes('退回发起人')")
      expect(source).toContain('已退回发起人')
    })
  })

  it('项目相关 helper 在 approvalStatus=0 且无流程实例时仍展示未提交审批', () => {
    const files = ['projectManage/index.vue', 'projectManage/detail.vue', 'projectManage/approval.vue']

    files.forEach((file) => {
      const getProjectApprovalText = getProjectApprovalHelper(file)()

      expect(getProjectApprovalText({ approvalStatus: '0' })).toBe('未提交审批')
      expect(getProjectApprovalText({ approvalStatus: '0', workflowInstanceId: '' })).toBe('未提交审批')
    })
  })

  it('项目相关 helper 对退回发起人分支保持特例文案', () => {
    const files = ['projectManage/index.vue', 'projectManage/detail.vue', 'projectManage/approval.vue']

    files.forEach((file) => {
      const getProjectApprovalText = getProjectApprovalHelper(file)()

      expect(getProjectApprovalText({ approvalStatus: '3', currentNodeName: '退回发起人修改' })).toBe('已退回发起人')
      expect(getProjectApprovalText({ approvalStatus: '3', currentNodeName: '部门审批' })).toBe('已驳回')
    })
  })
})
