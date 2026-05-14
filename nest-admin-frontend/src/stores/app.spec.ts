import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getListMock = vi.fn()

vi.mock('@/views/system/configs/api', () => ({
  getList: getListMock,
}))

describe('useAppStore.getConfig', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getListMock.mockReset()
    document.head.innerHTML = ''
    document.title = ''
    window.sysConfig.BASE_API = 'http://localhost:3000/api'
    window.sysConfig.SYSTEM_NAME = '旧系统名称'
    window.sysConfig.SYSTEM_NAME_ALL = '旧标签页名称'
    window.sysConfig.LOGO = '旧logo'
    window.sysConfig.BROWSER_ICON = '旧图标'
    window.sysConfig.SYSTEM_VERSION = '旧版本'
  })

  it('会把系统配置写回全局品牌配置', async () => {
    getListMock.mockResolvedValue({
      list: [
        {
          systemName: '系统名称',
          browserTitle: '标签页名称',
          systemVersion: '1.2.3',
          systemLogo: '/static/logo.svg',
          browserIcon: '/static/browser-icon.svg',
        },
      ],
    })

    const { useAppStore } = await import('./app')
    const appStore = useAppStore()

    await appStore.getConfig()

    expect(window.sysConfig.SYSTEM_NAME).toBe('系统名称')
    expect(window.sysConfig.SYSTEM_NAME_ALL).toBe('标签页名称')
    expect(window.sysConfig.SYSTEM_VERSION).toBe('1.2.3')
    expect(window.sysConfig.LOGO).toBe('http://localhost:3000/api/static/logo.svg')
    expect(window.sysConfig.BROWSER_ICON).toBe('http://localhost:3000/api/static/browser-icon.svg')
    expect(document.title).toBe('标签页名称')
  })
})
