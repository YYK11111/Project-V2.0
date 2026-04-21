import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readViewSource(name: string) {
  return readFileSync(resolve(__dirname, `${name}.vue`), 'utf-8')
}

describe('projectManage 页面暗黑模式样式守卫', () => {
  it('approval 页面不再使用固定浅色样式值', () => {
    const source = readViewSource('approval')

    expect(source).not.toMatch(/#fff\b/i)
    expect(source).not.toMatch(/#ffffff\b/i)
    expect(source).not.toMatch(/#ebeef5\b/i)
    expect(source).not.toMatch(/#303133\b/i)
    expect(source).not.toMatch(/#909399\b/i)
    expect(source).toMatch(/var\(--el-/)
  })

  it('detail 页面使用主题变量或颜色混合而不是浅色白底', () => {
    const source = readViewSource('detail')

    expect(source).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(source).not.toMatch(/#ffffff\b/i)
    expect(source).not.toMatch(/background:\s*#fff\b/i)
    expect(source).not.toMatch(/background:\s*rgba\(230,\s*162,\s*60/i)
    expect(source).not.toMatch(/background:\s*rgba\(245,\s*108,\s*108/i)
    expect(source).not.toMatch(/border-color:\s*rgba\(245,\s*108,\s*108/i)
    expect(source).toMatch(/color-mix\(/)
    expect(source).toMatch(/var\(--el-/)
  })

  it('cockpit 页面语义卡片使用主题兼容样式', () => {
    const source = readViewSource('cockpit')

    expect(source).toMatch(/color-mix\(/)
    expect(source).toMatch(/var\(--el-/)
  })
})
