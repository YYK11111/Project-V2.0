import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, inject, provide, toRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ScheduledJobsView from './index.vue'

const apiMocks = vi.hoisted(() => ({
  getScheduledJobs: vi.fn(),
  getScheduledJobLogs: vi.fn(),
  getScheduledJobLogDetail: vi.fn(),
  runScheduledJob: vi.fn(),
  enableScheduledJob: vi.fn(),
  disableScheduledJob: vi.fn(),
}))

const permissionState = vi.hoisted(() => ({
  values: new Set<string>(),
}))

vi.mock('./api', () => ({
  getScheduledJobs: apiMocks.getScheduledJobs,
  getScheduledJobLogs: apiMocks.getScheduledJobLogs,
  getScheduledJobLogDetail: apiMocks.getScheduledJobLogDetail,
  runScheduledJob: apiMocks.runScheduledJob,
  enableScheduledJob: apiMocks.enableScheduledJob,
  disableScheduledJob: apiMocks.disableScheduledJob,
}))

vi.mock('@/utils/permission', () => ({
  checkPermi: (permissions: string[]) => permissions.some((item) => permissionState.values.has(item)),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
  },
}))

describe('scheduled jobs behavior', () => {
  const tableDataKey = Symbol('tableData')

  const defaultTableData = [
    {
      jobKey: 'tasks.dueSoonReminder',
      jobName: '任务即将到期提醒扫描',
      module: 'tasks',
      scheduleExpression: '0 0 9 * * *',
      enabled: '1',
      lastRunTime: '',
      lastStatus: '',
    },
  ]

  const enableTableData = [
    {
      jobKey: 'tasks.overdueReminder',
      jobName: '任务逾期提醒扫描',
      module: 'tasks',
      scheduleExpression: '0 5 9 * * *',
      enabled: '0',
      lastRunTime: '',
      lastStatus: '',
    },
  ]

  const ElTable = defineComponent({
    props: {
      data: {
        type: Array,
        default: () => [],
      },
    },
    setup(props) {
      provide(tableDataKey, toRef(props, 'data'))
    },
    template: '<div><slot /></div>',
  })

  const ElTableColumn = defineComponent({
    setup() {
      const tableData = inject<{ value: Array<Record<string, string>> }>(tableDataKey)

      return {
        tableData,
      }
    },
    template: '<div><slot v-for="row in tableData || []" :key="row.jobKey || row.startTime || row.summary" :row="row" /></div>',
  })

  function setPermissions(permissions: string[]) {
    permissionState.values = new Set(permissions)
  }

  function mountView() {
    return mount(ScheduledJobsView, {
      global: {
        directives: {
          loading: {},
        },
        stubs: {
          ElTable,
          ElTableColumn,
          ElDrawer: {
            props: ['modelValue', 'title', 'size'],
            template: '<div v-if="modelValue"><div>{{ title }}</div><slot /></div>',
          },
          ElButton: {
            emits: ['click'],
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setPermissions([
      'system/scheduledJobs/logs',
      'system/scheduledJobs/run',
      'system/scheduledJobs/enable',
      'system/scheduledJobs/disable',
    ])
    apiMocks.getScheduledJobs.mockResolvedValue(defaultTableData)
    apiMocks.getScheduledJobLogs.mockResolvedValue([])
    apiMocks.getScheduledJobLogDetail.mockResolvedValue({})
    apiMocks.runScheduledJob.mockResolvedValue({})
    apiMocks.enableScheduledJob.mockResolvedValue({})
    apiMocks.disableScheduledJob.mockResolvedValue({})
  })

  it('仅有页面权限时不显示受控按钮且不加载日志', async () => {
    setPermissions(['system/scheduledJobs/list'])

    const wrapper = mountView()

    await flushPromises()

    const buttonTexts = wrapper.findAll('button').map((item) => item.text())

    expect(buttonTexts).not.toContain('运行日志')
    expect(buttonTexts).not.toContain('立即执行')
    expect(buttonTexts).not.toContain('停用')
    expect(buttonTexts).not.toContain('启用')
    expect(wrapper.text()).not.toContain('运行日志')
    expect(apiMocks.getScheduledJobLogs).not.toHaveBeenCalled()
  })

  it('有日志权限时初始化会请求日志', async () => {
    setPermissions(['system/scheduledJobs/list', 'system/scheduledJobs/logs'])

    mountView()

    await flushPromises()

    expect(apiMocks.getScheduledJobLogs).toHaveBeenCalledWith({})
  })

  it('拥有对应权限时显示运行日志立即执行和停用按钮', async () => {
    setPermissions([
      'system/scheduledJobs/list',
      'system/scheduledJobs/logs',
      'system/scheduledJobs/run',
      'system/scheduledJobs/disable',
    ])

    const wrapper = mountView()

    await flushPromises()

    const buttonTexts = wrapper.findAll('button').map((item) => item.text())

    expect(buttonTexts).toContain('运行日志')
    expect(buttonTexts).toContain('立即执行')
    expect(buttonTexts).toContain('停用')
    expect(buttonTexts).not.toContain('启用')
  })

  it('点击立即执行会调用接口并刷新日志', async () => {
    setPermissions([
      'system/scheduledJobs/list',
      'system/scheduledJobs/logs',
      'system/scheduledJobs/run',
    ])

    const wrapper = mountView()

    await flushPromises()

    const buttons = wrapper.findAll('button')
    const runButton = buttons.find((item) => item.text() === '立即执行')
    await runButton?.trigger('click')
    await flushPromises()

    expect(apiMocks.runScheduledJob).toHaveBeenCalledWith('tasks.dueSoonReminder')
    expect(apiMocks.getScheduledJobLogs).toHaveBeenLastCalledWith({ jobKey: 'tasks.dueSoonReminder' })
  })

  it('无日志权限时点击立即执行不会刷新日志', async () => {
    setPermissions(['system/scheduledJobs/list', 'system/scheduledJobs/run'])

    const wrapper = mountView()

    await flushPromises()

    const buttons = wrapper.findAll('button')
    const runButton = buttons.find((item) => item.text() === '立即执行')
    await runButton?.trigger('click')
    await flushPromises()

    expect(apiMocks.runScheduledJob).toHaveBeenCalledWith('tasks.dueSoonReminder')
    expect(apiMocks.getScheduledJobLogs).not.toHaveBeenCalled()
  })

  it('点击停用会调用接口并刷新列表', async () => {
    setPermissions(['system/scheduledJobs/list', 'system/scheduledJobs/disable'])

    const wrapper = mountView()

    await flushPromises()

    const buttons = wrapper.findAll('button')
    const disableButton = buttons.find((item) => item.text() === '停用')
    await disableButton?.trigger('click')
    await flushPromises()

    expect(apiMocks.disableScheduledJob).toHaveBeenCalledWith('tasks.dueSoonReminder')
    expect(apiMocks.getScheduledJobs).toHaveBeenCalledTimes(2)
  })

  it('点击启用会调用接口并刷新列表', async () => {
    apiMocks.getScheduledJobs.mockResolvedValue(enableTableData)

    setPermissions(['system/scheduledJobs/list', 'system/scheduledJobs/enable'])

    const wrapper = mountView()

    await flushPromises()

    const buttons = wrapper.findAll('button')
    const enableButton = buttons.find((item) => item.text() === '启用')
    await enableButton?.trigger('click')
    await flushPromises()

    expect(apiMocks.enableScheduledJob).toHaveBeenCalledWith('tasks.overdueReminder')
    expect(apiMocks.getScheduledJobs).toHaveBeenCalledTimes(2)
  })

  it('点击详情会打开抽屉并加载日志详情', async () => {
    apiMocks.getScheduledJobLogs.mockResolvedValue([
      {
        id: 'log-1',
        jobKey: 'sysFile.orphanCleanup',
        jobName: '孤儿文件清理',
        triggerMode: 'manual',
        status: 'success',
        summary: '清理 3 个文件',
      },
    ])
    apiMocks.getScheduledJobLogDetail.mockResolvedValue({
      id: 'log-1',
      jobKey: 'sysFile.orphanCleanup',
      jobName: '孤儿文件清理',
      jobType: 'cron',
      module: 'sysFile',
      triggerMode: 'manual',
      status: 'success',
      processedCount: 3,
      successCount: 3,
      failedCount: 0,
      summary: '清理 3 个文件',
      payload: { totalSize: 2048 },
      operatorId: 'u1',
      operatorName: '管理员',
    })

    const wrapper = mountView()
    await flushPromises()

    const detailButton = wrapper.findAll('button').find((item) => item.text() === '详情')
    await detailButton?.trigger('click')
    await flushPromises()

    expect(apiMocks.getScheduledJobLogDetail).toHaveBeenCalledWith('log-1')
    expect(wrapper.text()).toContain('日志详情')
    expect(wrapper.text()).toContain('执行统计')
    expect(wrapper.text()).toContain('执行上下文')
    expect(wrapper.text()).toContain('管理员')
    expect(wrapper.text()).toContain('totalSize')
  })

  it('详情接口失败时保留抽屉并显示错误提示', async () => {
    apiMocks.getScheduledJobLogs.mockResolvedValue([
      {
        id: 'log-2',
        jobKey: 'tasks.overdueReminder',
        jobName: '任务逾期提醒扫描',
        triggerMode: 'manual',
        status: 'failure',
        summary: '执行失败',
      },
    ])
    apiMocks.getScheduledJobLogDetail.mockRejectedValue(new Error('日志详情不存在'))

    const wrapper = mountView()
    await flushPromises()

    const detailButton = wrapper.findAll('button').find((item) => item.text() === '详情')
    await detailButton?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('日志详情')
    expect(wrapper.text()).toContain('日志详情不存在')
  })
})
