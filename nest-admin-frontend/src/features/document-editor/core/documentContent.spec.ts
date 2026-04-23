import { describe, expect, it } from 'vitest'

import { documentCommandKeys } from './documentCommands'
import { createEmptyDocument } from './documentContent'
import { createDocumentExtensions } from './documentExtensions'
import { documentSlashItems } from './documentSlashItems'
import { isEditableDocumentStatus, isViewableDocumentStatus } from './documentStatus'

describe('document-editor core', () => {
  it('createEmptyDocument 返回最小空文档结构', () => {
    expect(createEmptyDocument()).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    })
  })

  it('文档状态工具区分可编辑与可查看状态', () => {
    expect(isEditableDocumentStatus('draft')).toBe(true)
    expect(isEditableDocumentStatus('published')).toBe(false)
    expect(isViewableDocumentStatus('draft')).toBe(true)
    expect(isViewableDocumentStatus('archived')).toBe(true)
    expect(isViewableDocumentStatus('deleted')).toBe(false)
  })

  it('扩展集合包含第一版基础扩展', () => {
    const extensionNames = createDocumentExtensions('请输入内容').map((extension) => extension.name)

    expect(extensionNames).toEqual([
      'starterKit',
      'underline',
      'link',
      'image',
      'placeholder',
      'table',
      'tableRow',
      'tableHeader',
      'tableCell',
    ])
  })

  it('命令层暴露规定的命令键', () => {
    expect(documentCommandKeys).toEqual([
      'toggleHeading',
      'toggleBulletList',
      'toggleOrderedList',
      'toggleBlockquote',
      'toggleCodeBlock',
      'insertHorizontalRule',
      'insertTable',
      'setLink',
      'clearFormatting',
    ])
  })

  it('slash menu 包含第一版基础项', () => {
    expect(documentSlashItems).toEqual([
      {
        title: '标题',
        command: 'toggleHeading',
        payload: {
          level: 2,
        },
      },
      {
        title: '无序列表',
        command: 'toggleBulletList',
      },
      {
        title: '有序列表',
        command: 'toggleOrderedList',
      },
      {
        title: '引用',
        command: 'toggleBlockquote',
      },
      {
        title: '代码块',
        command: 'toggleCodeBlock',
      },
      {
        title: '分割线',
        command: 'insertHorizontalRule',
      },
      {
        title: '表格',
        command: 'insertTable',
      },
      {
        title: '图片',
        command: 'insertImage',
      },
    ])
  })
})
