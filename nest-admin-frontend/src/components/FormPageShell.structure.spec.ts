import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'FormPageShell.vue'), 'utf-8')
}

describe('FormPageShell structure', () => {
  it('固定底栏宽度必须按视口夹取，避免撑出横向滚动条', () => {
    const source = readSource()

    expect(source).toContain('const left = Math.max(rect.left, 12)')
    expect(source).toContain('const availableWidth = Math.max(window.innerWidth - left - 12, 0)')
    expect(source).toContain('width: `${Math.min(Math.max(rect.width, 0), availableWidth)}px`')
  })
})
