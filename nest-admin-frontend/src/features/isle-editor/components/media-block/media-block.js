import { computed, defineComponent, h, onBeforeUnmount, ref, watch } from 'vue'
import { prefixClass, t } from '../../core/index.js'
import { NodeViewWrapper } from '../node-view/index.js'
import { IButton, IIcon } from '../ui/index.js'

const mediaTypeMap = {
  image: {
    urlKey: 'src',
    inputAccept: 'image/*',
    placeholderKey: 'imageUrlPlaceholder',
    uploadHandlerKey: 'uploadImage'
  },
  video: {
    urlKey: 'src',
    inputAccept: 'video/*',
    placeholderKey: 'videoUrlPlaceholder',
    uploadHandlerKey: 'uploadVideo'
  },
  attachment: {
    urlKey: 'url',
    inputAccept: '*',
    placeholderKey: 'attachmentUrlPlaceholder',
    uploadHandlerKey: 'uploadAttachment'
  }
}

const statusTextMap = {
  idle: 'upload',
  uploading: 'uploading',
  done: 'uploaded',
  error: 'uploadFailed'
}

function formatFileSize(size) {
  if (!size || size <= 0) {
    return ''
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let index = 0

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  const fixed = value >= 100 || index === 0 ? 0 : 1

  return `${value.toFixed(fixed)} ${units[index]}`
}

function getFileExtension(name) {
  if (!name || !name.includes('.')) {
    return ''
  }

  return name.split('.').pop()?.toUpperCase() || ''
}

function normalizeUploadResult(type, result, file) {
  if (typeof result === 'string') {
    return type === 'attachment'
      ? {
          url: result,
          name: file.name,
          size: file.size,
          mime: file.type,
          ext: getFileExtension(file.name),
          status: 'done',
          error: ''
        }
      : {
          src: result,
          name: file.name,
          size: file.size,
          mime: file.type,
          status: 'done',
          error: ''
        }
  }

  if (result && typeof result === 'object') {
    return {
      ...result,
      name: result.name || file.name,
      size: result.size || file.size,
      mime: result.mime || file.type,
      ext: result.ext || getFileExtension(result.name || file.name),
      status: result.status || 'done',
      error: result.error || ''
    }
  }

  return null
}

function createLocalResult(type, file) {
  const objectUrl = URL.createObjectURL(file)

  return type === 'attachment'
    ? {
        url: objectUrl,
        name: file.name,
        size: file.size,
        mime: file.type,
        ext: getFileExtension(file.name),
        status: 'done',
        error: ''
      }
    : {
        src: objectUrl,
        name: file.name,
        size: file.size,
        mime: file.type,
        status: 'done',
        error: ''
      }
}

function createUrlReplaceAttrs(type, value, attrs) {
  const sourceName = value.split('/').pop() || value
  const nextAttrs = {
    name: sourceName,
    title: sourceName,
    size: 0,
    mime: '',
    ext: '',
    poster: '',
    status: 'done',
    error: ''
  }

  if (type === 'attachment') {
    nextAttrs.ext = getFileExtension(sourceName)
  }

  return nextAttrs
}

function getBaseUploadAttrs(type, file, attrs) {
  const urlKey = mediaTypeMap[type].urlKey
  const nextAttrs = {
    name: file.name,
    title: file.name,
    size: file.size,
    mime: file.type,
    status: 'uploading',
    error: ''
  }

  if (attrs[urlKey]) {
    nextAttrs[urlKey] = attrs[urlKey]
  }

  if (type === 'attachment') {
    nextAttrs.ext = getFileExtension(file.name)
  }

  return nextAttrs
}

export default defineComponent({
  name: 'MediaBlock',
  props: {
    editor: {
      type: Object,
      required: true
    },
    node: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    updateAttributes: {
      type: Function,
      required: true
    },
    deleteNode: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const urlInput = ref('')
    const inputRef = ref(null)
    const isSubmittingUrl = ref(false)
    const isUrlMode = ref(false)
    const ownedObjectUrls = new Set()

    const type = computed(() => props.node.type.name)
    const typeConfig = computed(() => mediaTypeMap[type.value])
    const urlValue = computed(() => props.node.attrs[typeConfig.value.urlKey] || '')
    const status = computed(() => props.node.attrs.status || 'idle')
    const error = computed(() => props.node.attrs.error || '')
    const title = computed(() => props.node.attrs.title || props.node.attrs.name || '')
    const sourceName = computed(() => {
      if (title.value) {
        return title.value
      }

      return urlValue.value.split('/').pop() || ''
    })
    const typeText = computed(() => props.node.attrs.mime || props.node.attrs.ext || '')
    const statusText = computed(() => t(statusTextMap[status.value] || statusTextMap.idle))
    const canOpenSource = computed(() => Boolean(urlValue.value))
    const isUploading = computed(() => status.value === 'uploading')
    const metaText = computed(() => {
      const parts = []

      if (props.node.attrs.mime) {
        parts.push(props.node.attrs.mime)
      } else if (props.node.attrs.ext) {
        parts.push(props.node.attrs.ext)
      }

      const fileSize = formatFileSize(props.node.attrs.size)

      if (fileSize) {
        parts.push(fileSize)
      }

      return parts.join(' · ')
    })
    const placeholderText = computed(() => t(typeConfig.value.placeholderKey))
    const isEmpty = computed(() => !urlValue.value)
    const isPristineEmpty = computed(() => isEmpty.value && status.value === 'idle')
    const showBottomPopover = computed(() => props.selected)
    const popoverStyle = {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: '0'
    }

    function isBlobUrl(value) {
      return typeof value === 'string' && value.startsWith('blob:')
    }

    function rememberObjectUrl(value) {
      if (isBlobUrl(value)) {
        ownedObjectUrls.add(value)
      }
    }

    function revokeObjectUrl(value) {
      if (!ownedObjectUrls.has(value)) {
        return
      }

      URL.revokeObjectURL(value)
      ownedObjectUrls.delete(value)
    }

    function openPicker() {
      if (isUploading.value) {
        return
      }

      inputRef.value?.click()
    }

    async function uploadFile(file) {
      if (!file) {
        return
      }

      const uploadHandler = props.editor.mediaHandlers?.[typeConfig.value.uploadHandlerKey]
      const baseAttrs = getBaseUploadAttrs(type.value, file, props.node.attrs)

      props.updateAttributes(baseAttrs)

      try {
        const result = uploadHandler
          ? await uploadHandler(file, {
              editor: props.editor,
              node: props.node,
              updateAttributes: props.updateAttributes
            })
          : createLocalResult(type.value, file)

        const normalized = normalizeUploadResult(type.value, result, file)

        if (!normalized) {
          throw new Error(t('uploadResultInvalid'))
        }

        rememberObjectUrl(normalized[typeConfig.value.urlKey])

        props.updateAttributes(normalized)
      } catch (uploadError) {
        props.updateAttributes({
          status: 'error',
          error: uploadError instanceof Error ? uploadError.message : t('uploadFailed')
        })
      }
    }

    function onFileChange(event) {
      const [file] = event.target.files || []

      if (!file) {
        return
      }

      uploadFile(file)
      event.target.value = ''
    }

    async function submitUrl() {
      const value = urlInput.value.trim()

      if (!value) {
        return
      }

      isSubmittingUrl.value = true

      try {
        props.updateAttributes({
          [typeConfig.value.urlKey]: value,
          ...createUrlReplaceAttrs(type.value, value, props.node.attrs)
        })

        urlInput.value = ''
        isUrlMode.value = false
      } finally {
        isSubmittingUrl.value = false
      }
    }

    function openUrlMode() {
      if (isUploading.value) {
        return
      }

      isUrlMode.value = true
    }

    function removeBlock() {
      revokeObjectUrl(urlValue.value)
      props.deleteNode()
    }

    watch(urlValue, (nextValue, previousValue) => {
      if (previousValue && previousValue !== nextValue) {
        revokeObjectUrl(previousValue)
      }
    })

    onBeforeUnmount(() => {
      revokeObjectUrl(urlValue.value)
      ownedObjectUrls.forEach(value => {
        URL.revokeObjectURL(value)
      })
      ownedObjectUrls.clear()
    })

    function openSource() {
      const value = urlValue.value

      if (canOpenSource.value) {
        window.open(value, '_blank', 'noopener,noreferrer')
      }
    }

    function copySource() {
      if (!urlValue.value) {
        return
      }

      const writeTask = navigator.clipboard?.writeText(urlValue.value)

      if (writeTask && typeof writeTask.catch === 'function') {
        writeTask.catch(() => {})
      }
    }

    function renderStatus() {
      return h(
        'div',
        {
          class: [
            `${prefixClass}-media-block__status`,
            `${prefixClass}-media-block__status--${status.value}`
          ]
        },
        statusText.value
      )
    }

    function renderDetails() {
      if (type.value === 'image') {
        return null
      }

      const detailItems = []

      if (sourceName.value) {
        detailItems.push(
          h('div', { class: `${prefixClass}-media-block__detail-row` }, [
            h('span', { class: `${prefixClass}-media-block__detail-label` }, t('fileName')),
            h('span', { class: `${prefixClass}-media-block__detail-value` }, sourceName.value)
          ])
        )
      }

      if (typeText.value) {
        detailItems.push(
          h('div', { class: `${prefixClass}-media-block__detail-row` }, [
            h('span', { class: `${prefixClass}-media-block__detail-label` }, t('type')),
            h('span', { class: `${prefixClass}-media-block__detail-value` }, typeText.value)
          ])
        )
      }

      const fileSize = formatFileSize(props.node.attrs.size)

      if (fileSize) {
        detailItems.push(
          h('div', { class: `${prefixClass}-media-block__detail-row` }, [
            h('span', { class: `${prefixClass}-media-block__detail-label` }, t('size')),
            h('span', { class: `${prefixClass}-media-block__detail-value` }, fileSize)
          ])
        )
      }

      if (!detailItems.length) {
        return null
      }

      return h('div', { class: `${prefixClass}-media-block__details` }, detailItems)
    }

    function renderPreview() {
      if (!urlValue.value) {
        return null
      }

      if (type.value === 'image') {
        return h('img', {
          src: urlValue.value,
          alt: title.value,
          class: `${prefixClass}-media-block__preview-image`
        })
      }

      if (type.value === 'video') {
        return h('video', {
          src: urlValue.value,
          poster: props.node.attrs.poster || '',
          controls: true,
          class: `${prefixClass}-media-block__preview-video`
        })
      }

        return h('div', { class: `${prefixClass}-media-block__preview-attachment` }, [
          h(IIcon, {
            name: 'attachment',
            size: 18
          }),
        h('span', { class: `${prefixClass}-media-block__preview-attachment-name` }, sourceName.value || t('attachment'))
      ])
    }

    function renderActions() {
      return h('div', { class: `${prefixClass}-media-block__actions` }, [
        h(IButton, { onClick: openPicker, semiActive: isUploading.value, disabled: isUploading.value }, {
          icon: () => h(IIcon, { name: status.value === 'error' ? 'refreshCw' : 'upload', size: 13 }),
          default: () => h('span', status.value === 'error' ? t('retryUpload') : status.value === 'done' ? '替换' : t('upload'))
        }),
        h(IButton, { onClick: openSource, disabled: !canOpenSource.value }, {
          icon: () => h(IIcon, { name: 'openRight', size: 13 }),
          default: () => h('span', t('open'))
        }),
        type.value !== 'video'
          ? h(IButton, { onClick: copySource, disabled: !canOpenSource.value }, {
              icon: () => h(IIcon, { name: 'copy', size: 13 }),
              default: () => h('span', '复制链接')
            })
          : null,
        h(IButton, { onClick: removeBlock, danger: true }, {
          icon: () => h(IIcon, { name: 'trash', size: 13 }),
          default: () => h('span', t('delete'))
        })
      ])
    }

    function renderErrorActions() {
      return h('div', { class: `${prefixClass}-media-block__actions` }, [
        h(IButton, { onClick: openPicker, semiActive: isUploading.value, disabled: isUploading.value }, {
          icon: () => h(IIcon, { name: 'refreshCw', size: 13 }),
          default: () => h('span', t('retryUpload'))
        }),
        h(IButton, { onClick: removeBlock, danger: true }, {
          icon: () => h(IIcon, { name: 'trash', size: 13 }),
          default: () => h('span', t('delete'))
        })
      ])
    }

    function renderEmptyActions() {
      return h('div', { class: `${prefixClass}-media-block__actions` }, [
        h(IButton, { onClick: openPicker, disabled: isUploading.value }, {
          icon: () => h(IIcon, { name: 'upload', size: 13 }),
          default: () => h('span', '上传本地文件')
        }),
        h(IButton, { onClick: openUrlMode, disabled: isUploading.value }, {
          icon: () => h(IIcon, { name: 'link', size: 13 }),
          default: () => h('span', '通过链接插入')
        }),
        h(IButton, { onClick: removeBlock, danger: true }, {
          icon: () => h(IIcon, { name: 'trash', size: 13 }),
          default: () => h('span', t('delete'))
        })
      ])
    }

    function renderBottomPopoverContent() {
      if (isPristineEmpty.value) {
        return isUrlMode.value
          ? h('div', { class: `${prefixClass}-media-block__url-box` }, [
              h('input', {
                value: urlInput.value,
                placeholder: placeholderText.value,
                class: `${prefixClass}-media-block__url-input`,
                onInput: event => {
                  urlInput.value = event.target.value
                },
                onKeydown: event => {
                  if (event.key === 'Enter') {
                    submitUrl()
                  }
                }
              }),
              h(IButton, { onClick: submitUrl, success: true, disabled: isSubmittingUrl.value || isUploading.value }, {
                default: () => h('span', t('confirm'))
              })
            ])
          : renderEmptyActions()
      }

      return status.value === 'error' ? renderErrorActions() : renderActions()
    }

    function renderBottomPopover() {
      if (!showBottomPopover.value) {
        return null
      }

      return h('div', {
        class: [`${prefixClass}-media-block__popover`, `${prefixClass}-media-block__bottom-popover`],
        style: popoverStyle
      }, [
        renderBottomPopoverContent()
      ])
    }

    return () =>
      h(
        NodeViewWrapper,
        {
          class: [
            `${prefixClass}-media-block`,
            `${prefixClass}-media-block--${type.value}`,
            `${prefixClass}-media-block--bottom-popover-anchor`,
            {
              'is-selected': props.selected,
              'is-uploading': status.value === 'uploading',
              'is-error': status.value === 'error',
              'has-source': Boolean(urlValue.value)
            }
          ]
        },
        {
          default: () => [
            h('input', {
              ref: inputRef,
              type: 'file',
              accept: typeConfig.value.inputAccept,
              class: `${prefixClass}-media-block__input`,
              onChange: onFileChange
            }),
            h('div', { class: `${prefixClass}-media-block__body` }, [
              h('div', { class: `${prefixClass}-media-block__preview` }, [
                renderPreview() ||
                  h('div', { class: `${prefixClass}-media-block__empty` }, [
                    h(IIcon, {
                      name: type.value,
                      size: 20,
                      class: `${prefixClass}-media-block__empty-icon`
                    }),
                    h('span', { class: `${prefixClass}-media-block__empty-text` }, t(`${type.value}Empty`))
                  ])
              ]),
              !isPristineEmpty.value
                ? h('div', { class: `${prefixClass}-media-block__content` }, [
                    h('div', { class: `${prefixClass}-media-block__header` }, [
                      h('div', { class: `${prefixClass}-media-block__title` }, title.value || t(type.value)),
                      metaText.value
                        ? h('div', { class: `${prefixClass}-media-block__meta` }, metaText.value)
                        : null,
                      renderStatus(),
                      status.value === 'error' && error.value
                        ? h('div', { class: `${prefixClass}-media-block__error` }, error.value)
                        : null
                    ]),
                    renderDetails()
                  ])
                : null,
            ]),
            renderBottomPopover()
          ]
        }
      )
  }
})
