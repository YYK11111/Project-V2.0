<script setup>
import { getOne, save, update, getContractStatuses } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import UserSelect from '@/components/UserSelect.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const form = ref({
  name: '',
  code: '',
  customerId: '',
  opportunityId: null,
  projectId: null,
  amount: null,
  receivedAmount: null,
  signingDate: '',
  startDate: '',
  endDate: '',
  status: '1',
  ownerId: '',
  contractFile: '',
  remark: '',
})

const rules = {
  name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  ownerId: [{ required: true, message: '请选择合同负责人', trigger: 'change' }],
  amount: [{ required: true, message: '请输入合同金额', trigger: 'blur' }],
}

const contractStatuses = ref({})
getContractStatuses().then(({ data }) => (contractStatuses.value = data))

// 获取客户列表
const customerList = ref([])
getCustomerList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  customerList.value = res.list || []
})

const isEdit = computed(() => !!route.query.id)
const canContractAdd = computed(() => checkPermi(['business/crm/contracts/add']))
const canContractUpdate = computed(() => checkPermi(['business/crm/contracts/update']))

if (isEdit.value) {
  getOne(route.query.id).then(({ data }) => {
    form.value = { ...data }
  })
}

function submit() {
  if ((isEdit.value && !canContractUpdate.value) || (!isEdit.value && !canContractAdd.value)) {
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
      <el-page-header @back="$router.back()" :title="isEdit ? '编辑合同' : '新增合同'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 900px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合同名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入合同名称" maxlength="100" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同编号" prop="code">
            <el-input v-model="form.code" placeholder="请输入合同编号" maxlength="50" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户" prop="customerId">
            <el-select v-model="form.customerId" placeholder="请选择客户" filterable style="width: 100%">
              <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同负责人" prop="ownerId">
            <UserSelect v-model="form.ownerId" placeholder="请选择合同负责人" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合同金额(元)" prop="amount">
            <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="已收款金额(元)" prop="receivedAmount">
            <el-input-number v-model="form.receivedAmount" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="签订时间" prop="signingDate">
            <el-date-picker
              v-model="form.signingDate"
              type="date"
              placeholder="选择签订时间"
              value-format="YYYY-MM-DD"
              style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="开始时间" prop="startDate">
            <el-date-picker
              v-model="form.startDate"
              type="date"
              placeholder="选择开始时间"
              value-format="YYYY-MM-DD"
              style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="结束时间" prop="endDate">
            <el-date-picker
              v-model="form.endDate"
              type="date"
              placeholder="选择结束时间"
              value-format="YYYY-MM-DD"
              style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="合同状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择合同状态" style="width: 300px">
          <el-option v-for="(value, key) of contractStatuses" :key="key" :label="value" :value="key" />
        </el-select>
      </el-form-item>

      <el-form-item label="合同文件" prop="contractFile">
        <el-input v-model="form.contractFile" placeholder="请输入合同文件路径或上传合同文件" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          placeholder="请输入备注"
          maxlength="1000"
          show-word-limit />
      </el-form-item>

      <el-form-item>
        <el-button v-if="isEdit ? canContractUpdate : canContractAdd" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
</style>
