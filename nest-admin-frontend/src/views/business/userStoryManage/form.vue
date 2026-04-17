<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, getList, save, update, getStatus, getType } from './api'
import { getList as getSprintList } from '@/views/business/sprintManage/api'
import UserSelect from '@/components/UserSelect.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
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
const sprintList = ref([])
const parentStoryList = ref([])

const isView = computed(() => route.query.action === 'view')
const hasStoryId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const canStoryAdd = computed(() => checkPermi(['business/stories/add']))
const canStoryUpdate = computed(() => checkPermi(['business/stories/update']))

onMounted(async () => {
  await loadOptions()
  if (hasStoryId.value) {
    loadData()
  }
})

async function loadOptions() {
  const [statusRes, typeRes, sprintRes] = await Promise.all([
    getStatus(),
    getType(),
    getSprintList({ pageNum: 1, pageSize: 100 }),
  ])
  statusMap.value = statusRes.data || {}
  typeMap.value = typeRes.data || {}
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

watch(
  () => [route.query.id, route.query.action],
  async () => {
    if (hasStoryId.value) {
      loadData()
    } else {
      form.value = {
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
      }
      parentStoryList.value = []
    }
  },
  { immediate: true },
)

async function loadParentStories(projectId) {
  if (!projectId) {
    parentStoryList.value = []
    return
  }
  const res = await getList({ pageNum: 1, pageSize: 1000, projectId })
  parentStoryList.value = (res.list || []).filter((story) => story.id !== route.query.id)
}

async function onProjectChange(projectId) {
  form.value.parentId = null
  await loadParentStories(projectId)
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
      <el-page-header @back="$router.back()" :title="isView ? '用户故事详情' : isEdit ? '编辑用户故事' : '新增用户故事'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <el-form-item label="故事标题" prop="title">
        <ViewField v-if="isView" :value="form.title" />
        <el-input v-else v-model="form.title" placeholder="请输入故事标题" maxlength="200" show-word-limit />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="类型" prop="type">
            <ViewField v-if="isView" :value="typeMap[form.type]" />
            <el-select v-else v-model="form.type" placeholder="请选择类型" style="width: 100%">
              <el-option v-for="(value, key) in typeMap" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <ViewTagField v-if="isView" :text="statusMap[form.status]" :type="form.status === '4' || form.status === '5' ? 'success' : form.status === '3' ? 'warning' : form.status === '6' ? 'danger' : 'info'" />
            <el-select v-else v-model="form.status" placeholder="请选择状态" style="width: 100%">
              <el-option v-for="(value, key) in statusMap" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属项目" prop="projectId">
            <ViewEntity v-if="isView" :title="form.project?.name" :subtitle="form.project?.code" />
            <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" @change="onProjectChange" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="父级故事">
            <ViewEntity v-if="isView" :title="form.parent?.title" />
            <el-select v-else v-model="form.parentId" placeholder="请选择父级故事" style="width: 100%" clearable>
              <el-option v-for="story in parentStoryList" :key="story.id" :label="story.title" :value="story.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属Sprint">
            <ViewEntity v-if="isView" :title="form.sprint?.name" />
            <el-select v-else v-model="form.sprintId" placeholder="请选择Sprint" style="width: 100%" clearable>
              <el-option v-for="sprint in sprintList" :key="sprint.id" :label="sprint.name" :value="sprint.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人">
            <ViewUser v-if="isView" :user="form.assignee" />
            <UserSelect v-else v-model="form.assigneeId" placeholder="请选择负责人" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="故事点">
            <ViewField v-if="isView" :value="form.storyPoints" />
            <el-input-number v-else v-model="form.storyPoints" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="优先级">
            <ViewField v-if="isView" :value="form.priority" />
            <el-input-number v-else v-model="form.priority" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="预估日期">
            <ViewField v-if="isView" :value="form.estimatedDate" />
            <el-date-picker
              v-else
              v-model="form.estimatedDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="故事描述">
        <ViewField v-if="isView" :value="form.description" />
        <el-input v-else v-model="form.description" type="textarea" :rows="4" placeholder="请输入故事描述（As a... I want... So that...）" />
      </el-form-item>

      <el-form-item label="验收标准">
        <ViewField v-if="isView" :value="form.acceptanceCriteria" />
        <el-input v-else v-model="form.acceptanceCriteria" type="textarea" :rows="3" placeholder="请输入验收标准" />
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
