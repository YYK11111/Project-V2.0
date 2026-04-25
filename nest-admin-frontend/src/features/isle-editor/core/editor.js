import { prefixClass } from './utils/prefix.js'
import { createLocales } from './locales/index.js'

export class Editor {
  constructor(options = {}) {
    this.element = options.element ?? null
    this.options = { ...options }
    this.isDestroyed = false
    this.content = options.content ?? ''
    this.editable = options.editable ?? true
    this.state = {
      locale: options.locale ?? 'en',
      theme: options.theme ?? 'light',
    }
    this.locales = createLocales(this.state.locale)

    this.prependClass()

    this.options.onCreate?.({ editor: this })
    return this
  }

  prependClass() {
    if (!this.element) {
      return
    }

    this.element.classList.add(prefixClass)
  }

  destroy() {
    if (this.isDestroyed) {
      return
    }

    const onDestroy = this.options.onDestroy

    this.isDestroyed = true
    this.content = null
    this.editable = false
    this.state = null
    this.element = null
    this.options = {}
    this.locales = null

    onDestroy?.({ editor: this })
  }

  setContent(content, options = {}) {
    this.content = content
    if (options.silent) {
      return
    }

    this.options.onUpdate?.({ editor: this })
  }

  getContent() {
    return this.content
  }

  getHTML() {
    return typeof this.content === 'string' ? this.content : JSON.stringify(this.content)
  }

  setEditable(editable) {
    this.editable = editable
  }

  isEditable() {
    return this.editable
  }

  setLocale(locale) {
    this.state.locale = locale
    this.locales?.changeLanguage(locale)
  }

  setTheme(theme) {
    this.state.theme = theme
  }

  getState() {
    return { ...this.state }
  }
}
