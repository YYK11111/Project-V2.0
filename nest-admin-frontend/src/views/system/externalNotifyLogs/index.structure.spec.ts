import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('external notify logs page structure', () => {
  it('按系统内消息、飞书、钉钉三个页签展示通知日志和详情', () => {
    const source = readSource()

    expect(source).toContain("checkPermi(['system/externalNotifyLogs/list'])")
    expect(source).toContain('business-list-page')
    expect(source).toContain('business-list-panel')
    expect(source).toContain('el-tabs')
    expect(source).toContain("name=\"system\"")
    expect(source).toContain("name=\"feishu\"")
    expect(source).toContain("name=\"dingtalk\"")
    expect(source).toContain('通知ID')
    expect(source).toContain('操作类型')
    expect(source).toContain('外部消息ID')
    expect(source).toContain('重试次数')
    expect(source).toContain('TableOperation')
    expect(source).toContain('发送日志详情')
    expect(source).toContain('错误信息')
    expect(source).toContain('请求摘要')
    expect(source).toContain('响应摘要')
  })
})
