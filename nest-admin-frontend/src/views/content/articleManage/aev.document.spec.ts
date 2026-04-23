import { describe, expect, it } from 'vitest'
import type { JSONContent } from '@tiptap/core'

import {
  createStructuredTemplateDocument,
  DOCUMENT_CONTENT_VERSION,
  getKnowledgeDocumentBlockMessage,
  mapKnowledgeDocumentErrorCode,
  resolveKnowledgeDocumentState,
} from './aev.document'

describe('知识编辑页正文状态机', () => {
  it('ready 状态返回结构化 JSON 文档并保留版本号', () => {
    const contentJson: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '知识正文',
            },
          ],
        },
      ],
    }

    expect(
      resolveKnowledgeDocumentState({
        contentJson,
        contentVersion: DOCUMENT_CONTENT_VERSION,
        contentStatus: 'ready',
      }),
    ).toEqual({
      kind: 'ready',
      contentJson,
      contentVersion: DOCUMENT_CONTENT_VERSION,
    })
  })

  it('legacy_html 状态阻断旧 HTML 正文', () => {
    expect(
      resolveKnowledgeDocumentState({
        content: '<p>旧正文</p>',
      }),
    ).toEqual({
      kind: 'legacy_html',
      reason: 'legacy_html',
    })
  })

  it('legacy_html 状态优先由显式状态字段驱动，不依赖旧 content 字段返回', () => {
    expect(
      resolveKnowledgeDocumentState({
        contentJson: null,
        contentVersion: 0,
        contentStatus: 'legacy_html',
      }),
    ).toEqual({
      kind: 'legacy_html',
      reason: 'legacy_html',
    })
  })

  it('invalid 状态阻断异常正文', () => {
    expect(
      resolveKnowledgeDocumentState({
        contentJson: {
          type: 'paragraph',
        },
        contentVersion: 0,
        contentStatus: 'ready',
      }),
    ).toEqual({
      kind: 'invalid',
      reason: 'invalid_document',
    })
  })

  it('invalid 状态优先于看起来合法的 ready 文档', () => {
    const contentJson: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    }

    expect(
      resolveKnowledgeDocumentState({
        contentJson,
        contentVersion: DOCUMENT_CONTENT_VERSION,
        contentStatus: 'invalid',
      }),
    ).toEqual({
      kind: 'invalid',
      reason: 'invalid_document',
    })
  })

  it('编辑阻断文案统一从状态工具读取', () => {
    expect(getKnowledgeDocumentBlockMessage('edit', 'legacy_html')).toEqual({
      title: '旧数据暂不支持编辑',
      description: '当前知识正文仍为旧版 HTML 数据，暂不支持编辑。',
    })

    expect(getKnowledgeDocumentBlockMessage('edit', 'invalid')).toEqual({
      title: '文档数据异常，暂不支持编辑',
      description: '当前知识正文结构异常，请先修复文档数据后再编辑。',
    })
  })

  it('错误码映射为最小前端提示文案', () => {
    expect(mapKnowledgeDocumentErrorCode('DOCUMENT_CONTENT_REQUIRED')).toBe('文档数据异常，暂不支持编辑')
    expect(mapKnowledgeDocumentErrorCode('DOCUMENT_INVALID_ROOT')).toBe('文档数据异常，暂不支持编辑')
    expect(mapKnowledgeDocumentErrorCode('DOCUMENT_LEGACY_READONLY')).toBe('旧数据暂不支持编辑')
    expect(mapKnowledgeDocumentErrorCode('DOCUMENT_INVALID_CONTENT')).toBe('文档数据异常，暂不支持编辑')
    expect(mapKnowledgeDocumentErrorCode('DOCUMENT_INVALID_SCHEMA')).toBe('文档数据异常，暂不支持编辑')
    expect(mapKnowledgeDocumentErrorCode('DOCUMENT_SCHEMA_UNSUPPORTED')).toBe('文档数据异常，暂不支持编辑')
    expect(mapKnowledgeDocumentErrorCode('DOCUMENT_UNSUPPORTED_NODE')).toBe('文档数据异常，暂不支持编辑')
    expect(mapKnowledgeDocumentErrorCode('DOCUMENT_UNSUPPORTED_MARK')).toBe('文档数据异常，暂不支持编辑')
    expect(mapKnowledgeDocumentErrorCode('UNKNOWN_ERROR')).toBe('操作失败，请稍后重试')
  })

  it('错误码映射优先读取业务 errorCode 而不是 HTTP code', () => {
    const responseData = {
      code: 200,
      errorCode: 'DOCUMENT_LEGACY_READONLY',
    }

    expect(mapKnowledgeDocumentErrorCode(responseData.errorCode)).toBe('旧数据暂不支持编辑')
  })

  it('模板初始化改为结构化文档', () => {
    expect(createStructuredTemplateDocument('## 背景说明\n第一行\n\n- 检查项 A\n- 检查项 B')).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: {
            level: 2,
          },
          content: [
            {
              type: 'text',
              text: '背景说明',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '第一行',
            },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '检查项 A',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '检查项 B',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  })
})
