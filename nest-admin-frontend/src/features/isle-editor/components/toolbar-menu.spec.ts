import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import IsleEditorToolbar from './toolbar-menu/toolbar-menu.js'

function createToolbarEditor() {
  return {
    extensionManager: {
      extensions: [
        {
          name: 'bulletList',
          type: 'node',
          options: {
            name: 'bulletList',
            command: () => true,
            isActive: () => false,
          },
        },
        {
          name: 'orderedList',
          type: 'node',
          options: {
            name: 'orderedList',
            command: () => true,
            isActive: () => false,
          },
        },
      ],
    },
  }
}

describe('IsleEditorToolbar', () => {
  it('无序列表和有序列表按钮应渲染图标', () => {
    const wrapper = mount(IsleEditorToolbar, {
      props: {
        editor: createToolbarEditor(),
        sort: ['bulletList', 'orderedList'],
      },
    })

    const buttons = wrapper.findAll('button.isle-editor-button')
    const icons = wrapper.findAll('svg')

    expect(buttons).toHaveLength(2)
    expect(icons).toHaveLength(2)
    expect(icons[0].attributes('viewBox')).toBeTruthy()
    expect(icons[1].attributes('viewBox')).toBeTruthy()
  })
})
