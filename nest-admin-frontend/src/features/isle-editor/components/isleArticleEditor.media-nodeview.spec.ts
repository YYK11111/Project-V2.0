import { createApp, h, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import IsleEditor from '../isle-editor.js'
import { NotionKit } from '../kit'

describe('IsleEditor media node view runtime', () => {
  it('编辑器挂载后插入空图片节点时应挂载 MediaBlock node view', async () => {
    const originalElementFromPoint = document.elementFromPoint
    const originalCreateRange = document.createRange

    document.elementFromPoint = vi.fn(() => document.body)
    document.createRange = vi.fn(
      () => ({
        setEnd: vi.fn(),
        setStart: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
        })),
        getClientRects: vi.fn(() => []),
        commonAncestorContainer: document.body,
      }) as unknown as Range,
    ) as typeof document.createRange

    const container = document.createElement('div')
    document.body.appendChild(container)
    const editorRef = { current: null }

    const app = createApp({
      render() {
        return h(IsleEditor, {
          ref: (value) => {
            editorRef.current = value
          },
          modelValue: {
            type: 'doc',
            content: [],
          },
          output: 'json',
          extensions: [
            NotionKit.configure({
              image: {},
              video: {},
              attachment: {},
              dragHandle: false,
            }),
          ],
          mediaHandlers: {},
        })
      },
    })

    app.mount(container)
    await nextTick()
    await nextTick()

    const editorInstance = editorRef.current?.editor
    const imageExtension = editorInstance?.extensionManager?.extensions?.find((item) => item.name === 'image')

    expect(editorInstance?.contentComponent).toBeTruthy()
    expect(typeof imageExtension?.options?.nodeView).toBe('function')

    imageExtension.options.command({
      editor: editorInstance,
      params: {},
    })

    await nextTick()

    expect(container.querySelector('[data-node-view-wrapper]')).not.toBeNull()
    expect(container.textContent).toContain('上传本地文件')
    expect(container.textContent).toContain('通过链接插入')

    app.unmount()
    container.remove()
    document.elementFromPoint = originalElementFromPoint
    document.createRange = originalCreateRange
  })
})
