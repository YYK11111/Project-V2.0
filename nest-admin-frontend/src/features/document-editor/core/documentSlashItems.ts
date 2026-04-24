import type { DocumentCommandKey, DocumentCommandPayload } from './documentCommands'

export type DocumentSlashItem = {
  id: string
  title: string
  subtext: string
  aliases: string[]
  group: 'basic' | 'lists' | 'blocks' | 'media'
  command: DocumentCommandKey | 'insertImage'
  payload?: DocumentCommandPayload
}

export const documentSlashItems: DocumentSlashItem[] = [
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
]
