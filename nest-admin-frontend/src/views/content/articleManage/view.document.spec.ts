import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { DOCUMENT_CONTENT_VERSION, getKnowledgeDocumentBlockMessage } from './aev.document'
import { resolveKnowledgeViewMode } from './view.document'

function readViewSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/content/articleManage/view.vue'), 'utf-8')
}

function readDetailSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/content/articleManage/detail.vue'), 'utf-8')
}

describe('knowledge document view rendering', () => {
  it('ready 状态时返回 JSON 文档查看态', () => {
    const mode = resolveKnowledgeViewMode({
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
      contentVersion: DOCUMENT_CONTENT_VERSION,
      contentStatus: 'ready',
    })

    expect(mode).toEqual({
      kind: 'ready',
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
    })
  })

  it('legacy_html 状态时返回旧数据暂不支持查看提示', () => {
    const mode = resolveKnowledgeViewMode({
      content: '<p>旧正文</p>',
    })

    expect(mode).toEqual({
      kind: 'legacy_html',
      title: '旧数据暂不支持查看',
      description: '当前知识正文仍为旧版 HTML 数据，暂不支持查看。',
    })
  })

  it('invalid 状态时返回文档内容异常提示', () => {
    const mode = resolveKnowledgeViewMode({
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
      contentVersion: DOCUMENT_CONTENT_VERSION,
      contentStatus: 'invalid',
    })

    expect(mode).toEqual({
      kind: 'invalid',
      title: '文档内容异常，暂时无法展示',
      description: '当前知识正文结构异常，暂时无法展示。',
    })
  })

  it('查看阻断文案统一从状态工具读取', () => {
    expect(getKnowledgeDocumentBlockMessage('view', 'legacy_html')).toEqual({
      title: '旧数据暂不支持查看',
      description: '当前知识正文仍为旧版 HTML 数据，暂不支持查看。',
    })

    expect(getKnowledgeDocumentBlockMessage('view', 'invalid')).toEqual({
      title: '文档内容异常，暂时无法展示',
      description: '当前知识正文结构异常，暂时无法展示。',
    })
  })

  it('查看页应统一通过 resolveKnowledgeViewMode 驱动页面分支', () => {
    const viewSource = readViewSource()
    const detailSource = readDetailSource()

    expect(viewSource).toContain('resolveKnowledgeViewMode')
    expect(detailSource).toContain('resolveKnowledgeViewMode')
    expect(viewSource).toContain("documentState.kind === 'ready'")
    expect(viewSource).toContain("documentState.kind === 'legacy_html'")
    expect(viewSource).toContain("documentState.kind === 'invalid'")
    expect(detailSource).toContain("documentState.kind === 'ready'")
    expect(detailSource).toContain("documentState.kind === 'legacy_html'")
    expect(detailSource).toContain("documentState.kind === 'invalid'")
    expect(viewSource).not.toContain('旧数据不可查看')
    expect(viewSource).not.toContain('文档异常')
    expect(detailSource).not.toContain('旧数据不可查看')
    expect(detailSource).not.toContain('文档异常')
  })
})
