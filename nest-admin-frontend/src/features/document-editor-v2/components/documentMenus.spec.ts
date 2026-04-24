// @vitest-environment jsdom
import type { Component } from 'vue'
import { createApp, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DocumentBlockDefinition } from '../core/blockTypes'
import type { TocItem } from '../core/toc'
import DocumentBlockMenu from './DocumentBlockMenu.vue'
import DocumentToc from './DocumentToc.vue'
import DocumentToolbar from './DocumentToolbar.vue'

type MountResult = {
  container: HTMLDivElement
  unmount: () => void
}

function mountComponent(component: Component, props: Record<string, unknown>): MountResult {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    render() {
      return h(component, props)
    },
  })

  app.mount(container)

  return {
    container,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

describe('document editor v2 menus', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('toolbar 渲染块定义标题', async () => {
    const items: readonly DocumentBlockDefinition[] = [
      {
        type: 'paragraph',
        title: '正文',
        aliases: ['text'],
        group: 'basic',
        showInSlashMenu: true,
        showInToolbar: true,
        showInBlockMenu: true,
        includeInToc: false,
      },
      {
        type: 'heading1',
        title: '一级标题',
        aliases: ['h1'],
        group: 'heading',
        showInSlashMenu: true,
        showInToolbar: true,
        showInBlockMenu: true,
        includeInToc: true,
      },
    ]

    const wrapper = mountComponent(DocumentToolbar, { items })
    await nextTick()

    const textContent = wrapper.container.textContent ?? ''
    expect(textContent).toContain('正文')
    expect(textContent).toContain('一级标题')

    wrapper.unmount()
  })

  it('toolbar 点击时会发出 select 事件', async () => {
    const onSelect = vi.fn()
    const items: readonly DocumentBlockDefinition[] = [
      {
        type: 'paragraph',
        title: '正文',
        aliases: ['text'],
        group: 'basic',
        showInSlashMenu: true,
        showInToolbar: true,
        showInBlockMenu: true,
        includeInToc: false,
      },
    ]

    const wrapper = mountComponent(DocumentToolbar, {
      items,
      onSelect,
    })
    await nextTick()

    const button = wrapper.container.querySelector('.document-toolbar__button') as HTMLButtonElement | null
    button?.click()

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(items[0])

    wrapper.unmount()
  })

  it('TOC 渲染标题文本和激活态', async () => {
    const items: readonly TocItem[] = [
      {
        blockId: 'block-1',
        level: 1,
        text: '第一章',
      },
      {
        blockId: 'block-2',
        level: 2,
        text: '第二节',
      },
    ]

    const wrapper = mountComponent(DocumentToc, {
      items,
      activeBlockId: 'block-2',
    })
    await nextTick()

    const textContent = wrapper.container.textContent ?? ''
    expect(textContent).toContain('第一章')
    expect(textContent).toContain('第二节')

    const activeItem = wrapper.container.querySelector('.document-toc__item.is-active')
    expect(activeItem?.textContent ?? '').toContain('第二节')

    wrapper.unmount()
  })

  it('TOC 点击时会发出 select 事件', async () => {
    const onSelect = vi.fn()
    const items: readonly TocItem[] = [
      {
        blockId: 'block-1',
        level: 1,
        text: '第一章',
      },
    ]

    const wrapper = mountComponent(DocumentToc, {
      items,
      activeBlockId: '',
      onSelect,
    })
    await nextTick()

    const button = wrapper.container.querySelector('.document-toc__item') as HTMLButtonElement | null
    button?.click()

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('block-1')

    wrapper.unmount()
  })

  it('block menu 点击时会发出 select 事件', async () => {
    const onSelect = vi.fn()
    const items: readonly DocumentBlockDefinition[] = [
      {
        type: 'codeBlock',
        title: '代码块',
        aliases: ['code'],
        group: 'basic',
        showInSlashMenu: true,
        showInToolbar: true,
        showInBlockMenu: true,
        includeInToc: false,
      },
    ]

    const wrapper = mountComponent(DocumentBlockMenu, {
      items,
      onSelect,
    })
    await nextTick()

    const button = wrapper.container.querySelector('.document-block-menu__item') as HTMLButtonElement | null
    button?.click()

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(items[0])

    wrapper.unmount()
  })
})
