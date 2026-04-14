<script setup>
import { getOne, save, update, getStatus, getPriority, getType, getSeverity, getRootCauseCategory } from './api'
import { getList as getProjectList } from '@/views/business/projectManage/api'
import { getList as getTaskList } from '@/views/business/taskManage/api'
import Editor from '@/components/Editor/index.vue'
import Upload from '@/components/Upload.vue'
import UserSelect from '@/components/UserSelect.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  title: '',
  type: '1',
  projectId: '',
  taskId: '',
  submitterId: '',
  handlerId: '',
  status: '1',
  priority: '2',
  content: '',
  attachments: [],
  severity: '3',
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  environment: '',
  rootCause: '',
  rootCauseCategory: '',
  resolution: '',
  foundInVersion: '',
  fixedInVersion: '',
})

const rules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  submitterId: [{ required: true, message: '请选择提交人', trigger: 'change' }],
}

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const priority = ref({})
getPriority().then(({ data }) => (priority.value = data))

const type = ref({})
getType().then(({ data }) => (type.value = data))

const severity = ref({})
getSeverity().then(({ data }) => (severity.value = data))

const rootCauseCategory = ref({})
getRootCauseCategory().then(({ data }) => (rootCauseCategory.value = data))

const projectList = ref([])
getProjectList({ pageNum: 1, pageSize: 1000 }).then((res) => (projectList.value = res.list || []))

const taskList = ref([])
const loadTaskList = () => {
  if (form.value.projectId) {
    getTaskList({ pageNum: 1, pageSize: 1000, projectId: form.value.projectId }).then(({ data }) => {
      taskList.value = data || []
    })
  } else {
    taskList.value = []
  }
}

const isEdit = computed(() => !!route.query.id)
const canTicketAdd = computed(() => checkPermi(['business/tickets/add']))
const canTicketUpdate = computed(() => checkPermi(['business/tickets/update']))

if (isEdit.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = {
      ...data,
      severity: data.severity || '3',
      rootCauseCategory: data.rootCauseCategory || '',
    }
  })
}

function submit() {
  if ((isEdit.value && !canTicketUpdate.value) || (!isEdit.value && !canTicketAdd.value)) {
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
      <el-page-header @back="$router.back()" :title="isEdit ? '编辑工单' : '新增工单'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 900px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="工单标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入工单标题" maxlength="200" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工单类型">
            <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
              <el-option v-for="(value, key) in type" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属项目" prop="projectId">
            <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%" @change="loadTaskList">
              <el-option v-for="project in projectList" :key="project.id" :label="project.name" :value="project.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="关联任务">
            <el-select v-model="form.taskId" placeholder="请选择任务（可选）" style="width: 100%" clearable>
              <el-option v-for="task in taskList" :key="task.id" :label="task.name" :value="task.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="提交人" prop="submitterId">
            <UserSelect v-model="form.submitterId" placeholder="请选择提交人" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="处理人">
            <UserSelect v-model="form.handlerId" placeholder="请选择处理人（可选）" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="严重程度">
            <el-select v-model="form.severity" placeholder="请选择严重程度" style="width: 100%">
              <el-option v-for="(value, key) in severity" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
              <el-option v-for="(value, key) in status" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
              <el-option v-for="(value, key) in priority" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="发现版本">
            <el-input v-model="form.foundInVersion" placeholder="请输入发现版本" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="修复版本">
            <el-input v-model="form.fixedInVersion" placeholder="请输入修复版本" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="环境信息">
        <el-input v-model="form.environment" placeholder="如：Chrome 120.0 / Windows 11 / iOS 17.0" />
      </el-form-item>

      <el-form-item label="工单内容" prop="content">
        <Editor v-model="form.content" style="min-height: 200px" />
      </el-form-item>

      <!-- 缺陷相关字段 -->
      <template v-if="form.type === '1'">
        <el-divider content-position="left">缺陷详细信息</el-divider>

        <el-form-item label="重现步骤">
          <Editor v-model="form.stepsToReproduce" style="min-height: 150px" placeholder="请描述复现步骤" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期望结果">
              <el-input v-model="form.expectedResult" type="textarea" :rows="3" placeholder="请描述期望结果" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际结果">
              <el-input v-model="form.actualResult" type="textarea" :rows="3" placeholder="请描述实际结果" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">根因分析（处理完成后填写）</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="根因分类">
              <el-select v-model="form.rootCauseCategory" placeholder="请选择根因分类" style="width: 100%" clearable>
                <el-option v-for="(value, key) in rootCauseCategory" :key="key" :label="value" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="根因分析">
          <Editor v-model="form.rootCause" style="min-height: 150px" placeholder="请分析缺陷根因" />
        </el-form-item>

        <el-form-item label="解决方案">
          <Editor v-model="form.resolution" style="min-height: 150px" placeholder="请描述解决方案" />
        </el-form-item>
      </template>

      <el-form-item label="工单附件">
        <Upload v-model:fileList="form.attachments" type="file" multiple />
      </el-form-item>

      <el-form-item>
        <el-button v-if="isEdit ? canTicketUpdate : canTicketAdd" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-divider__text) {
  font-weight: bold;
  color: #409eff;
}
</style>
