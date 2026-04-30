import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

function readAppStoreSource() {
  return readFileSync(resolve(__dirname, '..', '..', '..', 'stores', 'app.js'), 'utf-8')
}

describe('system configs structure', () => {
  it('基础配置支持手动维护系统版本', () => {
    const source = readSource()

    expect(source).toContain("systemVersion: ''")
    expect(source).toContain('v-model="form.systemVersion"')
    expect(source).toContain('label="系统版本"')
  })

  it('基础配置支持维护新增用户默认密码', () => {
    const source = readSource()

    expect(source).toContain("defaultUserPassword: ''")
    expect(source).toContain('v-model="form.defaultUserPassword"')
    expect(source).toContain('label="默认用户密码"')
    expect(source).toContain('show-password')
  })

  it('加载系统配置后写入全局系统版本', () => {
    const source = readAppStoreSource()

    expect(source).toContain('window.sysConfig.SYSTEM_VERSION = data.systemVersion ||')
  })

  it('保存系统版本后刷新全局配置缓存', () => {
    const source = readSource()

    expect(source).toContain('const appStore = useAppStore()')
    expect(source).toContain('appStore.sysConfig = null')
    expect(source).toContain('appStore.getConfig()')
  })
})
