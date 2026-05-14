<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus } from './api'
import FormPageShell from '@/components/FormPageShell.vue'
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
  ownerId: '',
  delayReason: '',
  phase: '',
  changeImpactFlag: '0',
  riskImpactFlag: '0',
  attachments: [],
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
const taskSummary = computed(() => form.value.taskSummary || { total: 0, completed: 0, inProgress: 0, pending: 0, completionRate: 0 })
const linkedTasks = computed(() => form.value.tasks || [])
const affectedTasks = ref([])
const milestoneImpactTips = computed(() => {
  return affectedTasks.value.filter((task) => {
    if (!form.value.dueDate || !task.endDate) return false
    return task.endDate > form.value.dueDate
  })
})
const milestoneTimeStatus = computed(() => {
  if (!form.value.dueDate || String(form.value.status || '') === '2') return '-'
  const today = new Date().toISOString().split('T')[0]
  if (form.value.dueDate < today) return '已超期'
  if (form.value.dueDate === today) return '今日到期'
  return '按计划推进'
})

const isMilestoneFormRoute = useCurrentRouteGuard(route, '/milestoneManage/form')

const defaultForm = () => ({
  name: '',
  projectId: '',
  description: '',
  dueDate: '',
  completedDate: '',
  status: '1',
  deliverables: [],
  ownerId: '',
  delayReason: '',
  phase: '',
  changeImpactFlag: '0',
  riskImpactFlag: '0',
  attachments: [],
  sort: 0,
})

async function loadMilestone() {
  if (!isMilestoneFormRoute()) return
  if (!hasMilestoneId.value) {
    form.value = {
      ...defaultForm(),
      projectId: String(route.query.projectId || ''),
    }
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = data || {}
  loadAffectedTasks()
}

async function loadAffectedTasks() {
  if (!form.value.projectId || !hasMilestoneId.value) {
    affectedTasks.value = []
    return
  }
  const res = await getTaskList({ pageNum: 1, pageSize: 1000, projectId: form.value.projectId, milestoneId: route.query.id })
  affectedTasks.value = res.list || []
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    if (!isMilestoneFormRoute()) return
    loadMilestone()
  },
  { immediate: true },
)

watch(() => form.value.dueDate, () => {
  if (hasMilestoneId.value) loadAffectedTasks()
})

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
  <FormPageShell class="milestone-form-page">
    <template #footerMeta>
      <span>{{ isView ? '查看模式' : isEdit ? '编辑模式' : '新建模式' }}</span>
      <span v-if="hasMilestoneId">当前里程碑已关联任务</span>
    </template>

    <el-page-header class="business-form-header" @back="$router.back()" :title="isView ? '里程碑详情' : isEdit ? '编辑里程碑' : '新增里程碑'" />

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="business-form" style="max-width: 800px">
      <div class="milestone-sections">
      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">基本信息</div>
            <div class="section-desc">维护里程碑名称、项目归属、责任人和计划时间，让关键交付节点边界清楚可见。</div>
          </div>
        </div>

        <div class="milestone-section-fields">
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

      <el-form-item label="里程碑责任人">
        <ViewUser v-if="isView" :user="form.owner" />
        <UserSelect v-else v-model="form.ownerId" placeholder="请选择里程碑责任人" clearable />
      </el-form-item>

      <el-alert
        v-if="milestoneImpactTips.length && !isView"
        type="warning"
        :closable="false"
        show-icon
        class="mb16"
      >
        <template #title>
          <div class="milestone-impact-alert__title">里程碑变更影响提示</div>
        </template>
        <div class="milestone-impact-alert__list">
          <div v-for="task in milestoneImpactTips.slice(0, 5)" :key="task.id">
            任务《{{ task.name }}》截止时间 {{ task.endDate }} 晚于当前里程碑日期 {{ form.dueDate }}
          </div>
        </div>
      </el-alert>

      <el-form-item label="状态" v-if="hasMilestoneId">
        <ViewTagField v-if="isView" :text="status[form.status]" :type="form.status === '2' ? 'success' : form.status === '3' ? 'warning' : form.status === '4' ? 'info' : 'primary'" />
        <el-select v-else v-model="form.status" placeholder="请选择状态" style="width: 100%">
          <el-option v-for="(label, key) in status" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>

      <el-form-item label="实际完成日期" v-if="isEdit">
        <el-date-picker v-model="form.completedDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" :disabled="isView" style="width: 100%" />
      </el-form-item>

      <el-form-item label="里程碑描述">
        <ViewField v-if="isView" :value="form.description" />
        <el-input v-else v-model="form.description" type="textarea" :rows="4" placeholder="请输入描述" />
      </el-form-item>

      <el-form-item label="延期原因">
        <ViewField v-if="isView" :value="form.delayReason" />
        <el-input v-else v-model="form.delayReason" type="textarea" :rows="3" placeholder="请输入延期或偏差原因" />
      </el-form-item>

      <el-form-item label="里程碑阶段">
        <ViewField v-if="isView" :value="form.phase" />
        <el-input v-else v-model="form.phase" placeholder="请输入里程碑阶段" maxlength="30" />
      </el-form-item>

      <el-form-item label="受变更影响">
        <ViewField v-if="isView" :value="form.changeImpactFlag === '1' ? '是' : '否'" />
        <el-switch v-else v-model="form.changeImpactFlag" active-value="1" inactive-value="0" />
      </el-form-item>

      <el-form-item label="受风险影响">
        <ViewField v-if="isView" :value="form.riskImpactFlag === '1' ? '是' : '否'" />
        <el-switch v-else v-model="form.riskImpactFlag" active-value="1" inactive-value="0" />
      </el-form-item>
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">交付物与附件</div>
            <div class="section-desc">统一维护交付物清单、里程碑附件和补充说明，方便后续执行对齐。</div>
          </div>
        </div>

        <div class="milestone-section-fields">

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

      <el-form-item label="里程碑附件">
        <ViewFileList v-if="isView" :files="form.attachments || []" />
        <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
      </el-form-item>

      <el-form-item label="排序">
        <ViewField v-if="isView" :value="form.sort" />
        <el-input-number v-else v-model="form.sort" :min="0" />
      </el-form-item>
        </div>
      </section>

      <template v-if="hasMilestoneId">
        <section class="section-card">
          <div class="section-header">
            <div>
              <div class="section-title">任务概况</div>
              <div class="section-desc">查看关联任务数量、完成率和当前时间状态，辅助评估里程碑推进情况。</div>
            </div>
          </div>
        <el-divider content-position="left">任务概况</el-divider>

        <div class="milestone-summary-grid">
          <div class="milestone-summary-card"><span>关联任务</span><strong>{{ taskSummary.total }}</strong></div>
          <div class="milestone-summary-card"><span>已完成</span><strong>{{ taskSummary.completed }}</strong></div>
          <div class="milestone-summary-card"><span>进行中</span><strong>{{ taskSummary.inProgress }}</strong></div>
          <div class="milestone-summary-card"><span>待处理</span><strong>{{ taskSummary.pending }}</strong></div>
          <div class="milestone-summary-card"><span>完成率</span><strong>{{ taskSummary.completionRate }}%</strong></div>
          <div class="milestone-summary-card"><span>时间状态</span><strong>{{ milestoneTimeStatus }}</strong></div>
        </div>

        <el-divider content-position="left">关联任务列表</el-divider>

        <el-table :data="linkedTasks" stripe>
          <el-table-column prop="name" label="任务名称" min-width="220">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push({ path: '/taskManage/form', query: { id: row.id, action: 'view' } })">{{ row.name || '-' }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="任务编号" width="140" />
          <el-table-column label="负责人" min-width="140">
            <template #default="{ row }">
              <ViewUser v-if="row.leader" :user="row.leader" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '待处理', '2': '处理中', '3': '已完成', '4': '已驳回', '5': '暂缓' }[row.status] || '-'" :type="row.status === '3' ? 'success' : row.status === '2' ? 'warning' : 'info'" />
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="100">
            <template #default="{ row }">
              <ViewTagField :text="{ '1': '低', '2': '中', '3': '高' }[row.priority] || '-'" :type="row.priority === '3' ? 'danger' : row.priority === '2' ? 'warning' : 'info'" />
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.progress || 0" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column prop="endDate" label="截止时间" width="120" />
        </el-table>
        </section>
      </template>

      </div>
    </el-form>
    <template #footer>
      <el-button v-if="!isView && (isEdit ? canMilestoneUpdate : canMilestoneAdd)" type="primary" @click="submit">提交</el-button>
      <el-button @click="cancel">取消</el-button>
    </template>
  </FormPageShell>
</template>

<style scoped>
.milestone-form-page {
  min-height: 100%;
}

.milestone-sections {
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

.milestone-section-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.milestone-form-page :deep(.el-form-item) {
  margin: 0 !important;
}

.milestone-form-page :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.input-new-tag {
  vertical-align: middle;
}

.milestone-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.milestone-summary-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.milestone-summary-card span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.milestone-summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  color: var(--el-text-color-primary);
}

.milestone-impact-alert__title {
  font-size: 14px;
  font-weight: 600;
}

.milestone-impact-alert__list {
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

  .milestone-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
