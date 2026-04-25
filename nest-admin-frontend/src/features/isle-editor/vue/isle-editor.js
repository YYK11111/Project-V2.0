import { prefixClass } from '../core/index.js'
import { defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import { Editor } from './editor.js'
import './preload-icons.js'
import '../styles/index.scss'

export default defineComponent({
  name: 'IsleEditor',
  props: {
    modelValue: {
      type: [Object, Array, String],
      default: '',
    },
    locale: {
      type: String,
      default: 'en',
    },
    theme: {
      type: String,
      default: 'light',
    },
    editable: {
      type: Boolean,
      default: true,
    },
    extensions: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'create', 'destroy'],
  setup(props, { emit, expose, slots }) {
    const editorContainer = ref(null)
    const editor = shallowRef(null)

    const syncModelValue = (value) => {
      editor.value?.setContent(value, { silent: true })
    }

    const syncEditable = (editable) => {
      editor.value?.setEditable(editable)
    }

    const syncLocale = (locale) => {
      editor.value?.setLocale(locale)
    }

    const syncTheme = (theme) => {
      editor.value?.setTheme(theme)
    }

    onMounted(() => {
      editor.value = new Editor({
        element: editorContainer.value,
        content: props.modelValue,
        editable: props.editable,
        locale: props.locale,
        theme: props.theme,
        extensions: props.extensions,
        onCreate: (options) => {
          emit('create', options)
        },
        onUpdate: (options) => {
          emit('update:modelValue', options.editor.getHTML())
        },
        onDestroy: () => {
          emit('destroy')
        },
      })
    })

    onBeforeUnmount(() => {
      editor.value?.destroy()
      editor.value = null
    })

    watch(() => props.modelValue, syncModelValue)
    watch(() => props.editable, syncEditable)
    watch(() => props.locale, syncLocale)
    watch(() => props.theme, syncTheme)

    expose({
      get editor() {
        return editor.value
      },
    })

    return () => {
      return h('div', { class: prefixClass }, [
        h('div', { ref: editorContainer, class: `${prefixClass}-editor-root` }),
        slots.default?.(),
      ])
    }
  },
})
