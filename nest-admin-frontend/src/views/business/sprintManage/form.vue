<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus } from './api'
import { getList as getProjectList } from '../projectManage/api'
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
const projectList = ref([])

Promise.all([getStatus(), getProjectList({ pageNum: 1, pageSize: 1000 })])
  .then(([s, p]) => {
    status.value = s.data || {}
    projectList.value = p.list || []
  })

const isView = computed(() => route.query.action === 'view')
const isEdit = computed(() => !!route.query.id && !isView.value)
const canSprintAdd = computed(() => checkPermi(['business/sprints/add']))
const canSprintUpdate = computed(() => checkPermi(['business/sprints/update']))

if (isEdit.value || isView.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = data || {}
  })
}

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
      <el-page-header @back="$router.back()" :title="isView ? '查看Sprint' : isEdit ? '编辑Sprint' : '新建Sprint'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <el-form-item label="Sprint名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入Sprint名称" maxlength="100" show-word-limit :disabled="isView" />
      </el-form-item>

      <el-form-item label="所属项目" prop="projectId">
        <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%" :disabled="isView">
          <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Sprint状态" v-if="isEdit.value || isView.value">
        <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%" :disabled="isView">
          <el-option v-for="(v, k) in status" :key="k" :label="v" :value="k" />
        </el-select>
      </el-form-item>

      <el-form-item label="Sprint目标">
        <el-input v-model="form.goal" type="textarea" :rows="3" placeholder="请输入Sprint目标" :disabled="isView" />
      </el-form-item>

      <el-form-item label="开始日期">
        <el-date-picker v-model="form.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" :disabled="isView" style="width: 100%" />
      </el-form-item>

      <el-form-item label="结束日期">
        <el-date-picker v-model="form.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" :disabled="isView" style="width: 100%" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="总故事点">
            <el-input-number v-model="form.totalStoryPoints" :min="0" :disabled="isView" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="已完成">
            <el-input-number v-model="form.completedStoryPoints" :min="0" :disabled="isView" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="总任务数">
            <el-input-number v-model="form.totalTaskCount" :min="0" :disabled="isView" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="已完成">
            <el-input-number v-model="form.completedTaskCount" :min="0" :disabled="isView" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="排序">
        <el-input-number v-model="form.sort" :min="0" :disabled="isView" />
      </el-form-item>

      <el-form-item v-if="!isView">
        <el-button v-if="!isView && (isEdit ? canSprintUpdate : canSprintAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
