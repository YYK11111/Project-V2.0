import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const featureRoot = resolve(__dirname)

describe('knowledge editor host bridge retired', () => {
  it('旧 iframe bridge 消息定义已删除', () => {
    const hostMessagesPath = resolve(featureRoot, 'core/hostMessages.ts')

    expect(existsSync(hostMessagesPath)).toBe(false)
  })
})
