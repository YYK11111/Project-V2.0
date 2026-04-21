import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/content/articleManage/view.vue'), 'utf-8')
}

describe('knowledge view layout', () => {
  it('使用左侧目录和正文区内部滚动，并移除多余说明文案', () => {
    const source = readSource()

    expect(source).toContain('knowledge-view-sidebar Gcard')
    expect(source).toContain('knowledge-view-content-shell Gcard')
    expect(source).toContain('overflow-y: auto;')
    expect(source).not.toContain('完整展示 `h1-h6` 标题结构')
    expect(source).not.toContain('正文内容')
    expect(source).not.toContain('按阅读视角展示知识内容，并支持通过目录快速定位到目标章节。')
  })
})
