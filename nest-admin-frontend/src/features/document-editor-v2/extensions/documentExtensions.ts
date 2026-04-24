import { Extension } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'

const BlockId = Extension.create({
  name: 'blockId',
  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph',
          'heading',
          'bulletList',
          'orderedList',
          'taskList',
          'blockquote',
          'codeBlock',
          'horizontalRule',
          'table',
          'image',
        ],
        attributes: {
          blockId: {
            default: null,
          },
        },
      },
    ]
  },
})

export function createDocumentExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      link: false,
      underline: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      defaultProtocol: 'https',
    }),
    Image,
    Placeholder.configure({
      placeholder,
    }),
    Table,
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    BlockId,
  ]
}
