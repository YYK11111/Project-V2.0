import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UserSelect from './UserSelect.vue'

vi.mock('@/views/system/users/api', () => ({
  getOptions: vi.fn().mockResolvedValue({
    data: {
      list: [
        {
          id: 'user-1',
          name: 'zhangsan',
          nickname: '张三',
          dept: { name: '研发部' },
        },
      ],
    },
  }),
}))

vi.mock('@/views/system/depts/api', () => ({
  getOptions: vi.fn().mockResolvedValue({ data: [] }),
}))

function readUserSelectSource() {
  return readFileSync(resolve(__dirname, 'UserSelect.vue'), 'utf-8')
}

describe('UserSelect 多选弹窗结构守卫', () => {
  it('多选人员使用弹窗选择器并在字段内部展示结果', () => {
    const source = readUserSelectSource()

    expect(source).toContain('user-select-multiple-field')
    expect(source).toContain('<el-dialog')
    expect(source).toContain('已选人员')
    expect(source).toContain('confirmSelection')
    expect(source).toContain('selected-user-overflow')
    expect(source).not.toContain('selected-user-preview')
  })

  it('单选人员也使用弹窗式人员选择器', () => {
    const source = readUserSelectSource()

    expect(source).not.toContain('<template>\n  <template>')
    expect(source).toContain('user-select user-select-field')
    expect(source).toContain('user-select-field')
    expect(source).toContain('.user-select-field {')
    expect(source).toContain('选择人员')
    expect(source).toContain('confirmSelection')
    expect(source).toContain('selectPendingUser')
    expect(source).not.toContain('<el-select\n      class="user-select"')
    expect(source).toContain('getOptions as getUserOptions')
    expect(source).toContain('getOptions as getDeptOptions')
  })

  it('分页结构用户列表也能选择并确认回填', async () => {
    const wrapper = mount(UserSelect, {
      props: {
        modelValue: '',
        placeholder: '请选择负责人',
      },
      global: {
        directives: {
          loading: {},
        },
        stubs: {
          ElAvatar: { template: '<span class="el-avatar"><slot /></span>' },
          ElButton: { template: '<button type="button" @click="$emit(\'click\')"><slot /></button>' },
          ElDialog: {
            props: ['modelValue'],
            emits: ['close'],
            template: '<div v-if="modelValue" class="el-dialog"><slot /><slot name="footer" /></div>',
          },
          ElInput: { template: '<input />' },
          ElSelect: { template: '<select><slot /></select>' },
          ElOption: { template: '<option><slot /></option>' },
        },
      },
    })

    await flushPromises()
    await wrapper.find('.user-select-field').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('张三')

    await wrapper.find('.user-select-dialog__user').trigger('click')
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1].trigger('click')

    const updateEvents = wrapper.emitted('update:modelValue') || []
    expect(updateEvents[updateEvents.length - 1]).toEqual(['user-1'])
  })

  it('单选未选择时字段内直接显示占位内容', async () => {
    const wrapper = mount(UserSelect, {
      props: {
        modelValue: '',
        placeholder: '请选择负责人',
      },
      global: {
        directives: {
          loading: {},
        },
        stubs: {
          ElAvatar: { template: '<span class="el-avatar"><slot /></span>' },
          ElButton: { template: '<button type="button"><slot /></button>' },
          ElDialog: { template: '<div></div>' },
          ElInput: { template: '<input />' },
          ElSelect: { template: '<select><slot /></select>' },
          ElOption: { template: '<option><slot /></option>' },
        },
      },
    })

    await flushPromises()

    const field = wrapper.find('.user-select-field')
    expect(field.exists()).toBe(true)
    expect(field.text()).toContain('请选择负责人')
  })

  it('点击单选字段后会打开选择弹窗', async () => {
    const wrapper = mount(UserSelect, {
      props: {
        modelValue: '',
        placeholder: '请选择负责人',
      },
      global: {
        directives: {
          loading: {},
        },
        stubs: {
          ElAvatar: { template: '<span class="el-avatar"><slot /></span>' },
          ElButton: { template: '<button type="button"><slot /></button>' },
          ElDialog: {
            props: ['modelValue'],
            template: '<div v-if="modelValue" class="dialog-open-flag"><slot /><slot name="footer" /></div>',
          },
          ElInput: { template: '<input />' },
          ElSelect: { template: '<select><slot /></select>' },
          ElOption: { template: '<option><slot /></option>' },
        },
      },
    })

    await flushPromises()
    await wrapper.find('.user-select-field').trigger('click')
    await flushPromises()

    expect(wrapper.find('.dialog-open-flag').exists()).toBe(true)
  })

  it('已选人员删除按钮清除全局相邻按钮左边距影响', () => {
    const source = readUserSelectSource()

    expect(source).toContain('.user-select-dialog__selected-item button {')
    expect(source).toContain('margin-left: 0;')
  })

  it('人员列表项清除全局相邻按钮左边距影响', () => {
    const source = readUserSelectSource()

    expect(source).toContain('.user-select-dialog__user {')
    expect(source).toContain('margin-left: 0;')
  })

  it('已选人员头像固定为正圆', () => {
    const source = readUserSelectSource()

    expect(source).toContain('.user-select-chip :deep(.el-avatar) {')
    expect(source).toContain('width: 18px;')
    expect(source).toContain('height: 18px;')
    expect(source).toContain('border-radius: 999px;')
    expect(source).toContain('.user-select-dialog__selected-item :deep(.el-avatar) {')
    expect(source).toContain('width: 24px;')
    expect(source).toContain('height: 24px;')
  })
})
