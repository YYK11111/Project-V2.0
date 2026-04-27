import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import IButton from './button.js'

describe('IButton', () => {
  it('应把 click 事件透传给真实按钮元素', async () => {
    const onClick = vi.fn()
    const wrapper = mount(IButton, {
      attrs: {
        onClick,
      },
      slots: {
        default: '上传',
      },
    })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalled()
  })
})
