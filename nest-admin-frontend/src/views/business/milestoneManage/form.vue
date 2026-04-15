<script setup>
import { ref, computed, nextTick } from 'vue'
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
const inputVisible = ref(false)
const inputValue = ref('')
const inputRef = ref()

const form = ref({
  name: '',
  projectId: '',
  description: '',
  dueDate: '',
  completedDate: '',
  status: '1',
  deliverables: [],
  sort: 0,
})

const rules = {
  name: [{ required: true, message: '请输入里程碑名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  dueDate: [{ required: true, message: '请选择计划完成日期', trigger: 'change' }],
}

const status = ref({})
getStatus().then(({ data }) => (status.value = data || {}))

const isView = computed(() => route.query.action === 'view')
const hasMilestoneId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const canMilestoneAdd = computed(() => checkPermi(['business/milestones/add']))
const canMilestoneUpdate = computed(() => checkPermi(['business/milestones/update']))

if (hasMilestoneId.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = data || {}
  })
}

function handleInputConfirm() {
  if (inputValue.value) {
    if (!form.value.deliverables) form.value.deliverables = []
    form.value.deliverables.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

function showInput() {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.input?.focus()
  })
}

function handleCloseTag(index) {
  form.value.deliverables.splice(index, 1)
}

function submit() {
  if ((isEdit.value && !canMilestoneUpdate.value) || (!isEdit.value && !canMilestoneAdd.value)) {
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
      <el-page-header @back="$router.back()" :title="isView ? '查看里程碑' : isEdit ? '编辑里程碑' : '新增里程碑'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <el-form-item label="里程碑名称" prop="name">
        <ViewField v-if="isView" :value="form.name" />
        <el-input v-else v-model="form.name" placeholder="请输入里程碑名称" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="所属项目" prop="projectId">
        <ViewEntity v-if="isView" :title="form.project?.name" :subtitle="form.project?.code" />
        <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" />
      </el-form-item>

      <el-form-item label="计划完成日期" prop="dueDate">
        <ViewField v-if="isView" :value="form.dueDate" />
        <el-date-picker v-else v-model="form.dueDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <el-form-item label="状态" v-if="hasMilestoneId">
        <ViewTagField v-if="isView" :text="status[form.status]" :type="form.status === '2' ? 'success' : form.status === '3' ? 'warning' : form.status === '4' ? 'info' : 'primary'" />
        <el-select v-else v-model="form.status" placeholder="请选择状态" style="width: 100%">
          <el-option v-for="(label, key) in status" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>

      <el-form-item label="实际完成日期" v-if="isEdit.value">
        <el-date-picker v-model="form.completedDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" :disabled="isView" style="width: 100%" />
      </el-form-item>

      <el-form-item label="里程碑描述">
        <ViewField v-if="isView" :value="form.description" />
        <el-input v-else v-model="form.description" type="textarea" :rows="4" placeholder="请输入描述" />
      </el-form-item>

      <el-form-item label="交付物清单">
        <div v-if="!isView">
          <el-tag v-for="(item, index) in form.deliverables" :key="index" closable @close="handleCloseTag(index)" style="margin-right: 8px; margin-bottom: 8px">
            {{ item }}
          </el-tag>
          <el-input v-if="inputVisible" ref="inputRef" v-model="inputValue" class="input-new-tag" @keyup.enter="handleInputConfirm" @blur="handleInputConfirm" style="width: 120px" />
          <el-button v-else @click="showInput">+ 添加</el-button>
        </div>
        <div v-else>
          <el-tag v-for="(item, index) in form.deliverables" :key="index" style="margin-right: 8px; margin-bottom: 8px">
            {{ item }}
          </el-tag>
          <span v-if="!form.deliverables?.length">无</span>
        </div>
      </el-form-item>

      <el-form-item label="排序">
        <ViewField v-if="isView" :value="form.sort" />
        <el-input-number v-else v-model="form.sort" :min="0" />
      </el-form-item>

      <el-form-item v-if="!isView">
        <el-button v-if="!isView && (isEdit ? canMilestoneUpdate : canMilestoneAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.input-new-tag {
  vertical-align: middle;
}
</style>
