import { beforeEach, describe, expect, it, vi } from 'vitest'

const { uploadMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
}))

vi.mock('@/api/common', () => ({
  upload: uploadMock,
}))

import { useIsleUpload } from './useIsleUpload'

describe('useIsleUpload adapter', () => {
  beforeEach(() => {
    uploadMock.mockReset()
  })

  it('将 bare path 图片上传结果规范化为 src', async () => {
    uploadMock.mockResolvedValue({
      code: 200,
      data: {
        url: 'article/demo.png',
      },
    })

    const adapter = useIsleUpload()
    const result = await adapter.uploadImage(new File(['img'], 'demo.png', { type: 'image/png' }))

    expect(result).toEqual({
      src: '/upload/article/demo.png',
      name: 'demo.png',
      type: 'image',
    })
  })

  it('将附件上传结果保持为 url、name、type 并规范化 bare path', async () => {
    uploadMock.mockResolvedValue({
      code: 200,
      data: {
        url: 'docs/spec.pdf',
      },
    })

    const adapter = useIsleUpload()
    const result = await adapter.uploadAttachment(new File(['pdf'], 'spec.pdf', { type: 'application/pdf' }))

    expect(result).toEqual({
      url: '/upload/docs/spec.pdf',
      name: 'spec.pdf',
      type: 'attachment',
    })
  })

  it('保留 /static/ 图片路径并返回 src', async () => {
    uploadMock.mockResolvedValue({
      code: 200,
      data: {
        url: '/static/covers/book.png',
      },
    })

    const adapter = useIsleUpload()
    const result = await adapter.uploadImage(new File(['img'], 'book.png', { type: 'image/png' }))

    expect(result).toEqual({
      src: '/static/covers/book.png',
      name: 'book.png',
      type: 'image',
    })
  })

  it('保留 /upload/ 视频路径并返回 src', async () => {
    uploadMock.mockResolvedValue({
      code: 200,
      data: {
        url: '/upload/videos/demo.mp4',
      },
    })

    const adapter = useIsleUpload()
    const result = await adapter.uploadVideo(new File(['video'], 'demo.mp4', { type: 'video/mp4' }))

    expect(result).toEqual({
      src: '/upload/videos/demo.mp4',
      name: 'demo.mp4',
      type: 'video',
    })
  })

  it('将 static bare path 规范化为 /static/ 路径', async () => {
    uploadMock.mockResolvedValue({
      code: 200,
      data: {
        url: 'static/docs/manual.pdf',
      },
    })

    const adapter = useIsleUpload()
    const result = await adapter.uploadAttachment(new File(['pdf'], 'manual.pdf', { type: 'application/pdf' }))

    expect(result).toEqual({
      url: '/static/docs/manual.pdf',
      name: 'manual.pdf',
      type: 'attachment',
    })
  })

  it('保留完整的绝对地址', async () => {
    uploadMock
      .mockResolvedValueOnce({
        code: 200,
        data: {
          url: 'https://cdn.example.com/book.png',
        },
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          url: 'https://cdn.example.com/video.mp4',
        },
      })

    const adapter = useIsleUpload()
    const image = await adapter.uploadImage(new File(['img'], 'book.png', { type: 'image/png' }))
    const video = await adapter.uploadVideo(new File(['video'], 'demo.mp4', { type: 'video/mp4' }))

    expect(image).toEqual({
      src: 'https://cdn.example.com/book.png',
      name: 'book.png',
      type: 'image',
    })
    expect(video).toEqual({
      src: 'https://cdn.example.com/video.mp4',
      name: 'demo.mp4',
      type: 'video',
    })
  })

  it('上传失败时优先抛出后端错误信息', async () => {
    uploadMock.mockResolvedValue({
      code: 500,
      msg: '文件类型不支持',
      data: {},
    })

    const adapter = useIsleUpload()

    await expect(adapter.uploadImage(new File(['img'], 'broken.png', { type: 'image/png' })))
      .rejects.toThrow('文件类型不支持')
  })

  it('上传成功但缺少 URL 时抛错', async () => {
    uploadMock.mockResolvedValue({
      code: 200,
      data: {},
    })

    const adapter = useIsleUpload()

    await expect(adapter.uploadImage(new File(['img'], 'broken.png', { type: 'image/png' })))
      .rejects.toThrow('上传缺少文件地址')
  })
})
