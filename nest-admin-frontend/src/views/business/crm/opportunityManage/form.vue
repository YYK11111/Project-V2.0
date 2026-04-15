<script setup>
import { getOne, save, update, getStages } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import UserSelect from '@/components/UserSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  name: '',
  code: '',
  customerId: '',
  expectedAmount: null,
  stage: '1',
  successRate: 0,
  expectedCloseDate: '',
  actualCloseDate: '',
  salesId: '',
  description: '',
  lossReason: '',
  projectId: null,
})

const rules = {
  name: [{ required: true, message: '请输入机会名称', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  salesId: [{ required: true, message: '请选择销售负责人', trigger: 'change' }],
}

const stages = ref({})
getStages().then(({ data }) => (stages.value = data))

// 获取客户列表
const customerList = ref([])
getCustomerList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  customerList.value = res.list || []
})

const isView = computed(() => route.query.action === 'view')
const hasOpportunityId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const isReadonly = computed(() => isView.value)
const canOpportunityAdd = computed(() => checkPermi(['business/crm/opportunities/add']))
const canOpportunityUpdate = computed(() => checkPermi(['business/crm/opportunities/update']))

if (hasOpportunityId.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = { ...data }
  })
}

function submit() {
  if ((isEdit.value && !canOpportunityUpdate.value) || (!isEdit.value && !canOpportunityAdd.value)) {
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
      <el-page-header @back="$router.back()" :title="isReadonly ? '查看销售机会' : isEdit ? '编辑销售机会' : '新增销售机会'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 900px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="机会名称" prop="name">
            <ViewField v-if="isReadonly" :value="form.name" />
            <el-input v-else v-model="form.name" placeholder="请输入机会名称" maxlength="100" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机会编号" prop="code">
            <ViewField v-if="isReadonly" :value="form.code" />
            <el-input v-else v-model="form.code" placeholder="请输入机会编号" maxlength="50" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户" prop="customerId">
            <ViewEntity v-if="isReadonly" :title="form.customer?.name" :subtitle="form.customer?.code" />
            <el-select v-else v-model="form.customerId" placeholder="请选择客户" filterable style="width: 100%">
              <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="销售负责人" prop="salesId">
            <ViewUser v-if="isReadonly" :user="form.sales" />
            <UserSelect v-else v-model="form.salesId" placeholder="请选择销售负责人" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="预期金额(元)" prop="expectedAmount">
            <ViewField v-if="isReadonly" :value="form.expectedAmount" />
            <el-input-number v-else v-model="form.expectedAmount" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="销售阶段" prop="stage">
            <ViewTagField v-if="isReadonly" :text="stages[form.stage]" :type="form.stage === '5' ? 'success' : form.stage === '4' ? 'warning' : 'primary'" />
            <el-select v-else v-model="form.stage" placeholder="请选择销售阶段" style="width: 100%">
              <el-option v-for="(value, key) of stages" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="成功概率(%)" prop="successRate">
            <ViewField v-if="isReadonly" :value="form.successRate" />
            <el-slider v-else v-model="form.successRate" :min="0" :max="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计成交时间" prop="expectedCloseDate">
            <ViewField v-if="isReadonly" :value="form.expectedCloseDate" />
            <el-date-picker
              v-else
              v-model="form.expectedCloseDate"
              type="date"
              placeholder="选择预计成交时间"
              value-format="YYYY-MM-DD"
              style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="机会描述" prop="description">
        <ViewField v-if="isReadonly" :value="form.description" />
        <el-input
          v-else
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入机会描述"
          maxlength="1000"
          show-word-limit />
      </el-form-item>

      <el-form-item label="失败原因" prop="lossReason">
        <ViewField v-if="isReadonly" :value="form.lossReason" />
        <el-input
          v-else
          v-model="form.lossReason"
          type="textarea"
          :rows="3"
          placeholder="请输入失败原因（仅在机会失败时填写）"
          maxlength="500"
          show-word-limit />
      </el-form-item>

      <el-form-item>
        <el-button v-if="!isReadonly && (isEdit ? canOpportunityUpdate : canOpportunityAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
</style>
