import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createApp, h, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'

import IsleArticleViewer from './IsleArticleViewer.vue'

function readViewerSource() {
  return readFileSync(resolve(__dirname, 'IsleArticleViewer.vue'), 'utf-8')
}

describe('isle core runtime replacement', () => {
  it('暴露上游 core 扩展注册表', async () => {
    const core = await import('../core')

    expect(typeof core.Editor).toBe('function')
    expect(core).toHaveProperty('Heading')
    expect(core).toHaveProperty('BulletList')
    expect(core).toHaveProperty('Attachment')
  })
})

describe('IsleArticleViewer', () => {
  it('集中维护媒体标记规则，且不在 viewer 内触发 TOC 提取副作用', () => {
    const source = readViewerSource()

    expect(source).toContain('const viewerNodeTypeRules = [')
    expect(source).not.toContain('extractTocItems(')
  })

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

  it('列表节点应带上前缀 class 以命中 marker 样式', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const app = createApp({
      render() {
        return h(IsleArticleViewer, {
          content: {
            type: 'doc',
            content: [
              {
                type: 'orderedList',
                content: [
                  {
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: '第一项' }] }],
                  },
                ],
              },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: '第二项' }] }],
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

    expect(container.querySelector('ol')?.className).toContain('isle-editor__ordered-list')
    expect(container.querySelector('ul')?.className).toContain('isle-editor__bullet-list')

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
                attrs: { src: '/upload/demo.mp4' },
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
    expect(container.querySelector('[data-node-type="image"]')).not.toBeNull()
    expect(container.querySelector('[data-node-type="image"] img')?.getAttribute('src')).toBe('/upload/demo.png')
    expect(container.querySelector('[data-node-type="attachment"]')).not.toBeNull()
    expect(container.querySelector('[data-node-type="attachment"] a')?.textContent).toContain('demo.pdf')
    expect(container.querySelector('[data-node-type="video"]')).not.toBeNull()
    expect(container.querySelector('[data-node-type="video"] video')?.getAttribute('src')).toBe('/upload/demo.mp4')
    expect(container.querySelector('table')?.textContent).toContain('表头')
    expect(container.querySelector('table')?.textContent).toContain('单元格')
    expect(container.querySelector('[data-node-type="divider"], hr[data-type="divider"]')).not.toBeNull()

    app.unmount()
    container.remove()
  })

  it('附件在查看态保持块级卡片容器而不是裸链接', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const app = createApp({
      render() {
        return h(IsleArticleViewer, {
          content: {
            type: 'doc',
            content: [
              {
                type: 'attachment',
                attrs: { url: '/upload/manual.pdf', name: 'manual.pdf' },
              },
            ],
          },
        })
      },
    })

    app.mount(container)
    await nextTick()

    const attachmentBlock = container.querySelector('[data-node-type="attachment"]')
    const attachmentLink = attachmentBlock?.querySelector('a')

    expect(attachmentBlock?.tagName).toBe('DIV')
    expect(attachmentBlock?.childElementCount).toBe(1)
    expect(attachmentLink?.getAttribute('href')).toBe('/upload/manual.pdf')
    expect(attachmentLink?.textContent).toContain('manual.pdf')

    app.unmount()
    container.remove()
  })
})
