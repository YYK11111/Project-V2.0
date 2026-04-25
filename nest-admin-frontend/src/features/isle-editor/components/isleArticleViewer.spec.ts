import { createApp, h, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'

import IsleArticleViewer from './IsleArticleViewer.vue'

describe('IsleArticleViewer', () => {
  it('渲染只读容器', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const app = createApp({
      render() {
        return h(IsleArticleViewer, {
          content: {
            type: 'doc',
            content: [],
          },
        })
      },
    })

    app.mount(container)
    await nextTick()

    const viewer = container.querySelector('[data-testid="isle-article-viewer"]')

    expect(viewer).not.toBeNull()
    expect(viewer?.getAttribute('aria-readonly')).toBe('true')

    app.unmount()
    container.remove()
  })

  it('在空文档与最小文本文档之间稳定渲染', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const emptyApp = createApp({
      render() {
        return h(IsleArticleViewer, {
          content: {
            type: 'doc',
            content: [],
          },
        })
      },
    })

    emptyApp.mount(container)
    await nextTick()

    expect(container.textContent?.trim()).toBe('')

    emptyApp.unmount()

    const textApp = createApp({
      render() {
        return h(IsleArticleViewer, {
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: '最小渲染边界',
                  },
                ],
              },
            ],
          },
        })
      },
    })

    textApp.mount(container)
    await nextTick()

    expect(container.textContent).toContain('最小渲染边界')

    textApp.unmount()
    container.remove()
  })

  it('输出真实标题元素供目录抽取和定位使用', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const app = createApp({
      render() {
        return h(IsleArticleViewer, {
          content: {
            type: 'doc',
            content: [
              {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '章节标题' }],
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '正文段落' }],
              },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: '列表项' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        })
      },
    })

    app.mount(container)
    await nextTick()

    const heading = container.querySelector('h2')
    const paragraph = container.querySelector('p')
    const list = container.querySelector('ul')
    const listItem = container.querySelector('li')

    expect(heading).not.toBeNull()
    expect(heading?.id).toBe('heading-1')
    expect(heading?.textContent).toBe('章节标题')
    expect(paragraph?.textContent).toContain('正文段落')
    expect(list).not.toBeNull()
    expect(listItem?.textContent).toContain('列表项')

    app.unmount()
    container.remove()
  })

  it('渲染 task、引用、代码块、媒体与表格节点', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const app = createApp({
      render() {
        return h(IsleArticleViewer, {
          content: {
            type: 'doc',
            content: [
              {
                type: 'taskList',
                content: [
                  {
                    type: 'taskItem',
                    attrs: { checked: true },
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: '待办项' }] }],
                  },
                ],
              },
              {
                type: 'blockquote',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '引用内容' }] }],
              },
              {
                type: 'codeBlock',
                content: [{ type: 'text', text: 'const a = 1' }],
              },
              {
                type: 'image',
                attrs: { src: '/upload/demo.png', alt: '示例图片' },
              },
              {
                type: 'attachment',
                attrs: { url: '/upload/demo.pdf', name: 'demo.pdf' },
              },
              {
                type: 'video',
                attrs: { url: '/upload/demo.mp4' },
              },
              {
                type: 'table',
                content: [
                  {
                    type: 'tableRow',
                    content: [
                      {
                        type: 'tableHeader',
                        content: [{ type: 'paragraph', content: [{ type: 'text', text: '表头' }] }],
                      },
                      {
                        type: 'tableCell',
                        content: [{ type: 'paragraph', content: [{ type: 'text', text: '单元格' }] }],
                      },
                    ],
                  },
                ],
              },
              {
                type: 'divider',
              },
            ],
          },
        })
      },
    })

    app.mount(container)
    await nextTick()

    expect(container.querySelector('[data-node-type="taskList"]')).not.toBeNull()
    expect(container.querySelector('[data-node-type="taskItem"]')?.getAttribute('data-checked')).toBe('true')
    expect(container.querySelector('blockquote')?.textContent).toContain('引用内容')
    expect(container.querySelector('pre code')?.textContent).toContain('const a = 1')
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/upload/demo.png')
    expect(container.querySelector('[data-node-type="attachment"]')?.textContent).toContain('demo.pdf')
    expect(container.querySelector('[data-node-type="video"]')?.getAttribute('src')).toBe('/upload/demo.mp4')
    expect(container.querySelector('table')?.textContent).toContain('表头')
    expect(container.querySelector('table')?.textContent).toContain('单元格')
    expect(container.querySelector('[data-node-type="divider"]')).not.toBeNull()

    app.unmount()
    container.remove()
  })
})
