import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'

export function createDocumentExtensions(placeholder: string) {
  return [
    StarterKit,
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
  ]
}
