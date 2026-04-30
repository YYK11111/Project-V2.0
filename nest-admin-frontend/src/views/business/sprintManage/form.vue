<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus } from './api'
import { getList as getTaskList } from '@/views/business/taskManage/api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import Upload from '@/components/Upload.vue'
import UserSelect from '@/components/UserSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  name: '',
  projectId: '',
  status: '1',
  goal: '',
  ownerId: '',
  startDate: '',
  endDate: '',
  delayReason: '',
  changeImpactFlag: '0',
  healthScoreSnapshot: 0,
  totalStoryPoints: 0,
  completedStoryPoints: 0,
  totalTaskCount: 0,
  completedTaskCount: 0,
  attachments: [],
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
const sprintTasks = ref([])
const sprintImpactTips = computed(() => {
  return sprintTasks.value.filter((task) => {
    const beforeStart = form.value.startDate && task.startDate && task.startDate < form.value.startDate
    const afterEnd = form.value.endDate && task.endDate && task.endDate > form.value.endDate
    return beforeStart || afterEnd
  })
})

const isSprintFormRoute = useCurrentRouteGuard(route, '/sprintManage/form')

const defaultForm = () => ({
  name: '',
  projectId: '',
  status: '1',
  goal: '',
  ownerId: '',
  startDate: '',
  endDate: '',
  delayReason: '',
  changeImpactFlag: '0',
  healthScoreSnapshot: 0,
  totalStoryPoints: 0,
  completedStoryPoints: 0,
  totalTaskCount: 0,
  completedTaskCount: 0,
  attachments: [],
  sort: 0,
})

async function loadSprint() {
  if (!isSprintFormRoute()) return
  if (!hasSprintId.value) {
    form.value = {
      ...defaultForm(),
      projectId: String(route.query.projectId || ''),
    }
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = data || {}
  loadSprintTasks()
}

async function loadSprintTasks() {
  if (!form.value.projectId || !hasSprintId.value) {
    sprintTasks.value = []
    return
  }
  const res = await getTaskList({ pageNum: 1, pageSize: 1000, projectId: form.value.projectId, sprintId: route.query.id })
  sprintTasks.value = res.list || []
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    if (!isSprintFormRoute()) return
    loadSprint()
  },
  { immediate: true },
)

watch(() => [form.value.startDate, form.value.endDate], () => {
  if (hasSprintId.value) loadSprintTasks()
})

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
  <div class="sprint-form-page">
    <div class="Gcard sprint-form-shell">
    <div class="sprint-form-shell__top">
      <el-page-header @back="$router.back()" :title="isView ? 'Sprint详情' : isEdit ? '编辑Sprint' : '新增Sprint'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <div class="sprint-sections">
      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">基本信息</div>
            <div class="section-desc">维护 Sprint 名称、归属项目、状态和时间范围，先把执行边界建立清楚。</div>
          </div>
        </div>

        <div class="sprint-section-fields">
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

      <el-form-item label="Sprint负责人">
        <ViewUser v-if="isView" :user="form.owner" />
        <UserSelect v-else v-model="form.ownerId" placeholder="请选择Sprint负责人" clearable />
      </el-form-item>

      <el-form-item label="开始日期">
        <ViewField v-if="isView" :value="form.startDate" />
        <el-date-picker v-else v-model="form.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <el-form-item label="结束日期">
        <ViewField v-if="isView" :value="form.endDate" />
        <el-date-picker v-else v-model="form.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <el-form-item label="偏差说明">
        <ViewField v-if="isView" :value="form.delayReason" />
        <el-input v-else v-model="form.delayReason" type="textarea" :rows="3" placeholder="请输入延期或偏差说明" />
      </el-form-item>

      <el-form-item label="受变更影响">
        <ViewField v-if="isView" :value="form.changeImpactFlag === '1' ? '是' : '否'" />
        <el-switch v-else v-model="form.changeImpactFlag" active-value="1" inactive-value="0" />
      </el-form-item>

      <el-form-item label="健康度快照">
        <ViewField v-if="isView" :value="form.healthScoreSnapshot" />
        <el-input-number v-else v-model="form.healthScoreSnapshot" :min="0" :max="100" :precision="2" style="width: 100%" />
      </el-form-item>
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">执行指标与附件</div>
            <div class="section-desc">统一查看变更提示、故事点和任务数统计，并维护 Sprint 附件。</div>
          </div>
        </div>

        <div class="sprint-section-fields">

      <el-alert
        v-if="sprintImpactTips.length && !isView"
        type="warning"
        :closable="false"
        show-icon
        class="mb16"
      >
        <template #title>
          <div class="sprint-impact-alert__title">Sprint 变更影响提示</div>
        </template>
        <div class="sprint-impact-alert__list">
          <div v-for="task in sprintImpactTips.slice(0, 5)" :key="task.id">
            任务《{{ task.name }}》当前时间范围为 {{ task.startDate || '-' }} 至 {{ task.endDate || '-' }}，已超出当前 Sprint 边界
          </div>
        </div>
      </el-alert>

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

      <el-form-item label="Sprint附件">
        <ViewFileList v-if="isView" :files="form.attachments || []" />
        <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
      </el-form-item>

      <el-form-item label="排序">
        <ViewField v-if="isView" :value="form.sort" />
        <el-input-number v-else v-model="form.sort" :min="0" />
      </el-form-item>
        </div>
      </section>

      <el-form-item v-if="!isView" class="footer-actions">
        <el-button v-if="!isView && (isEdit ? canSprintUpdate : canSprintAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
      </div>
    </el-form>
    </div>
  </div>
</template>

<style scoped>
.sprint-form-page {
  min-height: 100%;
}

.sprint-form-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.sprint-form-page :deep(.el-row) {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.sprint-form-shell__top {
  margin-bottom: 20px;
}

.sprint-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  padding: 22px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.section-header {
  margin-bottom: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.sprint-section-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sprint-form-page :deep(.el-form-item) {
  margin: 0 !important;
}

.sprint-form-page :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.footer-actions :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-actions :deep(.el-button) {
  min-width: 112px;
}

.footer-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.sprint-impact-alert__title {
  font-size: 14px;
  font-weight: 600;
}

.sprint-impact-alert__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .section-card {
    padding: 18px;
  }
}
</style>
