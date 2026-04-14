<script>
import { upload } from '@/api/common'
import { Plus, Delete, Document } from '@element-plus/icons-vue'

export default {
  name: 'Upload',
  components: { Plus, Delete, Document },
  emits: [
    'update:fileUrl',
    'update:fileName',
    'update:imgSize',
    'update:fileList',
    'uploadSuccess',
    'loadingChange',
  ],
  props: {
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    imgSize: { type: Number, default: undefined },
    disabled: { type: Boolean, default: false },
    fileList: { type: Array, default: () => [] },
    type: { type: String, default: 'image' },
    maxSize: { type: Number, default: undefined },
    maxImgPx: { type: Array, default: () => [10000, 10000] },
    format: { type: Array, default: undefined },
    accept: { type: String, default: '' },
    multiple: { type: Boolean, default: false },
    limit: { type: [Number, String], default: undefined },
    params: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      loading: false,
      fileUrlWatch: this.fileUrl,
      fileNameWatch: this.fileName,
      fileListWatch: this.fileList,
      currentFile: null,
    }
  },
  watch: {
    fileUrl(val) { this.fileUrlWatch = val },
    fileName(val) { this.fileNameWatch = val },
    fileList: {
      handler(val) { this.fileListWatch = val },
      deep: true,
    },
    loading(val) { this.$emit('loadingChange', val) },
  },
  computed: {
    acceptAuto() {
      return { image: 'image/*', voice: 'amr/*', video: 'video/*' }[this.type]
    },
    fileUrlResolved() {
      return this.resolveUrl(this.fileUrlWatch)
    },
  },
  methods: {
    resolveUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//.test(url)) return url
      const normalized = url.replace(/^\/(upload|static)\//, '')
      return window.sysConfig.BASE_API + '/static/' + normalized
    },
    isSingleMode() {
      return !this.multiple || this.limit == 1 || this.limit === 1 || this.limit === '1'
    },
    
    async handleBeforeUpload(file) {
      this.loading = true
      
      // 验证格式
      let format = this.format
      if (!format || !format.length) {
        const formatDefault = {
          image: { value: ['png', 'jpg', 'jpeg', 'svg'] },
          voice: { value: ['amr'] },
          video: { value: ['mp4'] },
          file: { value: ['*'] },
        }
        format = formatDefault[this.type]?.value || ['*']
      }
      
      if (format[0] !== '*') {
        const reg = new RegExp(`\\.(${format.join('|')})$`, 'ig')
        if (!reg.test(file.name)) {
          this.loading = false
          $sdk.msgError('文件格式不支持')
          return Promise.reject()
        }
      }
      
      // 验证大小
      let maxSize = this.maxSize
      if (!maxSize) {
        const maxSizeDefault = { image: 2, voice: 2, video: 100, file: 50 }
        maxSize = maxSizeDefault[this.type] || 50
      }
      if (file.size / 1024 / 1024 >= maxSize) {
        this.loading = false
        $sdk.msgError('文件大小不能超过 ' + maxSize + 'MB')
        return Promise.reject()
      }
      
      // 保存当前文件
      this.currentFile = file
      
      this.loading = false
      return true
    },
    
    async handleHttpRequest(options) {
      const file = options.file
      this.currentFile = file
      this.loading = true
      
      try {
        const formData = new FormData()
        for (const key in this.params) {
          formData.append(key, this.params[key])
        }
        formData.append('file', file)
        
        const res = await upload(formData)
        this.loading = false
        
        if (res.code !== 200) {
          $sdk.msgError(res.msg || '上传失败')
          options.onError(new Error(res.msg || '上传失败'), file)
          return
        }
        
        const name = file.name
        const url = res.data.url
        const memorySize = file.size
        
        // 更新文件列表
        if (this.multiple && this.limit != 1) {
          const newFile = { name, url, memorySize }
          this.fileListWatch = [...this.fileListWatch, newFile]
          this.$emit('update:fileList', [...this.fileList, newFile])
        } else {
          this.fileUrlWatch = url
          this.fileNameWatch = name
          this.$emit('update:fileUrl', url)
          this.$emit('update:fileName', name)
          this.$emit('update:imgSize', memorySize)
        }
        
        this.$emit('uploadSuccess', { name, url })
        options.onSuccess({})
        
      } catch (error) {
        this.loading = false
        console.error('Upload error:', error)
        $sdk.msgError('上传失败')
        options.onError(error, file)
      }
    },
    
    remove(index) {
      if (this.multiple) {
        // 直接删除，不弹确认框
        const list = [...this.fileListWatch]
        list.splice(index, 1)
        this.fileListWatch = list
        this.$emit('update:fileList', list)
      } else {
        this.fileUrlWatch = ''
        this.fileNameWatch = ''
        this.$emit('update:fileUrl', '')
        this.$emit('update:fileName', '')
        this.$emit('update:imgSize', undefined)
      }
    },
    
    handleExceed() {
      $sdk.msgError('最多上传' + this.limit + '个文件')
      this.loading = false
    },
    
    onError(err, file, fileList) {
      this.loading = false
      $sdk.msgError('上传失败')
    },
  },
}
</script>

<template>
  <div>
    <!-- 已上传文件列表 -->
    <template v-if="multiple">
      <div v-for="(item, index) in fileListWatch" :key="index" class="file-item">
        <el-icon class="mr5"><Document /></el-icon>
        <a :href="resolveUrl(item.url)" target="_blank" class="file-name">{{ item.name || '附件' }}</a>
        <el-icon class="ml10" v-if="!disabled" @click="remove(index)"><Delete /></el-icon>
      </div>
    </template>
    
    <!-- 单文件预览 -->
    <div v-if="!multiple && fileUrlWatch && !loading && type === 'image'" class="upload-image-item">
      <el-image class="upload-image-preview" :src="fileUrlResolved" :preview-src-list="[fileUrlResolved]" fit="cover" />
      <el-icon class="upload-image-delete" v-if="!disabled" @click="remove(0)"><Delete /></el-icon>
    </div>

    <div v-else-if="!multiple && fileUrlWatch && !loading" class="upload-item">
      <el-icon class="mr5"><Document /></el-icon>
      <a :href="fileUrlResolved" target="_blank">{{ fileNameWatch || '附件' }}</a>
      <el-icon class="ml10" v-if="!disabled" @click="remove(0)"><Delete /></el-icon>
    </div>

    <!-- 上传按钮 -->
    <el-upload
      v-if="!multiple || !limit || fileListWatch.length < limit"
      class="uploader"
      :class="{ 'file-uploader': type === 'file' }"
      action="/api"
      :accept="accept || acceptAuto"
      :http-request="handleHttpRequest"
      :show-file-list="false"
      :disabled="disabled"
      :multiple="multiple && limit != 1"
      :limit="limit"
      :on-error="onError"
      :on-exceed="handleExceed"
      :before-upload="handleBeforeUpload">
      
      <el-button v-if="type === 'file'" type="primary" plain :loading="loading" :disabled="disabled">
        上传附件
      </el-button>
      
      <div v-else-if="!loading && !fileUrlWatch" class="uploader-icon">
        <el-icon><Plus /></el-icon>
      </div>
    </el-upload>

    <div class="tip">
      <slot name="tip"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.uploader {
  display: inline-block;
  vertical-align: middle;
}
.file-uploader .el-upload {
  display: inline-block;
}
.file-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  .file-name { flex: 1; color: #409eff; }
  .ml10 { margin-left: 10px; cursor: pointer; &:hover { color: #f56c6c; } }
}
.upload-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  a { color: #409eff; }
  .ml10 { margin-left: 10px; cursor: pointer; &:hover { color: #f56c6c; } }
}
.upload-image-item {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 8px;
}
.upload-image-preview {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  overflow: hidden;
}
.upload-image-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  padding: 4px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
}
.uploader-icon {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #8c939d;
  cursor: pointer;
  &:hover { border-color: #409eff; color: #409eff; }
}
.tip { color: #909399; font-size: 12px; margin-top: 5px; }
.mr5 { margin-right: 5px; }
</style>
