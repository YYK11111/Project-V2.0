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

  it('将图片上传结果转换为编辑器资源结构', async () => {
    uploadMock.mockResolvedValue({
      code: 200,
      data: {
        url: 'article/demo.png',
      },
    })

    const adapter = useIsleUpload()
    const result = await adapter.uploadImage(new File(['img'], 'demo.png', { type: 'image/png' }))

    expect(result).toEqual({
      url: '/upload/article/demo.png',
      name: 'demo.png',
      type: 'image',
    })
  })

  it('保留已完整的上传路径并支持附件与视频', async () => {
    uploadMock
      .mockResolvedValueOnce({
        code: 200,
        data: {
          url: '/upload/docs/spec.pdf',
        },
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          url: '/static/docs/manual.pdf',
        },
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          url: 'static/covers/book.png',
        },
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          url: 'https://cdn.example.com/video.mp4',
        },
      })

    const adapter = useIsleUpload()
    const attachment = await adapter.uploadAttachment(new File(['pdf'], 'spec.pdf', { type: 'application/pdf' }))
    const staticAttachment = await adapter.uploadAttachment(new File(['pdf'], 'manual.pdf', { type: 'application/pdf' }))
    const staticImage = await adapter.uploadImage(new File(['img'], 'book.png', { type: 'image/png' }))
    const video = await adapter.uploadVideo(new File(['video'], 'demo.mp4', { type: 'video/mp4' }))

    expect(attachment).toEqual({
      url: '/upload/docs/spec.pdf',
      name: 'spec.pdf',
      type: 'attachment',
    })
    expect(staticAttachment).toEqual({
      url: '/static/docs/manual.pdf',
      name: 'manual.pdf',
      type: 'attachment',
    })
    expect(staticImage).toEqual({
      url: '/static/covers/book.png',
      name: 'book.png',
      type: 'image',
    })
    expect(video).toEqual({
      url: 'https://cdn.example.com/video.mp4',
      name: 'demo.mp4',
      type: 'video',
    })
  })

  it('上传返回缺少 URL 时抛错', async () => {
    uploadMock.mockResolvedValue({
      code: 200,
      data: {},
    })

    const adapter = useIsleUpload()

    await expect(adapter.uploadImage(new File(['img'], 'broken.png', { type: 'image/png' })))
      .rejects.toThrow('上传失败')
  })
})
