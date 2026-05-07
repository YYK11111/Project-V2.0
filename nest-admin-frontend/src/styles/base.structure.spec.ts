import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBaseStyle() {
  return readFileSync(resolve(__dirname, 'base.css'), 'utf-8')
}

describe('base style guards', () => {
  it('基础样式不再全局给相邻按钮追加左边距', () => {
    const source = readBaseStyle()

    expect(source).not.toContain('button + button')
    expect(source).toContain('svg + svg')
  })
})
