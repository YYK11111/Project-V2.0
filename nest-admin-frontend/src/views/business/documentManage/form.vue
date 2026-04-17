<script setup>
import { watch } from 'vue'
import { getOne, save, update, getType } from './api'
import UserSelect from '@/components/UserSelect.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  name: '',
  projectId: '',
  type: '1',
  content: '',
  fileUrl: '',
  version: '1.0',
  uploaderId: '',
})

const rules = {
  name: [{ required: true, message: '请输入文档名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  type: [{ required: true, message: '请选择文档类型', trigger: 'change' }],
}

const type = ref({})
getType().then(({ data }) => (type.value = data))

const isView = computed(() => route.query.action === 'view')
const hasDocumentId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const isReadonly = computed(() => isView.value)
const canDocumentAdd = computed(() => checkPermi(['business/documents/add']))
const canDocumentUpdate = computed(() => checkPermi(['business/documents/update']))

const defaultForm = () => ({
  name: '',
  projectId: '',
  type: '1',
  content: '',
  fileUrl: '',
  version: '1.0',
  uploaderId: '',
})

async function loadDocument() {
  if (!hasDocumentId.value) {
    form.value = defaultForm()
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = { ...data }
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    loadDocument()
  },
  { immediate: true },
)

function submit() {
  if ((isEdit.value && !canDocumentUpdate.value) || (!isEdit.value && !canDocumentAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
  }
  formRef.value.validate((valid) => {
    if (valid) {
      const api = isEdit.value ? update : save
      api(form.value).then(() => {
        $sdk.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
        router.back()
      })
    }
  })
}

function cancel() {
  router.back()
}
</script>

<template>
  <div class="Gcard">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isReadonly ? '文档详情' : isEdit ? '编辑文档' : '新增文档'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <el-form-item label="文档名称" prop="name">
        <ViewField v-if="isReadonly" :value="form.name" />
        <el-input v-else v-model="form.name" placeholder="请输入文档名称" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="所属项目" prop="projectId">
        <ViewEntity v-if="isReadonly" :title="form.project?.name" :subtitle="form.project?.code" />
        <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" />
      </el-form-item>

      <el-form-item label="文档类型" prop="type">
        <ViewField v-if="isReadonly" :value="type[form.type]" />
        <el-select v-else v-model="form.type" placeholder="请选择文档类型" style="width: 100%">
          <el-option v-for="(value, key) of type" :key="key" :label="value" :value="key" />
        </el-select>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="版本号" prop="version">
            <ViewField v-if="isReadonly" :value="form.version" />
            <el-input v-else v-model="form.version" placeholder="请输入版本号" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上传人" prop="uploaderId">
            <ViewUser v-if="isReadonly" :user="form.uploader" />
            <UserSelect v-else v-model="form.uploaderId" placeholder="请选择上传人" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="文档内容" prop="content">
        <ViewField v-if="isReadonly" :value="form.content" />
        <el-input
          v-else
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="请输入文档内容摘要"
          maxlength="1000"
          show-word-limit />
      </el-form-item>

      <el-form-item label="文件链接" prop="fileUrl">
        <template v-if="isReadonly">
          <a v-if="form.fileUrl" :href="form.fileUrl" target="_blank">{{ form.fileUrl }}</a>
          <ViewField v-else value="" />
        </template>
        <el-input v-else v-model="form.fileUrl" placeholder="请输入文件存储链接" maxlength="500" />
      </el-form-item>

      <el-form-item>
        <el-button v-if="!isReadonly && (isEdit ? canDocumentUpdate : canDocumentAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
</style>
