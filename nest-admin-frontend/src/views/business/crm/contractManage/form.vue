<script setup>
import { watch } from 'vue'
import { getOne, save, update, getContractStatuses } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import Upload from '@/components/Upload.vue'
import UserSelect from '@/components/UserSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import FormPageShell from '@/components/FormPageShell.vue'
import { checkPermi } from '@/utils/permission'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'

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
  customerList.value = (res.list || []).map(c => ({...c, id: Number(c.id)}))
})

const isView = computed(() => route.query.action === 'view')
const hasContractId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const isReadonly = computed(() => isView.value)
const canContractAdd = computed(() => checkPermi(['business/crm/contracts/add']))
const canContractUpdate = computed(() => checkPermi(['business/crm/contracts/update']))

const isContractFormRoute = useCurrentRouteGuard(route, '/crm/contractManage/form')

const defaultForm = () => ({
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

async function loadContract() {
  if (!isContractFormRoute()) return
  if (!hasContractId.value) {
    form.value = defaultForm()
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = { ...data }
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    if (!isContractFormRoute()) return
    loadContract()
  },
  { immediate: true },
)

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
  <FormPageShell class="business-form-page contract-form-page">
    <div class="Gcard business-form-shell contract-form-shell">
      <div>
        <el-page-header class="business-form-header" @back="$router.back()" :title="isReadonly ? '合同详情' : isEdit ? '编辑合同' : '新增合同'" />
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="business-form">
        <div class="business-form-sections">
          <section class="business-form-section">
            <div class="business-form-section__header">
              <div>
                <div class="business-form-section__title">基本信息</div>
                <div class="business-form-section__desc">维护合同名称、编号、客户和负责人，先把合同主信息建立完整。</div>
              </div>
            </div>

            <div class="business-form-fields">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="合同名称" prop="name">
                    <ViewField v-if="isReadonly" :value="form.name" />
                    <el-input v-else v-model="form.name" placeholder="请输入合同名称" maxlength="100" show-word-limit />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="合同编号" prop="code">
                    <ViewField v-if="isReadonly" :value="form.code" />
                    <el-input v-else v-model="form.code" placeholder="请输入合同编号" maxlength="50" />
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
                  <el-form-item label="合同负责人" prop="ownerId">
                    <ViewUser v-if="isReadonly" :user="form.owner" />
                    <UserSelect v-else v-model="form.ownerId" placeholder="请选择合同负责人" clearable />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </section>

          <section class="business-form-section">
            <div class="business-form-section__header">
              <div>
                <div class="business-form-section__title">金额与周期</div>
                <div class="business-form-section__desc">统一维护合同金额、回款金额和合同生效周期，便于后续回款与项目联动。</div>
              </div>
            </div>

            <div class="business-form-fields">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="合同金额(元)" prop="amount">
                    <ViewField v-if="isReadonly" :value="form.amount" />
                    <el-input-number v-else v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="已收款金额(元)" prop="receivedAmount">
                    <ViewField v-if="isReadonly" :value="form.receivedAmount" />
                    <el-input-number v-else v-model="form.receivedAmount" :min="0" :precision="2" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="签订时间" prop="signingDate">
                    <ViewField v-if="isReadonly" :value="form.signingDate" />
                    <el-date-picker
                      v-else
                      v-model="form.signingDate"
                      type="date"
                      placeholder="选择签订时间"
                      value-format="YYYY-MM-DD"
                      style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
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
                <el-col :span="8">
                  <el-form-item label="结束时间" prop="endDate">
                    <ViewField v-if="isReadonly" :value="form.endDate" />
                    <el-date-picker
                      v-else
                      v-model="form.endDate"
                      type="date"
                      placeholder="选择结束时间"
                      value-format="YYYY-MM-DD"
                      style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </section>

          <section class="business-form-section">
            <div class="business-form-section__header">
              <div>
                <div class="business-form-section__title">状态与关联</div>
                <div class="business-form-section__desc">统一查看合同状态和关联项目，便于后续项目落地与执行跟踪。</div>
              </div>
            </div>

            <div class="business-form-fields">
              <el-form-item label="合同状态" prop="status">
                <ViewTagField v-if="isReadonly" :text="contractStatuses[form.status]" :type="form.status === '1' ? 'success' : form.status === '2' ? 'warning' : form.status === '3' ? 'danger' : 'info'" />
                <el-select v-else v-model="form.status" placeholder="请选择合同状态" style="width: 300px">
                  <el-option v-for="(value, key) of contractStatuses" :key="key" :label="value" :value="key" />
                </el-select>
              </el-form-item>

              <el-form-item label="关联项目">
                <ViewEntity v-if="form.project" :title="form.project?.name" :subtitle="form.project?.code" />
                <ViewField v-else value="-" />
              </el-form-item>
            </div>
          </section>

          <section class="business-form-section">
            <div class="business-form-section__header">
              <div>
                <div class="business-form-section__title">合同文件与备注</div>
                <div class="business-form-section__desc">统一管理合同文件与补充备注，保持文件上传体验和其它表单一致。</div>
              </div>
            </div>

            <div class="business-form-fields business-form-fields--content">
              <el-form-item label="合同文件" prop="contractFile">
                <template v-if="isReadonly">
                  <ViewFileList v-if="form.contractFile" :files="[{ name: '合同文件', url: form.contractFile }]" />
                  <ViewField v-else value="" />
                </template>
                <Upload v-else v-model:fileUrl="form.contractFile" v-model:fileName="form.code" type="file" :limit="1" />
              </el-form-item>

              <el-form-item label="备注" prop="remark">
                <ViewField v-if="isReadonly" :value="form.remark" />
                <el-input
                  v-else
                  v-model="form.remark"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入备注"
                  maxlength="1000"
                  show-word-limit />
              </el-form-item>
            </div>
          </section>

        </div>
      </el-form>
    </div>
    <template #footer>
      <el-button v-if="!isReadonly && (isEdit ? canContractUpdate : canContractAdd)" type="primary" @click="submit">提交</el-button>
      <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
    </template>
  </FormPageShell>
</template>

<style lang="scss" scoped>
.business-form-page :deep(.el-form-item__label) {
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

@media (max-width: 768px) {
}
</style>
