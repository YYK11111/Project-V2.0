<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus, getType } from './api'
import { getList as getProjectList } from '@/views/business/projectManage/api'
import { getList as getSprintList } from '@/views/business/sprintManage/api'
import UserSelect from '@/components/UserSelect.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  title: '',
  description: '',
  type: '2',
  status: '1',
  storyPoints: 0,
  acceptanceCriteria: '',
  priority: 0,
  sprintId: null,
  parentId: null,
  assigneeId: null,
  reporterId: null,
  projectId: '',
  estimatedDate: '',
})

const rules = {
  title: [{ required: true, message: '请输入故事标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
}

const statusMap = ref({})
const typeMap = ref({})
const projectList = ref([])
const sprintList = ref([])
const parentStoryList = ref([])

const isView = computed(() => route.query.action === 'view')
const isEdit = computed(() => !!route.query.id && !isView.value)
const canStoryAdd = computed(() => checkPermi(['business/stories/add']))
const canStoryUpdate = computed(() => checkPermi(['business/stories/update']))

onMounted(async () => {
  await loadOptions()
  if (isEdit.value || isView.value) {
    loadData()
  }
})

async function loadOptions() {
  const [statusRes, typeRes, projectRes, sprintRes] = await Promise.all([
    getStatus(),
    getType(),
    getProjectList({ pageNum: 1, pageSize: 100 }),
    getSprintList({ pageNum: 1, pageSize: 100 }),
  ])
  statusMap.value = statusRes.data || {}
  typeMap.value = typeRes.data || {}
  projectList.value = projectRes.list || []
  sprintList.value = sprintRes.list || []
}

function loadData() {
  getOne(route.query.id).then(({ data }) => {
    form.value = {
      ...data,
      storyPoints: data.storyPoints || 0,
      priority: data.priority || 0,
    }
    if (data.projectId) {
      loadParentStories(data.projectId)
    }
  })
}

function loadParentStories(projectId) {
  getOne(route.query.id).then(({ data }) => {
    form.value = { ...data }
  })
}

async function onProjectChange(projectId) {
  form.value.parentId = null
  if (projectId) {
    const res = await getOne(projectId)
  }
}

function submit() {
  if ((isEdit.value && !canStoryUpdate.value) || (!isEdit.value && !canStoryAdd.value)) {
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
      <el-page-header @back="$router.back()" :title="isView ? '查看用户故事' : isEdit ? '编辑用户故事' : '新增用户故事'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <el-form-item label="故事标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入故事标题" maxlength="200" show-word-limit :disabled="isView" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%" :disabled="isView">
              <el-option v-for="(value, key) in typeMap" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%" :disabled="isView">
              <el-option v-for="(value, key) in statusMap" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属项目" prop="projectId">
            <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%" :disabled="isView" @change="onProjectChange">
              <el-option v-for="project in projectList" :key="project.id" :label="project.name" :value="project.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="父级故事">
            <el-select v-model="form.parentId" placeholder="请选择父级故事" style="width: 100%" clearable :disabled="isView">
              <el-option v-for="story in parentStoryList" :key="story.id" :label="story.title" :value="story.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属Sprint">
            <el-select v-model="form.sprintId" placeholder="请选择Sprint" style="width: 100%" clearable :disabled="isView">
              <el-option v-for="sprint in sprintList" :key="sprint.id" :label="sprint.name" :value="sprint.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人">
            <UserSelect v-model="form.assigneeId" placeholder="请选择负责人" clearable :disabled="isView" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="故事点">
            <el-input-number v-model="form.storyPoints" :min="0" :step="1" style="width: 100%" :disabled="isView" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="优先级">
            <el-input-number v-model="form.priority" :min="0" :step="1" style="width: 100%" :disabled="isView" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="预估日期">
            <el-date-picker
              v-model="form.estimatedDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              :disabled="isView" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="故事描述">
        <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入故事描述（As a... I want... So that...）" :disabled="isView" />
      </el-form-item>

      <el-form-item label="验收标准">
        <el-input v-model="form.acceptanceCriteria" type="textarea" :rows="3" placeholder="请输入验收标准" :disabled="isView" />
      </el-form-item>

      <el-form-item v-if="!isView">
        <el-button v-if="!isView && (isEdit ? canStoryUpdate : canStoryAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
      <el-form-item v-else>
        <el-button @click="cancel">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
