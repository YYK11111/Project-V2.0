import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/utils/request', () => ({
  default: requestMocks,
}))

describe('scheduled jobs api', () => {
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

  it('任务列表接口应解包响应中的 data 数组', async () => {
    requestMocks.get.mockResolvedValue({
      code: 200,
      msg: 'success',
      data: [
        {
          jobKey: 'tasks.dueSoonReminder',
        },
      ],
    })

    const { getScheduledJobs } = await import('./api')
    const result = await getScheduledJobs()

    expect(result).toEqual([
      {
        jobKey: 'tasks.dueSoonReminder',
      },
    ])
  })

  it('日志接口应解包响应中的 data 数组', async () => {
    requestMocks.get.mockResolvedValue({
      code: 200,
      msg: 'success',
      data: [
        {
          jobKey: 'tasks.dueSoonReminder',
          status: 'success',
        },
      ],
    })

    const { getScheduledJobLogs } = await import('./api')
    const result = await getScheduledJobLogs({ jobKey: 'tasks.dueSoonReminder' })

    expect(result).toEqual([
      {
        jobKey: 'tasks.dueSoonReminder',
        status: 'success',
      },
    ])
  })

  it('日志详情接口应解包响应中的 data 对象', async () => {
    requestMocks.get.mockResolvedValue({
      code: 200,
      msg: 'success',
      data: {
        id: 'log-1',
        jobKey: 'sysFile.orphanCleanup',
        payload: { totalSize: 2048 },
        operatorName: '管理员',
      },
    })

    const { getScheduledJobLogDetail } = await import('./api')
    const result = await getScheduledJobLogDetail('log-1')

    expect(requestMocks.get).toHaveBeenCalledWith('/system/scheduled-jobs/logs/log-1')
    expect(result).toEqual({
      id: 'log-1',
      jobKey: 'sysFile.orphanCleanup',
      payload: { totalSize: 2048 },
      operatorName: '管理员',
    })
  })
})
