<script setup>
import { watch } from 'vue'
import { getOne, save, update, getCustomerTypes, getCustomerLevels, getCustomerStatuses, submitApproval } from './api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import { ElMessageBox } from 'element-plus'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  name: '',
  shortName: '',
  code: '',
  type: '1',
  unifiedSocialCreditCode: '',
  industry: '',
  scale: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  level: '2',
  status: '1',
  salesId: '',
  deptId: '',
  description: '',
  customerValue: null,
})

const rules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
}

const customerTypes = ref({})
getCustomerTypes().then(({ data }) => (customerTypes.value = data))

const customerLevels = ref({})
getCustomerLevels().then(({ data }) => (customerLevels.value = data))

const customerStatuses = ref({})
getCustomerStatuses().then(({ data }) => (customerStatuses.value = data))

// 获取部门树
const deptList = ref([])
getDeptTrees().then((res) => {
  // 将树形结构展平为列表
  const flattenDepts = (depts, result = []) => {
    depts.forEach(dept => {
      result.push(dept)
      if (dept.children && dept.children.length > 0) {
        flattenDepts(dept.children, result)
      }
    })
    return result
  }
  deptList.value = res.data ? flattenDepts(res.data) : []
})

const isView = computed(() => route.query.action === 'view')
const hasCustomerId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const isWorkflowReadonly = computed(() => fromWorkflow.value && !!workflowTaskId.value)
const isReadonly = computed(() => isView.value || isWorkflowReadonly.value)
const canCustomerAdd = computed(() => checkPermi(['business/crm/customers/add']))
const canCustomerUpdate = computed(() => checkPermi(['business/crm/customers/update']))
const canSubmitCurrentApproval = computed(() => form.value.status === '1' && !['1', '2'].includes(String(form.value.approvalStatus || '0')))
const canCloseReturnedInstance = computed(() => form.value.workflowInstanceId && form.value.approvalStatus === '3' && String(form.value.currentNodeName || '').includes('退回发起人'))
const workflowPanelRef = ref()
const deptMap = computed(() => Object.fromEntries((deptList.value || []).map(dept => [String(dept.id), dept.name])))

const defaultForm = () => ({
  name: '',
  shortName: '',
  code: '',
  type: '1',
  unifiedSocialCreditCode: '',
  industry: '',
  scale: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  level: '2',
  status: '1',
  salesId: '',
  deptId: '',
  description: '',
  customerValue: null,
})

async function loadCustomer() {
  if (!hasCustomerId.value) {
    form.value = defaultForm()
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = { ...data }
}

watch(
  () => [route.query.id, route.query.action, route.query.taskId, route.query.instanceId, route.query.fromWorkflow],
  () => {
    loadCustomer()
  },
  { immediate: true },
)

function reloadCurrent() {
  loadCustomer()
}

function submit() {
  if ((isEdit.value && !canCustomerUpdate.value) || (!isEdit.value && !canCustomerAdd.value)) {
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

async function handleSubmitApproval() {
  if (!canCustomerUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  if (canCloseReturnedInstance.value) {
    await resubmitReturnedWorkflowInstance(form.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    $sdk.msgSuccess('重新提交审批成功')
    reloadCurrent()
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
  router.push({ path: '/crm/customerManage/form', query: { id: route.query.id } })
}

function scrollToWorkflowPanel() {
  workflowPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="Gcard">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isReadonly ? '客户详情' : isEdit ? '编辑客户' : '新增客户'">
        <template #extra>
          <el-button v-if="fromWorkflow && workflowTaskId" @click="scrollToWorkflowPanel">跳转审批区</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </template>
      </el-page-header>
    </div>

    <el-alert
      v-if="route.query.id && form.approvalStatus === '3'"
      :title="String(form.currentNodeName || '').includes('退回发起人') ? '该客户审批已退回发起人，可修改后重新提交，或直接结束退回实例。' : '该客户审批已驳回，请根据意见调整后重新提交。'"
      type="warning"
      :closable="false"
      show-icon
      class="mb-16"
    >
      <template #default>
        <div class="top-alert-actions">
          <el-button v-if="isView" type="primary" size="small" @click="goToEdit">去编辑</el-button>
          <el-button v-if="isEdit && canCustomerUpdate && canSubmitCurrentApproval" type="warning" size="small" @click="handleSubmitApproval">重新提交审批</el-button>
          <el-button v-if="canCloseReturnedInstance" type="danger" size="small" @click="handleCloseReturnedInstance">结束退回实例</el-button>
        </div>
      </template>
    </el-alert>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" style="max-width: 1000px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户名称" prop="name">
            <ViewField v-if="isReadonly" :value="form.name" />
            <el-input v-else v-model="form.name" placeholder="请输入客户名称" maxlength="100" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户简称" prop="shortName">
            <ViewField v-if="isReadonly" :value="form.shortName" />
            <el-input v-else v-model="form.shortName" placeholder="请输入客户简称" maxlength="50" show-word-limit />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户类型" prop="type">
            <ViewField v-if="isReadonly" :value="customerTypes[form.type]" />
            <el-select v-else v-model="form.type" placeholder="请选择客户类型" style="width: 100%">
              <el-option v-for="(value, key) of customerTypes" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="统一社会信用代码" prop="unifiedSocialCreditCode">
            <ViewField v-if="isReadonly" :value="form.unifiedSocialCreditCode" />
            <el-input v-else v-model="form.unifiedSocialCreditCode" placeholder="请输入统一社会信用代码" maxlength="18" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属行业" prop="industry">
            <ViewField v-if="isReadonly" :value="form.industry" />
            <el-input v-else v-model="form.industry" placeholder="请输入所属行业" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="企业规模" prop="scale">
            <ViewField v-if="isReadonly" :value="form.scale" />
            <el-input v-else v-model="form.scale" placeholder="请输入企业规模" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="企业地址" prop="address">
        <ViewField v-if="isReadonly" :value="form.address" />
        <el-input v-else v-model="form.address" placeholder="请输入企业地址" maxlength="200" show-word-limit />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="联系人" prop="contactPerson">
            <ViewField v-if="isReadonly" :value="form.contactPerson" />
            <el-input v-else v-model="form.contactPerson" placeholder="请输入联系人" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系电话" prop="contactPhone">
            <ViewField v-if="isReadonly" :value="form.contactPhone" />
            <el-input v-else v-model="form.contactPhone" placeholder="请输入联系电话" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系邮箱" prop="contactEmail">
            <ViewField v-if="isReadonly" :value="form.contactEmail" />
            <el-input v-else v-model="form.contactEmail" placeholder="请输入联系邮箱" maxlength="100" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="客户等级" prop="level">
            <ViewField v-if="isReadonly" :value="customerLevels[form.level]" />
            <el-select v-else v-model="form.level" placeholder="请选择客户等级" style="width: 100%">
              <el-option v-for="(value, key) of customerLevels" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户状态" prop="status">
            <ViewTagField v-if="isReadonly" :text="customerStatuses[form.status]" :type="form.status === '3' ? 'success' : form.status === '2' ? 'warning' : form.status === '4' ? 'info' : 'primary'" />
            <el-select v-else v-model="form.status" placeholder="请选择客户状态" style="width: 100%">
              <el-option v-for="(value, key) of customerStatuses" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户价值(万元)" prop="customerValue">
            <ViewField v-if="isReadonly" :value="form.customerValue" />
            <el-input-number v-else v-model="form.customerValue" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="审批状态" v-if="isEdit">
        <ViewTagField :text="{ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }[form.approvalStatus] || '无需审批'" :type="form.approvalStatus === '2' ? 'success' : form.approvalStatus === '1' ? 'warning' : form.approvalStatus === '3' ? 'danger' : 'info'" />
      </el-form-item>

      <el-form-item label="当前审批节点" v-if="isEdit && form.currentNodeName">
        <el-tag type="warning">{{ form.currentNodeName }}</el-tag>
      </el-form-item>

      <el-alert
        v-if="isEdit && form.approvalStatus === '2'"
        title="该客户审批已通过，当前业务状态应转为意向客户。"
        type="success"
        :closable="false"
        show-icon
        class="mb-16"
      />
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="销售负责人" prop="salesId">
            <ViewUser v-if="isReadonly" :user="form.sales" />
            <UserSelect v-else v-model="form.salesId" placeholder="请选择销售负责人" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属部门" prop="deptId">
            <ViewField v-if="isReadonly" :value="deptMap[form.deptId]" />
            <el-select v-else v-model="form.deptId" placeholder="请选择所属部门" style="width: 100%">
              <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="客户描述" prop="description">
        <ViewField v-if="isReadonly" :value="form.description" />
        <el-input
          v-else
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入客户描述"
          maxlength="1000"
          show-word-limit />
      </el-form-item>

      <el-form-item>
        <el-button v-if="!isReadonly && (isEdit ? canCustomerUpdate : canCustomerAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
        <el-button v-if="!isReadonly && isEdit && canCustomerUpdate && canSubmitCurrentApproval" type="warning" @click="handleSubmitApproval">提交审批</el-button>
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
  </div>
</template>

<style lang="scss" scoped>
.workflow-panel-section {
  margin-top: 20px;
  max-width: 1000px;
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
</style>
