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
        id: 'heading_1',
        title: '标题 1',
        subtext: '大标题，用于页面主层级标题',
        aliases: ['h1', 'heading1', '一级标题'],
        group: 'basic',
        command: 'toggleHeading',
        payload: {
          level: 1,
        },
      },
      {
        id: 'heading_2',
        title: '标题 2',
        subtext: '章节标题，用于正文主分节',
        aliases: ['h2', 'heading2', '二级标题'],
        group: 'basic',
        command: 'toggleHeading',
        payload: {
          level: 2,
        },
      },
      {
        id: 'heading_3',
        title: '标题 3',
        subtext: '子标题，用于次级内容分组',
        aliases: ['h3', 'heading3', '三级标题'],
        group: 'basic',
        command: 'toggleHeading',
        payload: {
          level: 3,
        },
      },
      {
        id: 'paragraph',
        title: '正文',
        subtext: '普通文本段落',
        aliases: ['text', 'paragraph', '正文'],
        group: 'basic',
        command: 'clearFormatting',
      },
      {
        id: 'bullet_list',
        title: '无序列表',
        subtext: '创建带圆点的列表项',
        aliases: ['bullet', 'list', 'ul'],
        group: 'lists',
        command: 'toggleBulletList',
      },
      {
        id: 'ordered_list',
        title: '有序列表',
        subtext: '创建按编号排序的列表项',
        aliases: ['ordered', 'numbered', 'ol'],
        group: 'lists',
        command: 'toggleOrderedList',
      },
      {
        id: 'blockquote',
        title: '引用',
        subtext: '突出展示引用内容或备注',
        aliases: ['quote', 'blockquote', '引用'],
        group: 'blocks',
        command: 'toggleBlockquote',
      },
      {
        id: 'code_block',
        title: '代码块',
        subtext: '插入预格式化代码内容',
        aliases: ['code', 'codeblock', '代码'],
        group: 'blocks',
        command: 'toggleCodeBlock',
      },
      {
        id: 'divider',
        title: '分割线',
        subtext: '插入分隔内容的水平线',
        aliases: ['divider', 'hr', 'separator'],
        group: 'blocks',
        command: 'insertHorizontalRule',
      },
      {
        id: 'table',
        title: '表格',
        subtext: '插入 3 x 3 表格块',
        aliases: ['table', 'grid', '表格'],
        group: 'media',
        command: 'insertTable',
      },
      {
        id: 'image',
        title: '图片',
        subtext: '插入图片占位块',
        aliases: ['image', 'photo', '图片'],
        group: 'media',
        command: 'insertImage',
      },
    ])
  })
})
