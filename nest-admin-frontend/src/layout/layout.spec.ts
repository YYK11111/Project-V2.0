import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readLayoutSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('后台主布局尺寸守卫', () => {
  it('主内容区允许在 flex 布局内收缩，避免宽表单撑出视口', () => {
    const source = readLayoutSource()
    const mainContainerBlock = source.match(/\.main-container\s*\{(?<styles>[^}]*)\}/)?.groups?.styles || ''

    expect(mainContainerBlock).toContain('min-width: 0;')
  })
})
