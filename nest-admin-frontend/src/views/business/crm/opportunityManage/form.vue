<script setup>
import { watch } from 'vue'
import { getOne, save, update, getStages } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import UserSelect from '@/components/UserSelect.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'

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
  customerList.value = (res.list || []).map(c => ({...c, id: Number(c.id)}))
})

const isView = computed(() => route.query.action === 'view')
const hasOpportunityId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const isReadonly = computed(() => isView.value)
const canOpportunityAdd = computed(() => checkPermi(['business/crm/opportunities/add']))
const canOpportunityUpdate = computed(() => checkPermi(['business/crm/opportunities/update']))

const isOpportunityFormRoute = useCurrentRouteGuard(route, '/crm/opportunityManage/form')

const defaultForm = () => ({
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

async function loadOpportunity() {
  if (!isOpportunityFormRoute()) return
  if (!hasOpportunityId.value) {
    form.value = defaultForm()
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = { ...data }
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    if (!isOpportunityFormRoute()) return
    loadOpportunity()
  },
  { immediate: true },
)

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
  <div class="opportunity-form-page">
    <div class="Gcard opportunity-form-shell">
    <div class="opportunity-form-shell__top">
      <el-page-header @back="$router.back()" :title="isReadonly ? '销售机会详情' : isEdit ? '编辑销售机会' : '新增销售机会'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 900px">
      <div class="opportunity-sections">
      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">基本信息</div>
            <div class="section-desc">维护机会名称、客户、销售负责人和机会编号，先把销售机会主上下文建立完整。</div>
          </div>
        </div>

        <div class="opportunity-section-fields">
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
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">销售推进</div>
            <div class="section-desc">统一维护预期金额、销售阶段、成功概率和预计成交时间，方便判断机会成熟度。</div>
          </div>
        </div>

        <div class="opportunity-section-fields">
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
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">描述与失败原因</div>
            <div class="section-desc">补充机会背景、推进信息和失败原因，方便后续复盘与判断。</div>
          </div>
        </div>

        <div class="opportunity-section-fields">

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
        </div>
      </section>

      <el-form-item class="footer-actions">
        <el-button v-if="!isReadonly && (isEdit ? canOpportunityUpdate : canOpportunityAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
      </el-form-item>
      </div>
    </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.opportunity-form-page {
  min-height: 100%;
}

.opportunity-form-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.opportunity-form-page :deep(.el-row) {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.opportunity-form-shell__top {
  margin-bottom: 20px;
}

.opportunity-sections {
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

.opportunity-section-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.opportunity-form-page :deep(.el-form-item) {
  margin: 0 !important;
}

.opportunity-form-page :deep(.el-form-item__label) {
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
  .section-card {
    padding: 18px;
  }
}
</style>
