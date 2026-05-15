import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MessageBell from './MessageBell.vue'

const routerPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    name: '测试用户',
  }),
}))

vi.mock('@/api/system/message', () => ({
  getUnreadCount: vi.fn(() => Promise.resolve({ total: 1, todo: 1, cc: 0 })),
  getRecentMessages: vi.fn(() => Promise.resolve({
    todo: [
      {
        id: 'todo-1',
        title: '审批待办',
        messageType: 'todo',
        starterName: '张三',
        createTime: '2026-05-15 10:00:00',
        linkUrl: '/workflow/tasks',
        linkParams: { id: 'task-1' },
      },
    ],
    cc: [],
  })),
  markMessageRead: vi.fn(() => Promise.resolve()),
}))

describe('MessageBell', () => {
  beforeEach(() => {
    routerPush.mockClear()
  })

  it('点击待办后关闭铃铛弹窗', async () => {
    const wrapper = mount(MessageBell, {
      global: {
        stubs: {
          ElPopover: {
            props: ['visible'],
            emits: ['update:visible', 'show'],
            template: '<div><slot name="reference" /><slot /></div>',
          },
          ElBadge: {
            template: '<div><slot /></div>',
          },
          ElTabs: {
            template: '<div><slot /></div>',
          },
          ElTabPane: {
            template: '<div><slot /></div>',
          },
          ElEmpty: {
            template: '<div />',
          },
          ElButton: {
            template: '<button type="button"><slot /></button>',
          },
          ElIconBell: {
            template: '<span />',
          },
        },
      },
    })

    await flushPromises()
    ;(wrapper.vm as any).popoverVisible = true
    await wrapper.vm.$nextTick()

    await wrapper.find('.message-item').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({ path: '/workflow/tasks', query: { id: 'task-1' } })
    expect((wrapper.vm as any).popoverVisible).toBe(false)
  })
})
