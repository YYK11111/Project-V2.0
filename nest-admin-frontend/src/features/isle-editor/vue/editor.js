import { Editor as CoreEditor } from '../core/index.js'
import { markRaw } from 'vue'

export class Editor extends CoreEditor {
  contentComponent = null

  appContext = null

  constructor(options = {}) {
    super(options)

    return markRaw(this)
  }
}
