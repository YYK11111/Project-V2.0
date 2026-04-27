import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import MediaBlock from './media-block/media-block.js'

function createNode(type, attrs = {}) {
  return {
    type: { name: type },
    attrs,
  }
}

function createWrapper(type, attrs = {}, handlers = {}) {
  return mount(MediaBlock, {
    props: {
      editor: {
        mediaHandlers: handlers,
      },
      node: createNode(type, attrs),
      selected: false,
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

describe('MediaBlock', () => {
  it('图片块完成态展示替换、打开、复制链接、删除动作', () => {
    const wrapper = createWrapper('image', {
      src: '/upload/demo.png',
      name: 'demo.png',
      status: 'done',
    })

    expect(wrapper.find('img').attributes('src')).toBe('/upload/demo.png')
    expect(wrapper.text()).toContain('demo.png')
    expect(wrapper.text()).toContain('替换')
    expect(wrapper.text()).toContain('打开')
    expect(wrapper.text()).toContain('复制链接')
    expect(wrapper.text()).toContain('删除')
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

  it('空媒体块优先展示本地上传和链接插入入口，初始不展示 URL 输入区', () => {
    const wrapper = createWrapper('image', {
      status: 'idle',
    })

    expect(wrapper.text()).toContain('上传本地文件')
    expect(wrapper.text()).toContain('通过链接插入')
    expect(wrapper.find('.isle-editor-media-block__url-input').exists()).toBe(false)
  })

  it('点击通过链接插入后才展开 URL 输入区', async () => {
    const wrapper = createWrapper('attachment', {
      status: 'idle',
    })

    expect(wrapper.find('.isle-editor-media-block__url-input').exists()).toBe(false)

    await wrapper.findAll('button').find(button => button.text().includes('通过链接插入'))?.trigger('click')

    expect(wrapper.find('.isle-editor-media-block__url-input').exists()).toBe(true)
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
    expect(wrapper.text()).toContain('重试上传')
    expect(wrapper.text()).toContain('上传失败')
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
