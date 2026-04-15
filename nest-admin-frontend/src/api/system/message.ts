import request from '@/utils/request'

export function getUnreadCount() {
  return request({ url: '/system/messages/unread-count', method: 'get' })
}

export function getRecentMessages(limit = 10) {
  return request({ url: '/system/messages/recent', method: 'get', params: { limit } })
}

export function markMessageRead(id: string) {
  return request({ url: `/system/messages/read/${id}`, method: 'post' })
}
