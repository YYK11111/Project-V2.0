import { mergeAttributes, Node } from '@tiptap/core'
import { prefixClass } from '../utils/prefix.js'

const source = {
  slash: true,
  name: 'video',
  desc: '插入视频',
  command: ({ editor, range, params = {} }) => {
    const attrs = {
      src: params.src || '',
      poster: params.poster || '',
      title: params.title || '',
      name: params.name || '',
      size: params.size || 0,
      mime: params.mime || '',
      width: params.width || '',
      status: params.status || 'idle',
      error: params.error || ''
    }

    const chain = editor.chain().focus()

    if (range) {
      chain.deleteRange(range)
    }

    chain.insertContent({
      type: 'video',
      attrs
    })

    return chain.run()
  },
  isActive: ({ editor }) => editor.isActive('video'),
  HTMLAttributes: {
    class: `${prefixClass}__video`
  }
}

export default Node.create({
  name: 'video',

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
      src: {
        default: '',
        parseHTML: element => element.querySelector('video')?.getAttribute('src') || '',
        renderHTML: attributes => attributes.src ? { 'data-src': attributes.src } : {}
      },
      poster: {
        default: '',
        parseHTML: element => element.querySelector('video')?.getAttribute('poster') || '',
        renderHTML: attributes => attributes.poster ? { 'data-poster': attributes.poster } : {}
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
      width: {
        default: '',
        parseHTML: element => element.getAttribute('data-width') || '',
        renderHTML: attributes => attributes.width ? { 'data-width': attributes.width } : {}
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
        tag: 'figure[data-type="video"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const { src, poster } = node.attrs

    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'video'
      }),
      ['video', { src, poster, controls: 'true' }]
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
      setVideo:
        attrs =>
        ({ editor, chain }) => {
          return source.command({ editor, params: attrs, range: null, chain })
        }
    }
  }
})
