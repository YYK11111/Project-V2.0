import { upload } from '@/api/common'

export type IsleUploadAssetType = 'image' | 'attachment' | 'video'

export interface IsleImageUploadAsset {
  src: string
  name: string
  type: 'image'
}

export interface IsleAttachmentUploadAsset {
  url: string
  name: string
  type: 'attachment'
}

export interface IsleVideoUploadAsset {
  src: string
  name: string
  type: 'video'
}

export type IsleUploadAsset = IsleImageUploadAsset | IsleAttachmentUploadAsset | IsleVideoUploadAsset

interface UploadResponseData {
  url?: string
}

interface UploadResponse {
  code?: number
  msg?: string
  data?: UploadResponseData
}

function normalizeUploadUrl(url: string): string {
  if (/^https?:\/\//.test(url) || url.startsWith('/upload/') || url.startsWith('/static/')) {
    return url
  }

  if (url.startsWith('upload/')) {
    return `/${url}`
  }

  if (url.startsWith('static/')) {
    return `/${url}`
  }

  const normalized = url.replace(/^\/+/, '')
  return `/upload/${normalized}`
}

async function uploadFile(file: File, type: IsleUploadAssetType): Promise<IsleUploadAsset> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await upload(formData as unknown as { new (): FormData }) as UploadResponse

  if (response.code !== 200) {
    throw new Error(response.msg || '上传失败')
  }

  if (!response.data?.url) {
    throw new Error('上传缺少文件地址')
  }

  const normalizedUrl = normalizeUploadUrl(response.data.url)

  if (type === 'attachment') {
    return {
      url: normalizedUrl,
      name: file.name,
      type,
    }
  }

  return {
    src: normalizedUrl,
    name: file.name,
    type,
  }
}

export function useIsleUpload() {
  return {
    uploadImage(file: File) {
      return uploadFile(file, 'image')
    },
    uploadAttachment(file: File) {
      return uploadFile(file, 'attachment')
    },
    uploadVideo(file: File) {
      return uploadFile(file, 'video')
    },
  }
}
