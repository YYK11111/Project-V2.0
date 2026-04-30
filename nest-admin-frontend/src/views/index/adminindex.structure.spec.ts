import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'adminindex.vue'), 'utf-8')
}

describe('admin home structure', () => {
  it('展示系统首页核心区块', () => {
    const source = readSource()

    expect(source).toContain('系统概览')
    expect(source).toContain('管理工作摘要')
    expect(source).toContain('系统管理快捷入口')
    expect(source).toContain('访问趋势')
    expect(source).toContain('用户地区分布')
  })

  it('系统首页具备更强的驾驶舱导语和管理导向', () => {
    const source = readSource()

    expect(source).toContain('集中查看系统状态、访问趋势和后台管理入口。')
    expect(source).toContain('当前在线人数')
    expect(source).toContain('未读系统消息')
    expect(source).toContain('系统日志')
    expect(source).toContain('system-console')
  })
})
