import type { DocumentCommandKey, DocumentCommandPayload } from './documentCommands'

export type DocumentSlashItem = {
  title: string
  command: DocumentCommandKey | 'insertImage'
  payload?: DocumentCommandPayload
}

export const documentSlashItems: DocumentSlashItem[] = [
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
]
