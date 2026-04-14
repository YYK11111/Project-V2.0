<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOne, save, update, getStatus, getType, getImpact, approve, reject, submitApproval } from './api'
import ProjectSelect from '@/components/ProjectSelect.vue'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  title: '',
  projectId: '',
  type: '6',
  impact: '2',
  status: '1',
  description: '',
  reason: '',
  impactAnalysis: '',
  attachments: [],
  costImpact: 0,
  scheduleImpact: 0,
  requesterId: '',
  approverId: '',
  approvalComment: '',
  sort: 0,
})

const rules = {
  title: [{ required: true, message: '请输入变更标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
}

const statusMap = ref({})
const typeMap = ref({})
const impactMap = ref({})

getStatus().then(({ data }) => (statusMap.value = data || {}))
getType().then(({ data }) => (typeMap.value = data || {}))
getImpact().then(({ data }) => (impactMap.value = data || {}))

const isView = computed(() => route.query.action === 'view')
const isEdit = computed(() => !!route.query.id && !isView.value)
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const canChangeAdd = computed(() => checkPermi(['business/changes/add']))
const canChangeUpdate = computed(() => checkPermi(['business/changes/update']))

if (isEdit.value || isView.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = data || {}
  })
}

function reloadCurrent() {
  if (!route.query.id) return
  getOne(route.query.id).then(({ data }) => {
    form.value = data || {}
  })
}

async function handleApprove() {
  if (!canChangeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  const approverId = $store.user?.id || ''
  await approve(route.query.id, { approverId, comment: form.value.approvalComment || '同意' })
  $sdk.msgSuccess('审批通过')
  router.back()
}

async function handleReject() {
  if (!canChangeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  const approverId = $store.user?.id || ''
  await reject(route.query.id, { approverId, comment: form.value.approvalComment || '不同意' })
  $sdk.msgSuccess('已驳回')
  router.back()
}

async function handleSubmitApproval() {
  if (!canChangeUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  await submitApproval(route.query.id)
  $sdk.msgSuccess('提交审批成功')
  router.back()
}

function submit() {
  if ((isEdit.value && !canChangeUpdate.value) || (!isEdit.value && !canChangeAdd.value)) {
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
      <el-page-header @back="$router.back()" :title="isView ? '查看变更' : isEdit ? '编辑变更' : '新建变更'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <WorkflowApprovalPanel
        v-if="fromWorkflow && workflowTaskId"
        :task-id="workflowTaskId"
        :instance-id="workflowInstanceId"
        :node-name="form.currentNodeName"
        @approved="reloadCurrent"
      />
      <el-form-item label="变更标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入变更标题" maxlength="200" show-word-limit :disabled="isView" />
      </el-form-item>

      <el-form-item label="所属项目" prop="projectId">
        <ProjectSelect v-model="form.projectId" placeholder="请选择项目" :disabled="isView" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="变更类型">
            <el-select v-model="form.type" placeholder="类型" style="width: 100%" :disabled="isView">
              <el-option v-for="(v, k) in typeMap" :key="k" :label="v" :value="k" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="影响程度">
            <el-select v-model="form.impact" placeholder="影响" style="width: 100%" :disabled="isView">
              <el-option v-for="(v, k) in impactMap" :key="k" :label="v" :value="k" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="变更状态" v-if="isEdit.value || isView.value">
            <el-select v-model="form.status" placeholder="状态" style="width: 100%" :disabled="isView">
              <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="isEdit.value || isView.value">
          <el-form-item label="审批状态">
            <el-tag :type="form.approvalStatus === '2' ? 'success' : form.approvalStatus === '1' ? 'warning' : form.approvalStatus === '3' ? 'danger' : 'info'">
              {{ { '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已拒绝' }[form.approvalStatus] || '无需审批' }}
            </el-tag>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="当前审批节点" v-if="(isEdit.value || isView.value) && form.currentNodeName">
        <el-tag type="warning">{{ form.currentNodeName }}</el-tag>
      </el-form-item>

      <el-form-item label="变更原因">
        <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="请输入变更原因" :disabled="isView" />
      </el-form-item>

      <el-form-item label="变更描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入变更描述" :disabled="isView" />
      </el-form-item>

      <el-form-item label="影响分析">
        <el-input v-model="form.impactAnalysis" type="textarea" :rows="3" placeholder="请输入影响分析" :disabled="isView" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="成本影响">
            <el-input-number v-model="form.costImpact" :min="0" :disabled="isView" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="进度影响(天)">
            <el-input-number v-model="form.scheduleImpact" :min="0" :disabled="isView" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="申请人">
        <UserSelect v-model="form.requesterId" placeholder="请选择申请人" :disabled="isView" clearable />
      </el-form-item>

      <el-form-item label="审批人">
        <UserSelect v-model="form.approverId" placeholder="请选择审批人" :disabled="isView" clearable />
      </el-form-item>

      <el-form-item label="审批意见" v-if="isEdit.value || isView.value">
        <el-input v-model="form.approvalComment" type="textarea" :rows="2" :disabled="isView" />
      </el-form-item>

      <el-form-item label="排序">
        <el-input-number v-model="form.sort" :min="0" :disabled="isView" />
      </el-form-item>

      <el-form-item v-if="!isView">
        <el-button v-if="!isView && (isEdit ? canChangeUpdate : canChangeAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
        <el-button v-if="isEdit.value && canChangeUpdate && form.status === '1' && form.approvalStatus !== '1'" type="warning" @click="handleSubmitApproval">提交审批</el-button>
        <el-button v-if="isEdit.value && canChangeUpdate && form.status === '2'" type="success" @click="handleApprove">批准</el-button>
        <el-button v-if="isEdit.value && canChangeUpdate && form.status === '2'" type="danger" @click="handleReject">驳回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
