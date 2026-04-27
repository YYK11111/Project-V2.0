import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import Text from '@tiptap/extension-text'

import AttachmentExtension from './attachment.js'
import DocumentExtension from './document.js'
import ImageExtension from './image.js'
import ParagraphExtension from './paragraph.js'
import VideoExtension from './video.js'

describe('media node schemas', () => {
  it('image uses src attr and keeps metadata fields', () => {
    const image = ImageExtension.configure()
    const attrs = image.config.addAttributes()

    expect(image.name).toBe('image')
    expect(image.options.name).toBe('image')
    expect(typeof image.options.command).toBe('function')
    expect(Object.keys(attrs)).toEqual([
      'src',
      'alt',
      'title',
      'name',
      'size',
      'mime',
      'width',
      'status',
      'error'
    ])
    expect(attrs.src.renderHTML({ src: '/upload/demo.png' })).toEqual({ 'data-src': '/upload/demo.png' })
    expect(attrs.src.parseHTML({
      getAttribute: () => '/upload/fallback.png',
      querySelector: () => ({ getAttribute: () => '/upload/demo.png' })
    })).toBe('/upload/demo.png')
    expect(attrs.status.parseHTML({
      getAttribute: () => null,
      querySelector: () => null
    })).toBe('idle')
  })

  it('video uses src attr and attachment uses url attr', () => {
    const video = VideoExtension.configure()
    const attachment = AttachmentExtension.configure()
    const videoAttrs = video.config.addAttributes()
    const attachmentAttrs = attachment.config.addAttributes()

    expect(video.name).toBe('video')
    expect(attachment.name).toBe('attachment')
    expect(typeof video.options.command).toBe('function')
    expect(typeof attachment.options.command).toBe('function')
    expect(videoAttrs.src.renderHTML({ src: '/upload/demo.mp4' })).toEqual({ 'data-src': '/upload/demo.mp4' })
    expect(attachmentAttrs.url.renderHTML({ url: '/upload/demo.pdf' })).toEqual({ 'data-url': '/upload/demo.pdf' })
    expect(videoAttrs.src.parseHTML({
      getAttribute: () => '/upload/fallback.mp4',
      querySelector: () => ({ getAttribute: () => '/upload/demo.mp4' })
    })).toBe('/upload/demo.mp4')
    expect(attachmentAttrs.url.parseHTML({
      getAttribute: () => '/upload/fallback.pdf',
      querySelector: () => ({ getAttribute: () => '/upload/demo.pdf' })
    })).toBe('/upload/demo.pdf')
    expect(videoAttrs.status.parseHTML({
      getAttribute: () => null,
      querySelector: () => null
    })).toBe('idle')
    expect(attachmentAttrs.status.parseHTML({
      getAttribute: () => null,
      querySelector: () => null
    })).toBe('idle')
  })

  it('slash commands insert media nodes with expected payload keys', () => {
    const editor = new Editor({
      extensions: [DocumentExtension, ParagraphExtension, Text, ImageExtension, VideoExtension, AttachmentExtension],
      content: '<p>before</p>'
    })

    ImageExtension.options.command({
      editor,
      params: {
        src: '/upload/demo.png',
        alt: '示例图片',
        name: 'demo.png',
        mime: 'image/png'
      }
    })

    VideoExtension.options.command({
      editor,
      params: {
        src: '/upload/demo.mp4',
        poster: '/upload/demo-cover.png',
        name: 'demo.mp4',
        mime: 'video/mp4'
      }
    })

    AttachmentExtension.options.command({
      editor,
      params: {
        url: '/upload/demo.pdf',
        name: 'demo.pdf',
        mime: 'application/pdf',
        ext: 'pdf'
      }
    })

    const mediaNodes = editor.getJSON().content?.filter(node => ['image', 'video', 'attachment'].includes(node.type))

    expect(mediaNodes).toEqual([
      {
        type: 'image',
        attrs: {
          src: '/upload/demo.png',
          alt: '示例图片',
          title: '',
          name: 'demo.png',
          size: 0,
          mime: 'image/png',
          width: '',
          status: 'idle',
          error: ''
        }
      },
      {
        type: 'video',
        attrs: {
          src: '/upload/demo.mp4',
          poster: '/upload/demo-cover.png',
          title: '',
          name: 'demo.mp4',
          size: 0,
          mime: 'video/mp4',
          width: '',
          status: 'idle',
          error: ''
        }
      },
      {
        type: 'attachment',
        attrs: {
          url: '/upload/demo.pdf',
          title: '',
          name: 'demo.pdf',
          size: 0,
          mime: 'application/pdf',
          ext: 'pdf',
          status: 'idle',
          error: ''
        }
      }
    ])

    editor.destroy()
  })
})
