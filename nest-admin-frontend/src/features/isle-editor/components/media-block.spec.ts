import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import MediaBlock from './media-block/media-block.js'

function createNode(type, attrs = {}) {
  return {
    type: { name: type },
    attrs,
  }
}

type MediaBlockTestOptions = {
  selected?: boolean
}

function createWrapper(type, attrs = {}, handlers = {}, options: MediaBlockTestOptions = {}) {
  return mount(MediaBlock, {
    props: {
      editor: {
        mediaHandlers: handlers,
      },
      node: createNode(type, attrs),
      selected: options.selected ?? false,
      updateAttributes: vi.fn(),
      deleteNode: vi.fn(),
    },
    global: {
      provide: {
        onDragStart: vi.fn(),
        decorationClasses: [],
      },
    },
  })
}

async function triggerFileSelect(wrapper, file) {
  const input = wrapper.find('input[type="file"]')

  Object.defineProperty(input.element, 'files', {
    value: [file],
    configurable: true,
  })

  await input.trigger('change')
}

function findPopover(wrapper) {
  return wrapper.find('.isle-editor-media-block__popover')
}

function findBottomPopover(wrapper) {
  return wrapper.find('.isle-editor-media-block__bottom-popover')
}

const mediaBlockSource = readFileSync(
  `${process.cwd()}/src/features/isle-editor/components/media-block/media-block.js`,
  'utf-8'
)

const mediaBlockStyleSource = readFileSync(
  resolve(process.cwd(), 'src/features/isle-editor/styles/media-block.scss'),
  'utf-8'
)

function readMediaBlockRootStyleBlock() {
  const start = mediaBlockStyleSource.indexOf('.#{$prefix}-media-block {')
  const end = mediaBlockStyleSource.indexOf('&.is-selected {')

  return mediaBlockStyleSource.slice(start, end)
}

describe('MediaBlock', () => {
  it('底部浮层样式允许浮层越过块体边界并相对块本体定位', () => {
    const source = readMediaBlockRootStyleBlock()

    expect(source).toContain('position: relative;')
    expect(source).not.toContain('overflow: hidden;')
  })

  it('图片块完成态默认不常驻展示动作面板', () => {
    const wrapper = createWrapper('image', {
      src: '/upload/demo.png',
      name: 'demo.png',
      status: 'done',
    })

    expect(wrapper.find('img').attributes('src')).toBe('/upload/demo.png')
    expect(wrapper.text()).toContain('demo.png')
    expect(wrapper.find('.isle-editor-media-block__actions').exists()).toBe(false)
    expect(findPopover(wrapper).exists()).toBe(false)
  })

  it('图片块完成态选中后通过 popover 展示动作面板', () => {
    const wrapper = createWrapper('image', {
      src: '/upload/demo.png',
      name: 'demo.png',
      status: 'done',
    }, {}, {
      selected: true,
    })

    const popover = findPopover(wrapper)

    expect(popover.exists()).toBe(true)
    expect(popover.text()).toContain('替换')
    expect(popover.text()).toContain('打开')
    expect(popover.text()).toContain('复制链接')
    expect(popover.text()).toContain('删除')
  })

  it('附件块保持文件卡片并显示元信息', () => {
    const wrapper = createWrapper('attachment', {
      url: '/upload/demo.pdf',
      name: 'demo.pdf',
      ext: 'PDF',
      size: 1024,
      status: 'done',
    })

    expect(wrapper.text()).toContain('demo.pdf')
    expect(wrapper.text()).toContain('PDF')
    expect(wrapper.text()).toContain('1.0 KB')
  })

  it('上传失败时保留块并展示错误和重试入口', async () => {
    const uploadImage = vi.fn(async () => {
      throw new Error('上传失败')
    })
    const wrapper = createWrapper('image', {}, { uploadImage })
    const file = new File(['img'], 'broken.png', { type: 'image/png' })

    await triggerFileSelect(wrapper, file)

    const updateCalls = wrapper.props('updateAttributes').mock.calls
    expect(updateCalls.at(-1)?.[0]).toMatchObject({
      status: 'error',
      error: '上传失败',
    })
    expect(uploadImage).toHaveBeenCalled()
  })

  it('空媒体块默认不常驻展示上传本地和通过链接按钮', () => {
    const wrapper = createWrapper('image', {
      status: 'idle',
    })

    const popover = findPopover(wrapper)

    expect(popover.exists()).toBe(false)
    expect(wrapper.find('.isle-editor-media-block__url-input').exists()).toBe(false)
    expect(wrapper.find('.isle-editor-media-block__content').exists()).toBe(false)
  })

  it('空媒体块被选中时显示贴块动作面板', () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    }, {}, {
      selected: true,
    })

    const bottomPopover = findBottomPopover(wrapper)

    expect(bottomPopover.exists()).toBe(true)
    expect(bottomPopover.text()).toContain('上传本地文件')
    expect(bottomPopover.text()).toContain('通过链接插入')
    expect(bottomPopover.text()).toContain('删除')
    expect(wrapper.classes()).toContain('is-selected')
  })

  it('选中空块时渲染底部悬浮浮层容器', () => {
    const wrapper = createWrapper('image', {
      status: 'idle',
    }, {}, {
      selected: true,
    })

    const bottomPopover = findBottomPopover(wrapper)

    expect(bottomPopover.exists()).toBe(true)
    expect(bottomPopover.text()).toContain('上传本地文件')
    expect(bottomPopover.text()).toContain('通过链接插入')
    expect(bottomPopover.text()).toContain('删除')
  })

  it('底部浮层容器使用块下方绝对定位合同', () => {
    expect(mediaBlockSource).toContain("position: 'absolute'")
    expect(mediaBlockSource).toContain("top: 'calc(100% + 8px)'")
    expect(mediaBlockSource).toContain("left: '0'")
  })

  it('底部浮层收敛为单一渲染入口', () => {
    expect(mediaBlockSource).toContain('function renderBottomPopover()')
    expect(mediaBlockSource).not.toContain('function renderEmptyPopover()')
    expect(mediaBlockSource).not.toContain('function renderSelectedPopover()')
    expect(mediaBlockSource).toContain('renderBottomPopover()')
  })

  it('空块本体不再包含块内 footer 或 popover 入口', () => {
    const wrapper = createWrapper('image', {
      status: 'idle',
    }, {}, {
      selected: true,
    })

    expect(wrapper.find('.isle-editor-media-block__footer').exists()).toBe(false)
    expect(wrapper.find('.isle-editor-media-block__body .isle-editor-media-block__popover').exists()).toBe(false)
  })

  it('媒体块根节点包含底部浮层定位锚点 class', () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    }, {}, {
      selected: true,
    })

    expect(wrapper.classes()).toContain('isle-editor-media-block--bottom-popover-anchor')
  })

  it('选中完成态时 popover 渲染为 body 的兄弟节点', () => {
    const wrapper = createWrapper('image', {
      src: '/upload/demo.png',
      name: 'demo.png',
      status: 'done',
    }, {}, {
      selected: true,
    })

    const body = wrapper.find('.isle-editor-media-block__body')
    const popover = findPopover(wrapper)

    expect(popover.exists()).toBe(true)
    expect(body.element.contains(popover.element)).toBe(false)
    expect(popover.element.parentElement).toBe(wrapper.element)
  })

  it('点击通过链接后在浮层中切换到链接输入态', async () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    }, {}, {
      selected: true,
    })

    const initialBottomPopover = findBottomPopover(wrapper)

    expect(initialBottomPopover.exists()).toBe(true)
    expect(initialBottomPopover.find('.isle-editor-media-block__url-input').exists()).toBe(false)

    await wrapper.findAll('button').find(button => button.text().includes('通过链接'))?.trigger('click')

    const bottomPopover = findBottomPopover(wrapper)

    expect(bottomPopover.exists()).toBe(true)
    expect(bottomPopover.find('.isle-editor-media-block__url-input').exists()).toBe(true)
  })

  it('uploading 且无 URL 时不显示纯空块 CTA', () => {
    const wrapper = createWrapper('video', {
      status: 'uploading',
      name: 'demo.mp4',
    })

    expect(wrapper.text()).not.toContain('上传本地文件')
    expect(wrapper.text()).not.toContain('通过链接插入')
    expect(wrapper.text()).toContain('上传中')
    expect(wrapper.text()).toContain('上传')
  })

  it('error 且无 URL 时保留重试语义而不是纯空块 CTA', () => {
    const wrapper = createWrapper('attachment', {
      status: 'error',
      error: '上传失败',
      name: 'broken.pdf',
    })

    expect(wrapper.text()).not.toContain('上传本地文件')
    expect(wrapper.text()).not.toContain('通过链接插入')
    expect(wrapper.text()).toContain('上传失败')
    expect(wrapper.find('.isle-editor-media-block__actions').exists()).toBe(false)
    expect(findPopover(wrapper).exists()).toBe(false)
  })

  it('错误态块选中后底部浮层只显示重试上传和删除', () => {
    const wrapper = createWrapper('attachment', {
      status: 'error',
      error: '上传失败',
      name: 'broken.pdf',
    }, {}, {
      selected: true,
    })

    const popover = findPopover(wrapper)
    const bottomPopover = findBottomPopover(wrapper)

    expect(popover.exists()).toBe(true)
    expect(bottomPopover.exists()).toBe(true)
    expect(popover.classes()).toContain('isle-editor-media-block__bottom-popover')
    expect(popover.text()).toContain('重试上传')
    expect(popover.text()).toContain('删除')
    expect(popover.text()).not.toContain('打开')
    expect(popover.text()).not.toContain('复制链接')
    expect(popover.text()).not.toContain('上传本地文件')
    expect(popover.text()).not.toContain('通过链接插入')
  })

  it('URL 确认在原块上更新而不重建块', async () => {
    const wrapper = createWrapper('video', {
      name: 'old.mp4',
      title: '旧标题',
      mime: 'video/mp4',
      size: 2048,
      ext: 'MP4',
      poster: '/upload/poster.png',
      status: 'idle',
    }, {}, {
      selected: true,
    })

    const beforeId = wrapper.findComponent(MediaBlock).vm.$.uid
    await wrapper.findAll('button').find(button => button.text().includes('通过链接插入'))?.trigger('click')

    const urlInput = wrapper.find('.isle-editor-media-block__url-input')

    await urlInput.setValue('https://cdn.test/video.mp4')
    await wrapper.findAll('button').find(button => button.text().includes('确认'))?.trigger('click')

    const updateCalls = wrapper.props('updateAttributes').mock.calls
    expect(updateCalls.at(-1)?.[0]).toMatchObject({
      src: 'https://cdn.test/video.mp4',
      name: 'video.mp4',
      title: 'video.mp4',
      status: 'done',
      error: '',
      size: 0,
      mime: '',
      ext: '',
      poster: '',
    })
    expect(wrapper.findComponent(MediaBlock).vm.$.uid).toBe(beforeId)
  })

  it('URL 确认成功后关闭浮层内链接输入态', async () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    }, {}, {
      selected: true,
    })

    await wrapper.findAll('button').find(button => button.text().includes('通过链接插入'))?.trigger('click')
    await wrapper.find('.isle-editor-media-block__url-input').setValue('https://cdn.test/file.pdf')
    await wrapper.findAll('button').find(button => button.text().includes('确认'))?.trigger('click')

    const bottomPopover = findBottomPopover(wrapper)

    expect(wrapper.props('updateAttributes')).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://cdn.test/file.pdf',
      status: 'done',
    }))
    expect(bottomPopover.exists()).toBe(true)
    expect(bottomPopover.find('.isle-editor-media-block__url-input').exists()).toBe(false)
    expect(bottomPopover.text()).toContain('上传本地文件')
    expect(bottomPopover.text()).toContain('通过链接插入')
    expect(findPopover(wrapper).classes()).toContain('isle-editor-media-block__bottom-popover')
  })

  it('通过链接后仍然使用同一个底部浮层容器', async () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    }, {}, {
      selected: true,
    })

    const initialBottomPopover = findBottomPopover(wrapper)
    const initialElement = initialBottomPopover.element

    await wrapper.findAll('button').find(button => button.text().includes('通过链接插入'))?.trigger('click')
    await wrapper.find('.isle-editor-media-block__url-input').setValue('https://cdn.test/file.pdf')
    await wrapper.findAll('button').find(button => button.text().includes('确认'))?.trigger('click')
    await wrapper.setProps({
      node: createNode('attachment', {
        url: 'https://cdn.test/file.pdf',
        name: 'file.pdf',
        title: 'file.pdf',
        status: 'done',
        error: '',
        size: 0,
        mime: '',
        ext: 'PDF',
        poster: '',
      }),
    })

    const nextBottomPopover = findBottomPopover(wrapper)

    expect(initialBottomPopover.exists()).toBe(true)
    expect(nextBottomPopover.exists()).toBe(true)
    expect(nextBottomPopover.element).toBe(initialElement)
    expect(nextBottomPopover.element.parentElement).toBe(wrapper.element)
    expect(findPopover(wrapper).classes()).toContain('isle-editor-media-block__bottom-popover')
    expect(wrapper.find('.isle-editor-media-block__body .isle-editor-media-block__popover').exists()).toBe(false)
  })

  it('无 source 的空块不显示打开操作', () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    })

    const openButton = wrapper.findAll('button').find(button => button.text().includes('打开'))
    expect(openButton).toBeUndefined()
  })

  it('错误状态下再次选择文件会复用原块重试上传', async () => {
    const uploadAttachment = vi.fn()
      .mockRejectedValueOnce(new Error('第一次失败'))
      .mockResolvedValueOnce({
        url: '/upload/retry.pdf',
        name: 'retry.pdf',
        size: 2048,
        ext: 'PDF',
        status: 'done',
      })

    const wrapper = createWrapper('attachment', {
      status: 'idle',
    }, { uploadAttachment })
    const file = new File(['pdf'], 'retry.pdf', { type: 'application/pdf' })

    await triggerFileSelect(wrapper, file)
    await triggerFileSelect(wrapper, file)

    const updateCalls = wrapper.props('updateAttributes').mock.calls
    expect(updateCalls[0]?.[0]).toMatchObject({
      status: 'uploading',
      name: 'retry.pdf',
    })
    expect(updateCalls[1]?.[0]).toMatchObject({
      status: 'error',
      error: '第一次失败',
    })
    expect(updateCalls[2]?.[0]).toMatchObject({
      status: 'uploading',
      error: '',
    })
    expect(updateCalls.at(-1)?.[0]).toMatchObject({
      url: '/upload/retry.pdf',
      status: 'done',
    })
    expect(uploadAttachment).toHaveBeenCalledTimes(2)
  })

  it('本地文件上传会先进入 uploading 再进入 done', async () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    })
    const file = new File(['pdf'], 'local.pdf', { type: 'application/pdf' })

    const originalCreateObjectURL = URL.createObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:local.pdf')

    await triggerFileSelect(wrapper, file)

    const updateCalls = wrapper.props('updateAttributes').mock.calls
    expect(updateCalls[0]?.[0]).toMatchObject({
      name: 'local.pdf',
      title: 'local.pdf',
      size: file.size,
      mime: 'application/pdf',
      ext: 'PDF',
      status: 'uploading',
      error: '',
    })
    expect(updateCalls[1]?.[0]).toMatchObject({
      url: 'blob:local.pdf',
      name: 'local.pdf',
      size: file.size,
      mime: 'application/pdf',
      ext: 'PDF',
      status: 'done',
      error: '',
    })

    URL.createObjectURL = originalCreateObjectURL
  })

  it('本地 blob 资源改为链接时会释放 object URL', async () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    })
    const file = new File(['pdf'], 'local.pdf', { type: 'application/pdf' })
    const revokeObjectURL = vi.fn()
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL

    URL.createObjectURL = vi.fn(() => 'blob:local.pdf')
    URL.revokeObjectURL = revokeObjectURL

    await triggerFileSelect(wrapper, file)
    await wrapper.setProps({
      node: createNode('attachment', {
        url: 'blob:local.pdf',
        name: 'local.pdf',
        ext: 'PDF',
        mime: 'application/pdf',
        size: file.size,
        status: 'done',
      }),
    })
    await wrapper.setProps({
      node: createNode('attachment', {
        url: 'https://cdn.test/next.pdf',
        name: 'next.pdf',
        ext: 'PDF',
        mime: '',
        size: 0,
        status: 'done',
      }),
    })

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local.pdf')

    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('组件卸载时会释放本地 blob 资源', async () => {
    const wrapper = createWrapper('image', {
      status: 'idle',
    })
    const file = new File(['img'], 'local.png', { type: 'image/png' })
    const revokeObjectURL = vi.fn()
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL

    URL.createObjectURL = vi.fn(() => 'blob:local.png')
    URL.revokeObjectURL = revokeObjectURL

    await triggerFileSelect(wrapper, file)
    await wrapper.setProps({
      node: createNode('image', {
      src: 'blob:local.png',
      name: 'local.png',
      status: 'done',
      }),
    })

    wrapper.unmount()

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local.png')

    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('删除节点时会释放本地 blob 资源', async () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    }, {}, {
      selected: true,
    })
    const file = new File(['pdf'], 'local.pdf', { type: 'application/pdf' })
    const revokeObjectURL = vi.fn()
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL

    URL.createObjectURL = vi.fn(() => 'blob:delete.pdf')
    URL.revokeObjectURL = revokeObjectURL

    await triggerFileSelect(wrapper, file)
    await wrapper.setProps({
      node: createNode('attachment', {
        url: 'blob:delete.pdf',
        name: 'local.pdf',
        ext: 'PDF',
        mime: 'application/pdf',
        size: file.size,
        status: 'done',
      }),
    })
    await wrapper.findAll('button').find(button => button.text().includes('删除'))?.trigger('click')

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:delete.pdf')
    expect(wrapper.props('deleteNode')).toHaveBeenCalled()

    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('失败后再次上传会在原块重试成功并保留已有 source', async () => {
    const uploadImage = vi.fn()
      .mockRejectedValueOnce(new Error('第一次失败'))
      .mockResolvedValueOnce({
        src: '/upload/retry.png',
        status: 'done',
      })

    const wrapper = createWrapper('image', {
      src: '/upload/old.png',
      name: 'old.png',
      title: '旧图片',
      mime: 'image/png',
      size: 1234,
      status: 'error',
      error: '历史错误',
    }, { uploadImage })
    const file = new File(['next'], 'retry.png', { type: 'image/png' })
    const beforeId = wrapper.findComponent(MediaBlock).vm.$.uid

    await triggerFileSelect(wrapper, file)

    const updateCalls = wrapper.props('updateAttributes').mock.calls
    expect(updateCalls[0]?.[0]).toMatchObject({
      name: 'retry.png',
      title: 'retry.png',
      size: file.size,
      mime: 'image/png',
      status: 'uploading',
      error: '',
      src: '/upload/old.png',
    })
    expect(updateCalls[1]?.[0]).toMatchObject({
      status: 'error',
      error: '第一次失败',
    })

    await triggerFileSelect(wrapper, file)

    expect(updateCalls[2]?.[0]).toMatchObject({
      name: 'retry.png',
      title: 'retry.png',
      size: file.size,
      mime: 'image/png',
      status: 'uploading',
      error: '',
      src: '/upload/old.png',
    })
    expect(updateCalls[3]?.[0]).toMatchObject({
      src: '/upload/retry.png',
      name: 'retry.png',
      size: file.size,
      mime: 'image/png',
      status: 'done',
      error: '',
    })
    expect(wrapper.findComponent(MediaBlock).vm.$.uid).toBe(beforeId)
    expect(uploadImage).toHaveBeenCalledTimes(2)
  })

  it('视频和附件块展示更完整的信息', () => {
    const videoWrapper = createWrapper('video', {
      src: '/upload/demo.mp4',
      name: 'demo.mp4',
      mime: 'video/mp4',
      size: 3145728,
      status: 'done',
    })
    const attachmentWrapper = createWrapper('attachment', {
      url: '/upload/demo.zip',
      name: 'demo.zip',
      ext: 'ZIP',
      mime: 'application/zip',
      size: 5242880,
      status: 'done',
    })

    expect(videoWrapper.text()).toContain('video/mp4')
    expect(videoWrapper.text()).toContain('3.0 MB')
    expect(attachmentWrapper.text()).toContain('application/zip')
    expect(attachmentWrapper.text()).toContain('5.0 MB')
  })

  it('详情区类型在没有 mime 时回退显示 ext', () => {
    const wrapper = createWrapper('attachment', {
      url: '/upload/demo.pdf',
      name: 'demo.pdf',
      ext: 'PDF',
      size: 1024,
      status: 'done',
    })

    const detailValues = wrapper.findAll('.isle-editor-media-block__detail-value').map(node => node.text())

    expect(detailValues).toContain('PDF')
  })
})
