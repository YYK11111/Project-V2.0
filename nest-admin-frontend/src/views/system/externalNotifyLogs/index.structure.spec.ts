import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('external notify logs page structure', () => {
  it('展示外部通知发送日志和详情', () => {
    const source = readSource()

    expect(source).toContain("checkPermi(['system/externalNotifyLogs/list'])")
    expect(source).toContain('发送日志详情')
    expect(source).toContain('错误信息')
    expect(source).toContain('请求摘要')
    expect(source).toContain('响应摘要')
  })
})
