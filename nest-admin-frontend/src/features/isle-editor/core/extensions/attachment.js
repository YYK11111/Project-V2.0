import { mergeAttributes, Node } from '@tiptap/core'
import { prefixClass } from '../utils/prefix.js'

const source = {
  slash: true,
  name: 'attachment',
  desc: '插入附件',
  command: ({ editor, range, params = {} }) => {
    const normalizedParams = params || {}
    const attrs = {
      url: normalizedParams.url || '',
      title: normalizedParams.title || '',
      name: normalizedParams.name || '',
      size: normalizedParams.size || 0,
      mime: normalizedParams.mime || '',
      ext: normalizedParams.ext || '',
      status: normalizedParams.status || 'idle',
      error: normalizedParams.error || ''
    }

    const chain = editor.chain().focus()

    if (range) {
      chain.deleteRange(range)
    }

    chain.insertContent({
      type: 'attachment',
      attrs
    })

    return chain.run()
  },
  isActive: ({ editor }) => editor.isActive('attachment'),
  HTMLAttributes: {
    class: `${prefixClass}__attachment`
  }
}

export default Node.create({
  name: 'attachment',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      nodeView: undefined,
      ...source
    }
  },

  addAttributes() {
    return {
      url: {
        default: '',
        parseHTML: element => element.querySelector('a')?.getAttribute('href') || '',
        renderHTML: attributes => attributes.url ? { 'data-url': attributes.url } : {}
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-title') || '',
        renderHTML: attributes => attributes.title ? { 'data-title': attributes.title } : {}
      },
      name: {
        default: '',
        parseHTML: element => element.getAttribute('data-name') || '',
        renderHTML: attributes => attributes.name ? { 'data-name': attributes.name } : {}
      },
      size: {
        default: 0,
        parseHTML: element => Number(element.getAttribute('data-size') || 0),
        renderHTML: attributes => attributes.size ? { 'data-size': String(attributes.size) } : {}
      },
      mime: {
        default: '',
        parseHTML: element => element.getAttribute('data-mime') || '',
        renderHTML: attributes => attributes.mime ? { 'data-mime': attributes.mime } : {}
      },
      ext: {
        default: '',
        parseHTML: element => element.getAttribute('data-ext') || '',
        renderHTML: attributes => attributes.ext ? { 'data-ext': attributes.ext } : {}
      },
      status: {
        default: 'idle',
        parseHTML: element => element.getAttribute('data-status') || 'idle',
        renderHTML: attributes => attributes.status && attributes.status !== 'done'
          ? { 'data-status': attributes.status }
          : {}
      },
      error: {
        default: '',
        parseHTML: element => element.getAttribute('data-error') || '',
        renderHTML: attributes => attributes.error ? { 'data-error': attributes.error } : {}
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="attachment"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const { url, name, title } = node.attrs

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'attachment'
      }),
      [
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
          title: title || name || url
        },
        name || title || url || 'attachment'
      ]
    ]
  },

  addNodeView() {
    if (typeof this.options.nodeView === 'function') {
      return this.options.nodeView
    }

    return () => undefined
  },

  addCommands() {
    return {
      setAttachment:
        attrs =>
        ({ editor, chain }) => {
          return source.command({ editor, params: attrs, range: null, chain })
        }
    }
  }
})
