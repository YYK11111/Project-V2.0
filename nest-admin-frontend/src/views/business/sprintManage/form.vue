<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus } from './api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  name: '',
  projectId: '',
  status: '1',
  goal: '',
  startDate: '',
  endDate: '',
  totalStoryPoints: 0,
  completedStoryPoints: 0,
  totalTaskCount: 0,
  completedTaskCount: 0,
  sort: 0,
})

const rules = {
  name: [{ required: true, message: '请输入Sprint名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
}

const status = ref({})

getStatus()
  .then((s) => {
    status.value = s.data || {}
  })

const isView = computed(() => route.query.action === 'view')
const hasSprintId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const canSprintAdd = computed(() => checkPermi(['business/sprints/add']))
const canSprintUpdate = computed(() => checkPermi(['business/sprints/update']))

const defaultForm = () => ({
  name: '',
  projectId: '',
  status: '1',
  goal: '',
  startDate: '',
  endDate: '',
  totalStoryPoints: 0,
  completedStoryPoints: 0,
  totalTaskCount: 0,
  completedTaskCount: 0,
  sort: 0,
})

async function loadSprint() {
  if (!hasSprintId.value) {
    form.value = defaultForm()
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = data || {}
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    loadSprint()
  },
  { immediate: true },
)

function submit() {
  if ((isEdit.value && !canSprintUpdate.value) || (!isEdit.value && !canSprintAdd.value)) {
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
      <el-page-header @back="$router.back()" :title="isView ? 'Sprint详情' : isEdit ? '编辑Sprint' : '新增Sprint'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <el-form-item label="Sprint名称" prop="name">
        <ViewField v-if="isView" :value="form.name" />
        <el-input v-else v-model="form.name" placeholder="请输入Sprint名称" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="所属项目" prop="projectId">
        <ViewEntity v-if="isView" :title="form.project?.name" :subtitle="form.project?.code" />
        <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" />
      </el-form-item>

      <el-form-item label="Sprint状态" v-if="hasSprintId">
        <ViewTagField v-if="isView" :text="status[form.status]" :type="form.status === '3' ? 'success' : form.status === '2' ? 'primary' : 'info'" />
        <el-select v-else v-model="form.status" placeholder="请选择状态" style="width: 100%">
          <el-option v-for="(v, k) in status" :key="k" :label="v" :value="k" />
        </el-select>
      </el-form-item>

      <el-form-item label="Sprint目标">
        <ViewField v-if="isView" :value="form.goal" />
        <el-input v-else v-model="form.goal" type="textarea" :rows="3" placeholder="请输入Sprint目标" />
      </el-form-item>

      <el-form-item label="开始日期">
        <ViewField v-if="isView" :value="form.startDate" />
        <el-date-picker v-else v-model="form.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <el-form-item label="结束日期">
        <ViewField v-if="isView" :value="form.endDate" />
        <el-date-picker v-else v-model="form.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="总故事点">
            <ViewField v-if="isView" :value="form.totalStoryPoints" />
            <el-input-number v-else v-model="form.totalStoryPoints" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="已完成">
            <ViewField v-if="isView" :value="form.completedStoryPoints" />
            <el-input-number v-else v-model="form.completedStoryPoints" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="总任务数">
            <ViewField v-if="isView" :value="form.totalTaskCount" />
            <el-input-number v-else v-model="form.totalTaskCount" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="已完成">
            <ViewField v-if="isView" :value="form.completedTaskCount" />
            <el-input-number v-else v-model="form.completedTaskCount" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="排序">
        <ViewField v-if="isView" :value="form.sort" />
        <el-input-number v-else v-model="form.sort" :min="0" />
      </el-form-item>

      <el-form-item v-if="!isView">
        <el-button v-if="!isView && (isEdit ? canSprintUpdate : canSprintAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
