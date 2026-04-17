<script setup lang="ts">
// @ts-nocheck
import { ref, computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ChatDotRound, DocumentAdd } from '@element-plus/icons-vue'
import { getOne, save, update, getStatus, getPriority, getProjectList, getList, getDependencies, getDependents, addDependency, removeDependency, submitApproval, getTaskComments, addComment, updateComment, deleteComment, getTimeLogs, addTimeLog, updateTimeLog, deleteTimeLog } from './api'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import { getList as getSprintList } from '@/views/business/sprintManage/api'
import { useUserStore } from '@/stores/user'
import UserSelect from '@/components/UserSelect.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import Editor from '@/components/Editor/index.vue'
import Upload from '@/components/Upload.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import ViewUserList from '@/components/view/ViewUserList.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const form = ref({
  name: '',
  projectId: '',
  leaderId: '',
  executorIds: [],
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

const isView = computed(() => route.query.action === 'view')
const hasTaskId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const isWorkflowReadonly = computed(() => fromWorkflow.value && !!workflowTaskId.value)
const isReadonly = computed(() => isView.value || isWorkflowReadonly.value)
const canTaskAdd = computed(() => checkPermi(['business/tasks/add']))
const canTaskUpdate = computed(() => checkPermi(['business/tasks/update']))
const canSubmitCurrentApproval = computed(() => form.value.status === '1' && !['1', '2'].includes(String(form.value.approvalStatus || '0')))
const canCloseReturnedInstance = computed(() => form.value.workflowInstanceId && form.value.approvalStatus === '3' && String(form.value.currentNodeName || '').includes('退回发起人'))
const workflowPanelRef = ref()
const reportSectionRef = ref()
const commentSectionRef = ref()

const dependencies = ref([])
const dependents = ref([])
const availableTasks = ref([])
const sprintList = ref([])
const showDependencyDialog = ref(false)
const newDependencyId = ref('')
const taskComments = ref([])
const timeLogs = ref([])
const commentLoading = ref(false)
const timeLogLoading = ref(false)
const commentSubmitting = ref(false)
const timeLogSubmitting = ref(false)
const commentDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const defaultReportTemplate = '<p>今日完成：</p><p><br></p><p>遇到问题：</p><p><br></p><p>下一步计划：</p><p><br></p>'
const commentForm = reactive({
  id: '',
  content: '',
  attachments: [],
})
const commentRules = {
  content: [{ required: true, message: '请输入评论内容', trigger: 'blur' }],
}
const timeLogForm = reactive({
  id: '',
  workDate: '',
  hours: 1,
  description: '',
  attachments: [],
  progress: 0,
})
const timeLogRules = {
  workDate: [{ required: true, message: '请选择工作日期', trigger: 'change' }],
  hours: [{ required: true, message: '请输入工时', trigger: 'blur' }],
  progress: [{ required: true, message: '请输入当前进度', trigger: 'blur' }],
}
const currentUserId = computed(() => String(userStore.id || ''))
const canCommentOnTask = computed(() => !!hasTaskId.value)
const canAddTimeLog = computed(() => !!hasTaskId.value)

function getDisplayUserName(user: any, fallback?: string) {
  return user?.nickname || user?.name || fallback || '-'
}

function isCurrentUserRecord(userId: string | number) {
  return String(userId || '') === currentUserId.value
}

async function loadTaskComments() {
  if (!hasTaskId.value) return
  commentLoading.value = true
  try {
    const res = await getTaskComments(route.query.id)
    taskComments.value = res.data || []
  } finally {
    commentLoading.value = false
  }
}

async function loadTimeLogs() {
  if (!hasTaskId.value) return
  timeLogLoading.value = true
  try {
    const res = await getTimeLogs(route.query.id)
    timeLogs.value = res.data || []
  } finally {
    timeLogLoading.value = false
  }
}

function resetCommentForm() {
  commentForm.id = ''
  commentForm.content = ''
  commentForm.attachments = []
}

function openCommentDialog() {
  resetCommentForm()
  commentDialogVisible.value = true
}

function startEditComment(item) {
  if (!isCurrentUserRecord(item.userId)) return
  commentForm.id = String(item.id)
  commentForm.content = item.content || ''
  commentForm.attachments = item.attachments || []
  commentDialogVisible.value = true
}

async function submitTaskComment() {
  if (!canCommentOnTask.value) return
  if (!commentForm.content.trim()) {
    return $sdk.msgWarning('请输入评论内容')
  }
  commentSubmitting.value = true
  try {
    if (commentForm.id) {
      await updateComment(commentForm.id, { content: commentForm.content.trim(), attachments: commentForm.attachments || [] })
      $sdk.msgSuccess('评论修改成功')
    } else {
      await addComment({ taskId: route.query.id, content: commentForm.content.trim(), attachments: commentForm.attachments || [] })
      $sdk.msgSuccess('评论发布成功')
    }
    commentDialogVisible.value = false
    resetCommentForm()
    await loadTaskComments()
  } catch (error) {
    $sdk.msgError(error?.message || error?.response?.data?.message || '评论提交失败')
  } finally {
    commentSubmitting.value = false
  }
}

async function handleDeleteTaskComment(item) {
  if (!isCurrentUserRecord(item.userId)) return $sdk.msgWarning('只能删除自己的评论')
  try {
    await $sdk.confirm('确定要删除该评论吗？')
    await deleteComment(item.id)
    $sdk.msgSuccess('评论删除成功')
    if (String(commentForm.id) === String(item.id)) {
      resetCommentForm()
      commentDialogVisible.value = false
    }
    await loadTaskComments()
  } catch (error) {
    if (error !== 'cancel') {
      $sdk.msgError(error?.message || error?.response?.data?.message || '评论删除失败')
    }
  }
}

async function submitTaskTimeLog() {
  if (!canAddTimeLog.value) return
  if (!timeLogForm.workDate) {
    return $sdk.msgWarning('请选择工作日期')
  }
  if (!timeLogForm.hours || Number(timeLogForm.hours) <= 0) {
    return $sdk.msgWarning('请输入有效工时')
  }
  if (!String(timeLogForm.description || '').replace(/<[^>]+>/g, '').trim()) {
    return $sdk.msgWarning('请输入汇报内容')
  }
  if (timeLogForm.progress === undefined || timeLogForm.progress === null || Number(timeLogForm.progress) < 0 || Number(timeLogForm.progress) > 100) {
    return $sdk.msgWarning('请输入0到100之间的当前进度')
  }
  timeLogSubmitting.value = true
  try {
    const payload = {
      workDate: timeLogForm.workDate,
      hours: Number(timeLogForm.hours),
      description: timeLogForm.description || '',
      attachments: timeLogForm.attachments || [],
      progress: Number(timeLogForm.progress || 0),
    }
    if (timeLogForm.id) {
      await updateTimeLog(timeLogForm.id, payload)
      $sdk.msgSuccess('任务汇报已修改')
    } else {
      await addTimeLog(route.query.id, payload)
      $sdk.msgSuccess('任务汇报已添加')
    }
    reportDialogVisible.value = false
    timeLogForm.id = ''
    timeLogForm.workDate = ''
    timeLogForm.hours = 1
    timeLogForm.description = ''
    timeLogForm.attachments = []
    timeLogForm.progress = Number(form.value.progress || 0)
    await Promise.all([loadTimeLogs(), reloadCurrent()])
  } catch (error) {
    $sdk.msgError(error?.message || error?.response?.data?.message || '任务汇报添加失败')
  } finally {
    timeLogSubmitting.value = false
  }
}

function startEditTimeLog(item) {
  if (!isCurrentUserRecord(item.userId)) return $sdk.msgWarning('只能编辑自己的任务汇报')
  timeLogForm.id = String(item.id)
  timeLogForm.workDate = item.workDate || ''
  timeLogForm.hours = Number(item.hours || 1)
  timeLogForm.progress = Number(item.progress ?? (form.value.progress || 0))
  timeLogForm.description = item.description || ''
  timeLogForm.attachments = item.attachments || []
  reportDialogVisible.value = true
}

function resetTimeLogForm() {
  timeLogForm.id = ''
  timeLogForm.workDate = ''
  timeLogForm.hours = 1
  timeLogForm.description = defaultReportTemplate
  timeLogForm.attachments = []
  timeLogForm.progress = Number(form.value.progress || 0)
}

function openTimeLogDialog() {
  resetTimeLogForm()
  reportDialogVisible.value = true
}

async function handleDeleteTimeLog(item) {
  if (!isCurrentUserRecord(item.userId)) return $sdk.msgWarning('只能删除自己的任务汇报')
  try {
    await $sdk.confirm('确定要删除这条任务汇报吗？')
    await deleteTimeLog(item.id)
    $sdk.msgSuccess('任务汇报删除成功')
    if (String(timeLogForm.id) === String(item.id)) {
      resetTimeLogForm()
      reportDialogVisible.value = false
    }
    await Promise.all([loadTimeLogs(), reloadCurrent()])
  } catch (error) {
    if (error !== 'cancel') {
      $sdk.msgError(error?.message || error?.response?.data?.message || '任务汇报删除失败')
    }
  }
}

async function loadDependencies() {
  if (!hasTaskId.value) return
  const [depRes, depenRes] = await Promise.all([
    getDependencies(route.query.id),
    getDependents(route.query.id)
  ])
  dependencies.value = depRes.data || []
  dependents.value = depenRes.data || []
}

async function loadAvailableTasks() {
  if (!form.value.projectId) {
    availableTasks.value = []
    return
  }
  const res = await getList({ pageNum: 1, pageSize: 1000, projectId: form.value.projectId })
  const allTasks = res.list || []
  availableTasks.value = allTasks.filter(t => t.id !== route.query.id)
}

async function loadSprintOptions() {
  const res = await getSprintList({ pageNum: 1, pageSize: 1000, projectId: form.value.projectId || undefined })
  sprintList.value = res.list || []
}

watch(() => form.value.projectId, () => {
  loadAvailableTasks()
  loadSprintOptions()
})

async function handleAddDependency() {
  if (isReadonly.value || !canTaskUpdate.value) return $sdk.msgWarning('当前操作没有权限')
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
  if (isReadonly.value || !canTaskUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  try {
    await removeDependency(route.query.id, depId)
    $sdk.msgSuccess('移除成功')
    await loadDependencies()
  } catch (e) {
    $sdk.msgError(e.message || '移除失败')
  }
}

const defaultForm = () => ({
  name: '',
  projectId: '',
  leaderId: '',
  executorIds: [],
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

async function loadTask() {
  if (!hasTaskId.value) {
    form.value = defaultForm()
    dependencies.value = []
    dependents.value = []
    taskComments.value = []
    timeLogs.value = []
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = {
    ...data,
    estimatedHours: data.estimatedHours || 0,
    actualHours: data.actualHours || 0,
    remainingHours: data.remainingHours || 0,
    storyPoints: data.storyPoints || 0,
  }
  await loadDependencies()
  loadTaskComments()
  loadTimeLogs()
  loadSprintOptions()
}

watch(
  () => [route.query.id, route.query.action, route.query.tab, route.query.taskId, route.query.instanceId, route.query.fromWorkflow],
  () => {
    loadTask()
  },
  { immediate: true },
)

function reloadCurrent() {
  return loadTask()
}

function submit() {
  if (isReadonly.value || (isEdit.value && !canTaskUpdate.value) || (!isEdit.value && !canTaskAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
  }
  formRef.value.validate((valid) => {
    if (valid) {
      const api = isEdit.value ? update : save
      api(form.value).then(() => {
        $sdk.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
        if (isEdit.value) {
          router.back()
        } else {
          router.push('/taskManage/index')
        }
      })
    }
  })
}

function cancel() {
  router.back()
}

async function handleSubmitApproval() {
  if (!canTaskUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  if (canCloseReturnedInstance.value) {
    await resubmitReturnedWorkflowInstance(form.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    $sdk.msgSuccess('重新提交审批成功')
    await reloadCurrent()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  await submitApproval(route.query.id)
  $sdk.msgSuccess('提交审批成功')
  router.back()
}

async function handleCloseReturnedInstance() {
  const { value } = await ElMessageBox.prompt('结束后实例将进入已取消状态，业务对象将同步更新为最终驳回态。', '结束退回实例', {
    confirmButtonText: '确认结束',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入结束原因（选填）',
    inputType: 'textarea',
  })
  await closeReturnedWorkflowInstance(form.value.workflowInstanceId, { reason: value || '发起人确认结束退回实例' })
  $sdk.msgSuccess('退回实例已结束')
  reloadCurrent()
}

function goToEdit() {
  if (!route.query.id) return
  router.push({ path: '/taskManage/form', query: { id: route.query.id } })
}

function scrollToWorkflowPanel() {
  workflowPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToTaskSection() {
  if (route.query.tab === 'report') {
    reportSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  if (route.query.tab === 'comment') {
    commentSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const normalizedAttachments = computed(() => Array.isArray(form.value.attachments) ? form.value.attachments : [])

watch(() => route.query.tab, () => {
  setTimeout(scrollToTaskSection, 50)
})

watch(hasTaskId, (value) => {
  if (value) {
    setTimeout(scrollToTaskSection, 50)
  }
}, { immediate: true })
</script>

<template>
  <div class="Gcard task-form-page">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isReadonly ? '任务详情' : isEdit ? '编辑任务' : '新增任务'">
        <template #extra>
          <el-button v-if="hasTaskId" type="success" plain :icon="DocumentAdd" @click="openTimeLogDialog">新增汇报</el-button>
          <el-button v-if="hasTaskId" type="primary" :icon="ChatDotRound" @click="openCommentDialog">发表评论</el-button>
          <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </template>
      </el-page-header>
    </div>

    <el-alert
      v-if="isEdit && form.approvalStatus === '3'"
      :title="String(form.currentNodeName || '').includes('退回发起人') ? '该任务审批已退回发起人，可修改后重新提交，或直接结束退回实例。' : '该任务审批已驳回，请根据意见调整后重新提交。'"
      type="warning"
      :closable="false"
      show-icon
      class="mb-16"
    >
      <template #default>
        <div class="top-alert-actions">
          <el-button v-if="route.query.action === 'view'" type="primary" size="small" @click="goToEdit">去编辑</el-button>
          <el-button v-if="isEdit && canTaskUpdate && canSubmitCurrentApproval" type="warning" size="small" @click="handleSubmitApproval">重新提交审批</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" size="small" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </div>
      </template>
    </el-alert>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <div class="task-sections">
      <section class="task-section section-card section-card--basic task-section--hero">
        <div class="task-section__header">
          <div class="task-section__title">基本信息</div>
          <div class="task-section__desc">维护任务归属、负责人和基础计划信息。</div>
        </div>

        <el-row :gutter="20" class="task-info-row">
          <el-col :xs="24" :sm="hasTaskId ? 12 : 24">
            <el-form-item label="任务名称" prop="name">
              <ViewField v-if="isReadonly" :value="form.name" />
              <el-input v-else v-model="form.name" placeholder="请输入任务名称" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item v-if="hasTaskId" label="任务编号">
              <ViewField :value="form.code" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="task-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="所属项目" prop="projectId">
              <ViewEntity v-if="isReadonly" :title="form.project?.name" :subtitle="form.project?.code" />
              <ProjectSelect v-else v-model="form.projectId" placeholder="请选择项目" :exclude-statuses="['1']" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="父任务">
              <ViewEntity v-if="isReadonly" :title="form.parent?.name" :subtitle="form.parent?.code" />
              <div v-else class="field-with-tip">
                <el-select v-model="form.parentId" placeholder="请选择父任务" clearable style="width: 100%">
                  <el-option v-for="task in availableTasks" :key="task.id" :label="task.name" :value="task.id" />
                </el-select>
                <div class="field-tip">仅可选择当前项目内的任务作为父任务</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="task-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="所属Sprint">
              <ViewEntity v-if="isReadonly" :title="form.sprint?.name" />
              <el-select v-else v-model="form.sprintId" placeholder="请选择Sprint" style="width: 100%" clearable>
                <el-option v-for="sprint in sprintList" :key="sprint.id" :label="sprint.name" :value="sprint.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12"></el-col>
        </el-row>

        <el-row :gutter="20" class="task-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="负责人" prop="leaderId">
              <ViewUser v-if="isReadonly" :user="form.leader" />
              <UserSelect v-else v-model="form.leaderId" placeholder="请选择负责人" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="经办人">
              <ViewUserList v-if="isReadonly" :users="form.executors || []" />
              <div v-else class="field-with-tip">
                <UserSelect v-model="form.executorIds" placeholder="请选择经办人" clearable multiple />
                <div class="field-tip">可选择多人协同执行任务</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="task-info-row">
          <el-col :xs="24" :sm="12">
            <el-form-item label="开始时间" prop="startDate">
              <ViewField v-if="isReadonly" :value="form.startDate" />
              <el-date-picker
                v-else
                v-model="form.startDate"
                type="date"
                placeholder="选择开始时间"
                value-format="YYYY-MM-DD"
                style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="截止时间" prop="endDate">
              <ViewField v-if="isReadonly" :value="form.endDate" />
              <el-date-picker
                v-else
                v-model="form.endDate"
                type="date"
                placeholder="选择截止时间"
                value-format="YYYY-MM-DD"
                style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="task-info-row task-info-row--last">
          <el-col v-if="hasTaskId" :xs="24" :sm="12">
            <el-form-item label="状态" prop="status">
                <ViewTagField v-if="isReadonly" :text="status[form.status]" :type="form.status === '3' ? 'success' : form.status === '2' ? 'warning' : form.status === '4' ? 'danger' : 'info'" />
                <el-select v-else v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option v-for="(value, key) of status" :key="key" :label="value" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="hasTaskId ? 12 : 24">
            <el-form-item label="优先级" prop="priority">
                <ViewTagField v-if="isReadonly" :text="priority[form.priority]" :type="form.priority === '3' ? 'danger' : form.priority === '2' ? 'warning' : 'info'" />
                <el-select v-else v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option v-for="(value, key) of priority" :key="key" :label="value" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="任务描述" prop="description">
          <ViewRichText v-if="isReadonly" :html="form.description" />
          <Editor v-else v-model="form.description" style="min-height: 220px" />
        </el-form-item>
      </section>

      <section class="task-section section-card section-card--execution">
        <div class="task-section__header">
          <div class="task-section__title">执行信息</div>
          <div class="task-section__desc">维护工时、验收标准和附件，支撑任务执行与交付。</div>
        </div>

        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-card__title">进度</div>
            <div class="metric-card__desc">用于表达任务当前完成百分比。</div>
              <div v-if="isReadonly" class="progress-compact">
                <div class="progress-compact__value">{{ form.progress ?? 0 }}%</div>
                <el-progress :percentage="Number(form.progress || 0)" :stroke-width="8" :show-text="false" />
              </div>
              <el-input-number v-else v-model="form.progress" :min="0" :max="100" :step="5" style="width: 100%" />
          </div>
          <div class="metric-card">
            <div class="metric-card__title">预估工时</div>
            <div class="metric-card__desc">用于评估交付成本和排期。</div>
              <ViewField v-if="isReadonly" :value="form.estimatedHours" class="view-field--inline" />
              <el-input-number v-else v-model="form.estimatedHours" :min="0" :step="1" style="width: 100%" />
          </div>
          <div v-if="hasTaskId" class="metric-card">
            <div class="metric-card__title">实际工时</div>
            <div class="metric-card__desc">建议通过任务汇报维护。</div>
                <ViewField v-if="isReadonly" :value="form.actualHours" class="view-field--inline" />
                <el-input-number v-else v-model="form.actualHours" :min="0" :step="1" style="width: 100%" :disabled="isReadonly" />
          </div>
          <div v-if="hasTaskId" class="metric-card">
            <div class="metric-card__title">剩余工时</div>
            <div class="metric-card__desc">用于跟踪当前执行剩余工作量。</div>
              <ViewField v-if="isReadonly" :value="form.remainingHours" class="view-field--inline" />
              <el-input-number v-else v-model="form.remainingHours" :min="0" :step="1" style="width: 100%" :disabled="isReadonly" />
          </div>
          <div class="metric-card">
            <div class="metric-card__title">故事点</div>
            <div class="metric-card__desc">用于敏捷估算复杂度。</div>
              <ViewField v-if="isReadonly" :value="form.storyPoints" class="view-field--inline" />
              <el-input-number v-else v-model="form.storyPoints" :min="0" :step="1" style="width: 100%" />
          </div>
        </div>

        <el-form-item label="验收标准">
          <ViewRichText v-if="isReadonly" :html="form.acceptanceCriteria" />
          <Editor v-else v-model="form.acceptanceCriteria" style="min-height: 160px" />
        </el-form-item>

        <el-form-item label="任务附件">
          <ViewFileList v-if="isReadonly" :files="normalizedAttachments" />
          <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
        </el-form-item>

        <div v-if="hasTaskId" ref="reportSectionRef" class="execution-subsection" v-loading="timeLogLoading">
          <div class="execution-subsection__header">
            <div>
              <div class="execution-subsection__title">
                <span>任务汇报</span>
                <el-tag size="small" type="success">{{ timeLogs.length }}</el-tag>
              </div>
              <div class="execution-subsection__desc">记录每天在任务上的投入、进展和工作内容，作为轻量任务汇报。</div>
            </div>
          </div>

          <div v-if="timeLogs.length" class="record-list">
            <div v-for="item in timeLogs" :key="item.id" class="record-card">
              <div class="record-card__header">
                <div class="record-card__author">{{ getDisplayUserName(item.user, item.userId) }}</div>
                <div class="record-card__meta">
                  <el-tag size="small" effect="plain">{{ item.workDate || '-' }}</el-tag>
                  <el-tag size="small" type="success" effect="plain">{{ item.hours }} 小时</el-tag>
                  <el-tag size="small" type="warning" effect="plain">进度 {{ item.progress ?? 0 }}%</el-tag>
                  <span>{{ item.createTime || '-' }}</span>
                  <span v-if="item.attachments?.length">{{ item.attachments.length }} 个附件</span>
                </div>
              </div>
              <ViewRichText v-if="item.description" :html="item.description" class="record-card__content record-card__content--rich" />
              <div v-else class="record-card__content">未填写工作内容</div>
              <div v-if="item.attachments?.length" class="record-card__attachments">
                <ViewFileList :files="item.attachments" />
              </div>
              <div v-if="isCurrentUserRecord(item.userId)" class="record-card__actions">
                <el-button link type="primary" @click="startEditTimeLog(item)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteTimeLog(item)">删除</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无任务汇报" />
        </div>
      </section>

      <section v-if="hasTaskId" ref="commentSectionRef" class="task-section section-card section-card--comment" v-loading="commentLoading">
        <div class="task-section__header">
          <div class="task-section__title">
            <span>任务评论</span>
            <el-tag size="small" type="primary">{{ taskComments.length }}</el-tag>
          </div>
          <div class="task-section__desc">用于记录任务讨论、补充说明和协作反馈。</div>
        </div>

        <div v-if="taskComments.length" class="comment-list">
          <div v-for="item in taskComments" :key="item.id" class="comment-card">
            <div class="comment-card__header">
              <div class="comment-card__summary">
                <div class="comment-card__author">{{ getDisplayUserName(item.user, item.userId) }}</div>
                <div class="comment-card__meta">
                  <span>{{ item.createTime || '-' }}</span>
                  <span v-if="item.isEdited === '1'">已编辑</span>
                  <span v-if="item.attachments?.length">{{ item.attachments.length }} 个附件</span>
                </div>
              </div>
              <div v-if="isCurrentUserRecord(item.userId)" class="comment-card__actions">
                <el-button link type="primary" @click="startEditComment(item)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteTaskComment(item)">删除</el-button>
              </div>
            </div>
            <div class="comment-card__content">{{ item.content }}</div>
            <div v-if="item.attachments?.length" class="comment-card__attachments">
              <ViewFileList :files="item.attachments" />
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无任务评论" />
      </section>

      <section v-if="isEdit" class="task-section section-card section-card--approval">
        <div class="task-section__header">
          <div class="task-section__title">审批信息</div>
          <div class="task-section__desc">查看当前审批状态、节点信息以及任务依赖关系。</div>
        </div>

        <el-form-item label="审批状态">
          <ViewTagField :text="{ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[form.approvalStatus] || '无需审批'" :type="form.approvalStatus === '2' ? 'success' : form.approvalStatus === '1' ? 'warning' : form.approvalStatus === '3' ? 'danger' : 'info'" />
        </el-form-item>

        <el-form-item label="当前审批节点" v-if="form.currentNodeName">
          <el-tag type="warning">{{ form.currentNodeName }}</el-tag>
        </el-form-item>

        <el-alert
          v-if="form.approvalStatus === '2'"
          title="该任务审批已通过，当前业务状态应进入处理中。"
          type="success"
          :closable="false"
          show-icon
          class="mb-16"
        />

        <div class="dependency-section">
          <div class="dependency-group">
            <div class="dependency-header">
              <span class="dependency-title">前置任务（依赖于此任务无法开始）</span>
              <el-button type="primary" size="small" @click="showDependencyDialog = true" :disabled="!isEdit || isReadonly">添加依赖</el-button>
            </div>
            <div class="dependency-list" v-if="dependencies.length > 0">
              <el-tag v-for="dep in dependencies" :key="dep.id" :closable="!isReadonly" @close="handleRemoveDependency(dep.id)" class="dep-tag">
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
          <el-select v-model="newDependencyId" placeholder="请选择任务" style="width: 100%" :disabled="isReadonly">
            <el-option v-for="task in availableTasks" :key="task.id" :label="task.name" :value="task.id" />
          </el-select>
          <template #footer>
            <el-button @click="showDependencyDialog = false">取消</el-button>
            <el-button v-if="canTaskUpdate && !isReadonly" type="primary" @click="handleAddDependency">确定</el-button>
          </template>
        </el-dialog>
      </section>

      </div>

      <el-form-item class="footer-actions">
        <el-button v-if="!isReadonly && (isEdit ? canTaskUpdate : canTaskAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
        <el-button v-if="!isReadonly && isEdit && canTaskUpdate && canSubmitCurrentApproval" type="warning" @click="handleSubmitApproval">提交审批</el-button>
      </el-form-item>
    </el-form>

    <div v-if="fromWorkflow && workflowTaskId" ref="workflowPanelRef" class="workflow-panel-section">
      <div class="workflow-panel-section__header">审批操作区</div>
      <WorkflowApprovalPanel
        :task-id="workflowTaskId"
        :instance-id="workflowInstanceId"
        :node-name="form.currentNodeName"
        @approved="reloadCurrent"
      />
    </div>

    <BaDialog v-model="reportDialogVisible" :title="timeLogForm.id ? '编辑任务汇报' : '新增任务汇报'" width="760" @confirm="submitTaskTimeLog">
      <template #form>
        <el-form :model="timeLogForm" :rules="timeLogRules" label-width="90px" v-loading="timeLogSubmitting" require-asterisk-position="right">
          <el-form-item label="工作日期" prop="workDate" required>
            <el-date-picker v-model="timeLogForm.workDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择工作日期" style="width: 100%" />
          </el-form-item>
          <el-form-item label="工时" prop="hours" required>
            <el-input-number v-model="timeLogForm.hours" :min="0.5" :step="0.5" style="width: 100%" placeholder="请输入工时" />
          </el-form-item>
          <el-form-item label="当前进度" prop="progress" required>
            <el-input-number v-model="timeLogForm.progress" :min="0" :max="100" :step="5" style="width: 100%" placeholder="请输入当前进度" />
          </el-form-item>
          <el-form-item label="汇报内容" required>
            <Editor v-model="timeLogForm.description" style="min-height: 220px" placeholder="请填写本次任务汇报内容" />
            <div class="field-tip">建议填写本次完成内容、遇到的问题和下一步计划</div>
          </el-form-item>
          <el-form-item label="汇报附件">
            <Upload v-model:fileList="timeLogForm.attachments" type="file" multiple />
          </el-form-item>
        </el-form>
      </template>
    </BaDialog>

    <BaDialog v-model="commentDialogVisible" :title="commentForm.id ? '编辑评论' : '发表评论'" width="680" @confirm="submitTaskComment">
      <template #form>
        <el-form :model="commentForm" :rules="commentRules" label-width="90px" v-loading="commentSubmitting" require-asterisk-position="right">
          <el-form-item label="评论内容" prop="content" required>
            <el-input v-model="commentForm.content" type="textarea" :rows="5" maxlength="1000" show-word-limit placeholder="请输入评论内容" />
          </el-form-item>
          <el-form-item label="评论附件">
            <Upload v-model:fileList="commentForm.attachments" type="file" multiple />
          </el-form-item>
        </el-form>
      </template>
    </BaDialog>
  </div>
</template>

<style lang="scss" scoped>
.dependency-section {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.task-form-page {
  padding: 4px 6px 8px;
}

.task-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-section {
  padding: 24px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.task-section--hero {
  border-color: rgba(64, 158, 255, 0.16);
  background: linear-gradient(180deg, rgba(64, 158, 255, 0.05) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.task-section__header {
  margin-bottom: 20px;
}

.task-section__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.task-section__desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.task-info-row {
  margin-bottom: 4px;
}

.task-info-row--last {
  margin-bottom: 0;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.metric-card {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
}

.metric-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.metric-card__desc {
  margin-top: 4px;
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.progress-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-compact__value {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.execution-subsection {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed var(--el-border-color);
}

.execution-subsection__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.execution-subsection__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.execution-subsection__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.record-editor__actions,
.comment-editor__actions,
.record-card__actions,
.comment-card__actions {
  display: flex;
  gap: 8px;
}

.record-list,
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card,
.comment-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.record-card__meta,
.comment-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.record-card__header,
.comment-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.record-card__author,
.comment-card__author {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.comment-card__summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-card__content,
.comment-card__content {
  margin-top: 10px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.record-card__content--rich {
  white-space: normal;
}

.record-card__attachments,
.comment-card__attachments {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
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

.workflow-panel-section {
  margin-top: 28px;
  max-width: 920px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
}

.workflow-panel-section__header {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.top-alert-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.field-with-tip {
  width: 100%;
}

.field-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.view-field--inline {
  :deep(.view-field) {
    min-height: 40px;
    padding: 8px 0;
  }
}

.footer-actions {
  margin-top: 8px;
  padding-top: 12px;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .task-section {
    padding: 18px;
    border-radius: 12px;
  }

  .task-sections {
    gap: 18px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1080px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
