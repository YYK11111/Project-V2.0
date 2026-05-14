import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/common', () => {
  return {
    baseApi: '/api/common',
  }
})

describe('SDK 消息提示', () => {
  it('提供 msgWarning 兼容业务页面调用', async () => {
    const { SDK } = await import('./sdk')
    const sdk = new SDK()
    const elMessage = vi.mocked((window as any).ElMessage)

    sdk.msgWarning('请补齐必填信息')

    expect(elMessage).toHaveBeenCalledWith({
      showClose: true,
      message: '请补齐必填信息',
      type: 'warning',
      grouping: true,
    })
  })
})
