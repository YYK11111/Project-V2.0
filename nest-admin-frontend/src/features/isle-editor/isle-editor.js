import { changeLocale, prefixClass } from './core/index.js'
import { defineComponent, getCurrentInstance, h, onMounted, ref, shallowRef, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'

import { changeTheme } from './utils/index.js'
import { Editor } from './editor.js'
import './styles/index.scss'
import './utils/preload-icons.js'

export default defineComponent({
  name: 'IsleEditor',
  props: {
    modelValue: {
      type: [Object, Array, String],
      default: '',
    },
    extensions: {
      type: Array,
      default: () => [],
    },
    locale: {
      type: String,
      default: 'en',
    },
    theme: {
      type: String,
      default: 'light',
    },
    output: {
      type: String,
      default: 'html',
    },
    mediaHandlers: {
      type: Object,
      default: () => ({}),
    },
    autofocus: {
      type: [Boolean, String, Number],
      default: false,
    },
    editable: {
      type: Boolean,
      default: true,
    },
    enableInputRules: {
      type: [Array, Boolean],
      default: true,
    },
    enablePasteRules: {
      type: [Array, Boolean],
      default: true,
    },
    enableContentCheck: {
      type: Boolean,
      default: false,
    },
    injectCSS: {
      type: Boolean,
      default: true,
    },
    injectNonce: {
      type: String,
      default: undefined,
    },
    editorProps: {
      type: Object,
      default: () => {},
    },
    parseOptions: {
      type: Object,
      default: () => {},
    },
    spellcheck: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'update:modelValue',
    'update',
    'beforeCreate',
    'create',
    'selectionUpdate',
    'transaction',
    'focus',
    'blur',
    'destroy',
    'contentError',
    'paste',
    'drop',
  ],
  setup(props, { slots, emit, expose }) {
    const instance = getCurrentInstance()
    const editorContainer = ref(null)
    const editor = shallowRef(null)
    const uuid = uuidv4()
    const isFocused = ref(false)
    const isEmpty = ref(false)

    watch(
      () => props.locale,
      (locale) => {
        if (locale) {
          changeLocale(locale)
        }
      },
      { immediate: true },
    )

    watch(
      () => props.theme,
      (theme) => {
        if (theme) {
          changeTheme(theme)
        }
      },
      { immediate: true },
    )

    watch(
      () => props.mediaHandlers,
      (mediaHandlers) => {
        if (editor.value) {
          editor.value.mediaHandlers = mediaHandlers || {}
        }
      },
      { deep: true, immediate: true },
    )

    const extensions = [...props.extensions].filter((ext) => {
      return ['extension', 'node', 'mark'].includes(ext?.type)
    })

    const editorProps = {
      ...props.editorProps,
      attributes: {
        ...(props.editorProps?.attributes || {}),
        class: [prefixClass, props.editorProps?.attributes?.class].filter(Boolean).join(' '),
        spellcheck: String(props.spellcheck),
      },
    }

    const getCharacters = (params = {}) => {
      if (!editor.value?.storage?.characterCount) {
        return new Error('characterCount extension is not enabled')
      }
      return {
        characters: editor.value.storage.characterCount.characters(params),
        words: editor.value.storage.characterCount.words(params),
      }
    }

    function checkEditorEmpty() {
      isEmpty.value = editor.value ? editor.value.getText().trim() === '' : true
    }
    checkEditorEmpty()

    const onUpdate = (options) => {
      const output = props?.output === 'html' ? options?.editor.getHTML() : options?.editor.getJSON()

      checkEditorEmpty()

      emit('update:modelValue', output)
      emit('update', {
        output,
        editor: options?.editor,
      })
    }

    const editorRender = () => {
      if (!editor.value) {
        editor.value?.destroy()
      }

      editor.value = new Editor({
        element: editorContainer.value,
        content: props.modelValue,
        extensions,
        editable: props.editable,
        autofocus: !props.editable ? false : props.autofocus || false,
        editorProps,
        enableInputRules: props.enableInputRules,
        enablePasteRules: props.enablePasteRules,
        enableContentCheck: props.enableContentCheck,
        injectCSS: props.injectCSS,
        injectNonce: props.injectNonce,
        parseOptions: props.parseOptions,
        onBeforeCreate: (options) => {
          emit('beforeCreate', options)
        },
        onCreate: (options) => {
          onUpdate(options)
          emit('create', options)
        },
        onUpdate,
        onSelectionUpdate: (options) => {
          emit('selectionUpdate', options)
        },
        onTransaction: (options) => {
          emit('transaction', options)
        },
        onFocus: (options) => {
          isFocused.value = true
          emit('focus', options)
        },
        onBlur: (options) => {
          isFocused.value = false
          emit('blur', options)
        },
        onDestroy: () => {
          emit('destroy')
        },
        onContentError: (options) => {
          emit('contentError', options)
        },
        onPaste: (...options) => {
          emit('paste', ...options)
        },
        onDrop: (...options) => {
          emit('drop', ...options)
        },
      })

      editor.value.uuid = uuid
      editor.value.getCharacters = getCharacters
      editor.value.mediaHandlers = props.mediaHandlers || {}

      editor.contentComponent = instance?.ctx._

      if (instance) {
        editor.appContext = {
          ...instance.appContext,
          provides: instance.provides,
        }
      }
    }

    onMounted(() => {
      editorRender()
    })

    expose({
      editor,
      isFocused,
      isEmpty,
    })

    return () => h('div', { ref: editorContainer, class: `${prefixClass}-editor-root` }, slots.default?.())
  },
})
