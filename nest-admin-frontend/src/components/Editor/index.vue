<template>
  <div class="Editor flexCol" v-loading="uploadLoading">
    <div class="quillEditor flexAuto" ref="editor" :class="editorClass" @click="quill.focus"></div>
    <Upload v-show="false" v-model:fileUrl="imgUrl" @loadingChange="(val) => (uploadLoading = val)"></Upload>
    <SelectEmoji ref="emoji" @select="insertContent" />
  </div>
</template>

<script>
import Quill from 'quill'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
// import "quill/dist/quill.bubble.css";

export default {
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // quill: '',
      content: '',
      uploadLoading: false,
      imgUrl: '',
      options: {
        placeholder: '请输入内容',
        theme: 'snow',
        // bounds: document.body,
        // readOnly: false,
        debug: 'warn',
        modules: {
          // 工具栏配置
          toolbar: {
            container: [
              ['bold', 'italic', 'underline', 'strike'], // 加粗 斜体 下划线 删除线
              ['blockquote', 'code-block'], // 引用  代码块
              [{ header: 1 }, { header: 2 }],
              [{ list: 'ordered' }, { list: 'bullet' }], // 有序、无序列表
              [{ script: 'sub' }, { script: 'super' }],
              [{ indent: '-1' }, { indent: '+1' }], // 缩进
              [{ direction: 'rtl' }],
              [{ size: ['small', false, 'large', 'huge'] }], // 字体大小
              [{ header: [1, 2, 3, 4, 5, 6, false] }], // 标题
              [{ color: [] }, { background: [] }], // 字体颜色、字体背景颜色
              [{ font: [] }],
              [{ align: [] }], // 对齐方式
              ['clean'], // 清除文本格式
              ['link', 'image', 'video', 'emoji'], // 链接、图片、视频
            ],
            handlers: {
              image: function (value) {
                if (value) {
                  document.querySelector('.Editor .el-upload__input').click()
                } else {
                  this.quill.format('image', false)
                }
              },
            },
          },
        },
      },
    }
  },
  computed: {
    editorClass() {
      return { 'is-disabled': this.disabled }
    },
  },
  watch: {
    disabled: {
      handler(val) {
        if (this.quill) {
          this.quill.enable(!val)
        }
      },
    },
    modelValue: {
      immediate: true,
      handler(val) {
        if (val !== this.content) {
          this.content = val
          if (this.quill) {
            this.$refs.editor.children[0].innerHTML = this.content
          }
        }
      },
    },
    imgUrl(val) {
      let quill = this.quill
      let length = quill.getSelection().index
      quill.insertEmbed(length, 'image', val)
      quill.setSelection(length + 1)
    },
  },
  mounted() {
    this.init()
    this.$nextTick(() => {
      this.$refs.editor.previousElementSibling.querySelector('.ql-emoji').appendChild(this.$refs.emoji.$el)
    })
  },
  beforeUnmount() {
    this.quill = null
  },
  methods: {
    init() {
      const editor = this.$refs.editor
      this.quill = new Quill(editor, this.options)
      if (this.disabled) {
        this.quill.enable(false)
      }
      editor.children[0].innerHTML = this.content
      this.quill.on('text-change', (delta, oldDelta, source) => {
        const html = editor.children[0].innerHTML
        this.content = html
        this.$emit('update:modelValue', html)
      })

      this.quill.on('selection-change', (range, oldRange, source) => {
        this.$emit('selection-change', range, oldRange, source)
      })
      this.quill.on('editor-change', (eventName, ...args) => {
        this.$emit('editor-change', eventName, ...args)
      })
    },
    onProgress(percent) {
      this.uploadLoading = percent > 0 && percent < 100
    },
    insertContent(emoji) {
      let quill = this.quill
      quill.focus()
      let length = quill.getSelection().index //光标位置
      quill.insertText(length, emoji)
      quill.setSelection(length + 2) //光标后移，表情占2位。所以+2
    },
  },
}
</script>

<style>
.quillEditor {
  white-space: pre-wrap !important;
  line-height: normal !important;
}
.quillEditor.is-disabled {
  pointer-events: none;
  opacity: 0.6;
}
.quillEditor.is-disabled .ql-toolbar {
  display: none;
}
.ql-snow .ql-tooltip {
  left: 20px !important;
}
.quill-img {
  display: none;
}
.ql-snow .ql-tooltip[data-mode='link']::before {
  content: '请输入链接地址:';
}
.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0px;
  content: '保存';
  padding-right: 0px;
}

.ql-snow .ql-tooltip[data-mode='video']::before {
  content: '请输入视频地址:';
}

.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: '14px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='small']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before {
  content: '10px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='large']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before {
  content: '18px';
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='huge']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before {
  content: '32px';
}

.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: '文本';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
  content: '标题1';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
  content: '标题2';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
  content: '标题3';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='4']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
  content: '标题4';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='5']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
  content: '标题5';
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='6']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
  content: '标题6';
}

.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: '标准字体';
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='serif']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before {
  content: '衬线字体';
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='monospace']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before {
  content: '等宽字体';
}
</style>
