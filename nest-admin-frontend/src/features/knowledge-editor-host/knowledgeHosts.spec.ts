import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const featureRoot = resolve(__dirname)

describe('knowledge editor hosts retired', () => {
  it('旧编辑器 host 组件已下线', () => {
    const editorHostPath = resolve(featureRoot, 'KnowledgeEditorHost.vue')
    const viewerHostPath = resolve(featureRoot, 'KnowledgeViewerHost.vue')

    expect(existsSync(editorHostPath)).toBe(false)
    expect(existsSync(viewerHostPath)).toBe(false)
  })
})
