<script setup>
import { getOne, save, update, getCustomerTypes, getCustomerLevels, getCustomerStatuses, submitApproval } from './api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
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

const isEdit = computed(() => !!route.query.id)
const workflowTaskId = computed(() => String(route.query.taskId || ''))
const workflowInstanceId = computed(() => String(route.query.instanceId || ''))
const fromWorkflow = computed(() => route.query.fromWorkflow === '1')
const canCustomerAdd = computed(() => checkPermi(['business/crm/customers/add']))
const canCustomerUpdate = computed(() => checkPermi(['business/crm/customers/update']))

if (isEdit.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = { ...data }
  })
}

function reloadCurrent() {
  if (!route.query.id) return
  getOne(route.query.id).then(({ data }) => {
    form.value = { ...data }
  })
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
  await submitApproval(route.query.id)
  $sdk.msgSuccess('提交审批成功')
  router.back()
}
</script>

<template>
  <div class="Gcard">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isEdit ? '编辑客户' : '新增客户'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" style="max-width: 1000px">
      <WorkflowApprovalPanel
        v-if="fromWorkflow && workflowTaskId"
        :task-id="workflowTaskId"
        :instance-id="workflowInstanceId"
        :node-name="form.currentNodeName"
        @approved="reloadCurrent"
      />
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入客户名称" maxlength="100" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户简称" prop="shortName">
            <el-input v-model="form.shortName" placeholder="请输入客户简称" maxlength="50" show-word-limit />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择客户类型" style="width: 100%">
              <el-option v-for="(value, key) of customerTypes" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="统一社会信用代码" prop="unifiedSocialCreditCode">
            <el-input v-model="form.unifiedSocialCreditCode" placeholder="请输入统一社会信用代码" maxlength="18" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属行业" prop="industry">
            <el-input v-model="form.industry" placeholder="请输入所属行业" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="企业规模" prop="scale">
            <el-input v-model="form.scale" placeholder="请输入企业规模" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="企业地址" prop="address">
        <el-input v-model="form.address" placeholder="请输入企业地址" maxlength="200" show-word-limit />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="form.contactPerson" placeholder="请输入联系人" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="form.contactPhone" placeholder="请输入联系电话" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系邮箱" prop="contactEmail">
            <el-input v-model="form.contactEmail" placeholder="请输入联系邮箱" maxlength="100" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="客户等级" prop="level">
            <el-select v-model="form.level" placeholder="请选择客户等级" style="width: 100%">
              <el-option v-for="(value, key) of customerLevels" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择客户状态" style="width: 100%">
              <el-option v-for="(value, key) of customerStatuses" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户价值(万元)" prop="customerValue">
            <el-input-number v-model="form.customerValue" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="审批状态" v-if="isEdit">
        <el-tag :type="form.approvalStatus === '2' ? 'success' : form.approvalStatus === '1' ? 'warning' : form.approvalStatus === '3' ? 'danger' : 'info'">
          {{ { '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已拒绝' }[form.approvalStatus] || '无需审批' }}
        </el-tag>
      </el-form-item>

      <el-form-item label="当前审批节点" v-if="isEdit && form.currentNodeName">
        <el-tag type="warning">{{ form.currentNodeName }}</el-tag>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="销售负责人" prop="salesId">
            <UserSelect v-model="form.salesId" placeholder="请选择销售负责人" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属部门" prop="deptId">
            <el-select v-model="form.deptId" placeholder="请选择所属部门" style="width: 100%">
              <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="客户描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入客户描述"
          maxlength="1000"
          show-word-limit />
      </el-form-item>

      <el-form-item>
        <el-button v-if="isEdit ? canCustomerUpdate : canCustomerAdd" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
        <el-button v-if="isEdit && canCustomerUpdate && form.status === '1' && form.approvalStatus !== '1'" type="warning" @click="handleSubmitApproval">提交审批</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
</style>
