import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { applyBrowserBranding } from './config'

function readSysConfigSource() {
  return readFileSync(resolve(__dirname, '..', 'sys.config.js'), 'utf-8')
}

describe('applyBrowserBranding', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.title = ''
    window.sysConfig.BASE_API = 'http://localhost:3000/api'
    window.sysConfig.SYSTEM_NAME = '系统名称'
    window.sysConfig.SYSTEM_NAME_ALL = '标签页名称'
    window.sysConfig.LOGO = '/static/logo.svg'
    window.sysConfig.BROWSER_ICON = '/static/browser-icon.svg'
  })

  it('系统配置的静态资源路径只拼接一次 static 前缀', () => {
    applyBrowserBranding()

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null

    expect(document.title).toBe('标签页名称')
    expect(favicon?.href).toBe('http://localhost:3000/api/static/browser-icon.svg')
  })

  it('默认系统配置不再包含原项目宣传文案', () => {
    const source = readSysConfigSource()

    expect(source).toContain("SYSTEM_NAME: ''")
    expect(source).toContain("SYSTEM_SLOGAN: ''")
    expect(source).toContain("SYSTEM_NAME_ALL: ''")
    expect(source).toContain("COPYRIGHT: ''")
    expect(source).not.toContain('基于 Nestjs')
    expect(source).not.toContain('Nest Admin --')
  })
})
