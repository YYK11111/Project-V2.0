import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

function readApiSource() {
  return readFileSync(resolve(__dirname, 'api.ts'), 'utf-8')
}

describe('user home structure', () => {
  it('展示用户首页核心区块', () => {
    const source = readSource()

    expect(source).toContain('我的工作摘要')
    expect(source).toContain('我的待办')
    expect(source).toContain('我的待阅')
    expect(source).toContain('我参与的项目')
    expect(source).toContain('快捷入口')
  })

  it('用户首页保留欢迎区并强化工作台层级', () => {
    const source = readSource()

    expect(source).toContain('围绕消息、项目和知识入口开始今天的工作。')
    expect(source).toContain('当前待办')
    expect(source).toContain('当前待阅')
    expect(source).toContain('参与项目')
    expect(source).toContain('我负责项目')
    expect(source).toContain('负责人：')
  })

  it('移除了首页文件中的 ts-nocheck 和未使用旧接口', () => {
    const source = readSource()
    const apiSource = readApiSource()

    expect(source).not.toContain('@ts-nocheck')
    expect(apiSource).not.toContain('@ts-nocheck')
    expect(apiSource).not.toContain('getIndexCountData')
    expect(apiSource).not.toContain('const serve')
  })

  it('系统版本只读取系统配置项', () => {
    const source = readSource()

    expect(source).toContain('sysConfig.SYSTEM_VERSION')
    expect(source).not.toContain('RELEASE.md?raw')
    expect(source).not.toContain('RELEASE.match')
  })
})
