<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus, getPriority, getProjectList, getDependencies, getDependents, addDependency, removeDependency } from './api'
import UserSelect from '@/components/UserSelect.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  name: '',
  projectId: '',
  leaderId: '',
  executorIds: '',
  startDate: '',
  endDate: '',
  status: '1',
  priority: '2',
  progress: 0,
  description: '',
  attachments: [],
  estimatedHours: 0,
  actualHours: 0,
  remainingHours: 0,
  acceptanceCriteria: '',
  storyPoints: 0,
})

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  leaderId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
}

const status = ref({})
getStatus().then(({ data }) => (status.value = data))

const priority = ref({})
getPriority().then(({ data }) => (priority.value = data))

const projectList = ref([])
getProjectList().then((res) => (projectList.value = res.list || []))

const isEdit = computed(() => !!route.query.id)
const canTaskAdd = computed(() => checkPermi(['business/tasks/add']))
const canTaskUpdate = computed(() => checkPermi(['business/tasks/update']))

const dependencies = ref([])
const dependents = ref([])
const availableTasks = ref([])
const showDependencyDialog = ref(false)
const newDependencyId = ref('')

async function loadDependencies() {
  if (!isEdit.value) return
  const [depRes, depenRes] = await Promise.all([
    getDependencies(route.query.id),
    getDependents(route.query.id)
  ])
  dependencies.value = depRes.data || []
  dependents.value = depenRes.data || []
}

async function loadAvailableTasks() {
  if (!form.value.projectId) return
  const res = await getProjectList()
  const allTasks = (res.list || []).flatMap((p) => p.tasks || [])
  availableTasks.value = allTasks.filter(t => t.id !== route.query.id)
}

async function handleAddDependency() {
  if (!canTaskUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  if (!newDependencyId.value) return
  try {
    await addDependency(route.query.id, newDependencyId.value)
    $sdk.msgSuccess('添加成功')
    showDependencyDialog.value = false
    newDependencyId.value = ''
    await loadDependencies()
  } catch (e) {
    $sdk.msgError(e.message || '添加失败')
  }
}

async function handleRemoveDependency(depId) {
  if (!canTaskUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  try {
    await removeDependency(route.query.id, depId)
    $sdk.msgSuccess('移除成功')
    await loadDependencies()
  } catch (e) {
    $sdk.msgError(e.message || '移除失败')
  }
}

if (isEdit.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = { 
      ...data,
      estimatedHours: data.estimatedHours || 0,
      actualHours: data.actualHours || 0,
      remainingHours: data.remainingHours || 0,
      storyPoints: data.storyPoints || 0,
    }
    loadDependencies()
  })
}

function submit() {
  if ((isEdit.value && !canTaskUpdate.value) || (!isEdit.value && !canTaskAdd.value)) {
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
      <el-page-header @back="$router.back()" :title="isEdit ? '编辑任务' : '新增任务'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <el-form-item label="任务名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入任务名称" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="所属项目" prop="projectId">
        <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%">
          <el-option v-for="project in projectList" :key="project.id" :label="project.name" :value="project.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="负责人" prop="leaderId">
        <UserSelect v-model="form.leaderId" placeholder="请选择负责人" clearable />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startDate">
            <el-date-picker
              v-model="form.startDate"
              type="date"
              placeholder="选择开始时间"
              value-format="YYYY-MM-DD"
              style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="截止时间" prop="endDate">
            <el-date-picker
              v-model="form.endDate"
              type="date"
              placeholder="选择截止时间"
              value-format="YYYY-MM-DD"
              style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
              <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
              <el-option v-for="(value, key) of priority" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="任务描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入任务描述"
          maxlength="500"
          show-word-limit />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="预估工时">
            <el-input-number v-model="form.estimatedHours" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="实际工时">
            <el-input-number v-model="form.actualHours" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="剩余工时">
            <el-input-number v-model="form.remainingHours" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="故事点">
            <el-input-number v-model="form.storyPoints" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="验收标准">
            <el-input v-model="form.acceptanceCriteria" placeholder="请输入验收标准" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">依赖关系</el-divider>

      <div class="dependency-section">
        <div class="dependency-group">
          <div class="dependency-header">
            <span class="dependency-title">前置任务（依赖于此任务无法开始）</span>
            <el-button type="primary" size="small" @click="showDependencyDialog = true" :disabled="!isEdit">添加依赖</el-button>
          </div>
          <div class="dependency-list" v-if="dependencies.length > 0">
            <el-tag v-for="dep in dependencies" :key="dep.id" closable @close="handleRemoveDependency(dep.id)" class="dep-tag">
              {{ dep.name }}
            </el-tag>
          </div>
          <div v-else class="no-data">暂无前置任务</div>
        </div>

        <div class="dependency-group">
          <div class="dependency-header">
            <span class="dependency-title">后置任务（依赖此任务的任务）</span>
          </div>
          <div class="dependency-list" v-if="dependents.length > 0">
            <el-tag type="info" v-for="dep in dependents" :key="dep.id" class="dep-tag">
              {{ dep.name }}
            </el-tag>
          </div>
          <div v-else class="no-data">暂无后置任务</div>
        </div>
      </div>

      <el-dialog v-model="showDependencyDialog" title="添加任务依赖" width="400px">
        <el-select v-model="newDependencyId" placeholder="请选择任务" style="width: 100%">
          <el-option v-for="task in availableTasks" :key="task.id" :label="task.name" :value="task.id" />
        </el-select>
        <template #footer>
          <el-button @click="showDependencyDialog = false">取消</el-button>
          <el-button v-if="canTaskUpdate" type="primary" @click="handleAddDependency">确定</el-button>
        </template>
      </el-dialog>

      <el-form-item>
        <el-button v-if="isEdit ? canTaskUpdate : canTaskAdd" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.dependency-section {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.dependency-group {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.dependency-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dependency-title {
  font-weight: 500;
  color: #303133;
}

.dependency-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dep-tag {
  padding: 8px 12px;
}

.no-data {
  color: #909399;
  font-size: 14px;
  padding: 8px 0;
}
</style>
