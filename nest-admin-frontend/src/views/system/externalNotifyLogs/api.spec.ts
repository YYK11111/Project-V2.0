import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/utils/request', () => ({
  default: requestMocks,
}))

describe('external notify logs api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.window = Object.assign(globalThis.window || {}, {
      sysConfig: {
        serves: {
          system: '/system',
        },
      },
    }) as Window & typeof globalThis
  })

  it('应获取统一消息追踪日志', async () => {
    requestMocks.get.mockResolvedValue({ data: { messageId: 'msg-1' } })

    const { getTraceLogs } = await import('./api')
    const result = await getTraceLogs('msg-1')

    expect(requestMocks.get).toHaveBeenCalledWith('/system/external-notify/logs/trace/msg-1')
    expect(result).toEqual({ data: { messageId: 'msg-1' } })
  })

  it('应获取飞书卡片补偿概览', async () => {
    requestMocks.get.mockResolvedValue({ data: { pendingCount: 2 } })

    const { getFeishuCompensationStatus } = await import('./api')
    const result = await getFeishuCompensationStatus()

    expect(requestMocks.get).toHaveBeenCalledWith('/system/external-notify/feishu/compensation-status')
    expect(result).toEqual({ data: { pendingCount: 2 } })
  })

  it('应提交飞书卡片补偿任务', async () => {
    requestMocks.post.mockResolvedValue({ data: { processedCount: 3 } })

    const { runFeishuPendingDeliveryCompensation } = await import('./api')
    const result = await runFeishuPendingDeliveryCompensation()

    expect(requestMocks.post).toHaveBeenCalledWith('/system/scheduled-jobs/run/notifications.retryPendingDelivery')
    expect(result).toEqual({ data: { processedCount: 3 } })
  })
})
