// @vitest-environment jsdom
import type { JSONContent } from '@tiptap/core'
import { createApp, h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import DocumentEditorV2 from './DocumentEditorV2.vue'

type ComponentPublicInstanceLike = {
  editor?: {
    isDestroyed: boolean
    getJSON: () => JSONContent
    commands: {
      setContent: (content: JSONContent) => void
    }
  }
}

type MountResult = {
  app: ReturnType<typeof createApp>
  container: HTMLDivElement
  vm: ComponentPublicInstanceLike | null
  unmount: () => void
}

function mountComponent(props: {
  contentJson?: JSONContent
  disabled?: boolean
  placeholder?: string
} = {}): MountResult {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let vm: ComponentPublicInstanceLike | null = null

  const app = createApp({
    render() {
      return h(DocumentEditorV2, {
        ...props,
        ref: (value: unknown) => {
          vm = isComponentPublicInstanceLike(value) ? value : null
        },
      })
    },
  })

  app.mount(container)

  return {
    app,
    container,
    vm,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

describe('DocumentEditorV2', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('可挂载并渲染基础容器', async () => {
    const wrapper = mountComponent()
    await nextTick()

    expect(wrapper.container.querySelector('.document-editor-v2')).not.toBeNull()
    expect(wrapper.container.querySelector('.document-editor-v2__surface')).not.toBeNull()

    wrapper.unmount()
  })

  it('能接受 contentJson 并创建真实 editor', async () => {
    const contentJson: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '测试内容' }],
        },
      ],
    }

    const wrapper = mountComponent({
      contentJson,
      placeholder: '请输入文档内容',
    })

    await nextTick()

    const rootElement = wrapper.container.querySelector('.document-editor-v2')
    expect(rootElement).not.toBeNull()

    expect(wrapper.vm?.editor).toBeTruthy()
    expect(wrapper.vm?.editor?.isDestroyed).toBe(false)
    expect(wrapper.vm?.editor?.getJSON()).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '测试内容' }],
        },
      ],
    })

    wrapper.unmount()
  })

  it('块首输入 / 时显示 slash 菜单', async () => {
    const wrapper = mountComponent({
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
      placeholder: '请输入文档内容',
    })

    await nextTick()

    wrapper.vm?.editor?.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '/' }],
        },
      ],
    })

    await nextTick()

    expect(wrapper.container.querySelector('.document-slash-menu')).not.toBeNull()

    wrapper.unmount()
  })
})

function isComponentPublicInstanceLike(value: unknown): value is ComponentPublicInstanceLike {
  return typeof value === 'object' && value !== null
}
