import { describe, expect, it, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import KnowledgeQa from './knowledgeQa.vue'

const pushMock = vi.fn()
const askKnowledgeQaMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('./api', () => ({
  askKnowledgeQa: (...args) => askKnowledgeQaMock(...args),
}))

const ElInputStub = defineComponent({
  name: 'ElInputStub',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('textarea', {
        value: props.modelValue,
        onInput: (event: Event) =>
          emit(
            'update:modelValue',
            (event.target as HTMLTextAreaElement | null)?.value || '',
          ),
      })
  },
})

const ElButtonStub = defineComponent({
  name: 'ElButtonStub',
  emits: ['click'],
  setup(_, { slots, emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          onClick: () => emit('click'),
        },
        slots.default?.(),
      )
  },
})

const ElAlertStub = defineComponent({
  name: 'ElAlertStub',
  props: {
    title: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    return () => h('div', { class: 'el-alert-stub' }, props.title)
  },
})

const ElEmptyStub = defineComponent({
  name: 'ElEmptyStub',
  props: {
    description: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    return () => h('div', { class: 'el-empty-stub' }, props.description)
  },
})

function createWrapper() {
  return shallowMount(KnowledgeQa, {
    global: {
      stubs: {
        'el-input': ElInputStub,
        'el-button': ElButtonStub,
        'el-alert': ElAlertStub,
        'el-empty': ElEmptyStub,
      },
      directives: {
        loading: () => undefined,
      },
    },
  })
}

describe('knowledge qa 前端闭环', () => {
  beforeEach(() => {
    askKnowledgeQaMock.mockReset()
    pushMock.mockReset()
  })

  it('提交成功后展示回答与引用来源', async () => {
    askKnowledgeQaMock.mockResolvedValue({
      data: {
        answer: '建议先确认数据库变更，再按回滚清单处理。',
        references: [
          {
            articleId: 'article-1',
            articleTitle: '上线回滚处理手册',
            chunkId: 'article-1:1:1',
            chunkOrder: 1,
            chunkSummary: '先确认数据库变更是否已执行',
            catalog: {
              id: 'catalog-1',
              name: '实施交付',
            },
            score: 0.91,
          },
        ],
      },
    })
    const wrapper = createWrapper()

    await wrapper.find('textarea').setValue('上线失败后如何回滚？')
    await wrapper.findAll('button')[1].trigger('click')
    await nextTick()

    expect(askKnowledgeQaMock).toHaveBeenCalledWith({
      question: '上线失败后如何回滚？',
    })
    expect(wrapper.text()).toContain('建议先确认数据库变更')
    expect(wrapper.text()).toContain('引用来源')
    expect(wrapper.text()).toContain('上线回滚处理手册')
  })

  it('后端返回业务错误时展示错误消息', async () => {
    askKnowledgeQaMock.mockRejectedValue(new Error('知识问答生成失败，请稍后重试'))
    const wrapper = createWrapper()

    await wrapper.find('textarea').setValue('上线失败后如何回滚？')
    await wrapper.findAll('button')[1].trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('知识问答生成失败，请稍后重试')
  })
})
