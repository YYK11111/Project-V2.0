<script setup>
import { watch } from 'vue'
import { getOne, save, update, getInteractionTypes } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import { useUserStore } from '@/stores/user'
import Upload from '@/components/Upload.vue'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewFileList from '@/components/view/ViewFileList.vue'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const form = ref({
  customerId: '',
  interactionType: '1',
  content: '',
  interactionTime: '',
  operatorId: userStore.id,
  operatorName: userStore.nickname || userStore.name,
  nextFollowTime: '',
  attachments: [],
})

const rules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  content: [{ required: true, message: '请输入互动内容', trigger: 'blur' }],
  interactionTime: [{ required: true, message: '请选择互动时间', trigger: 'change' }],
}

const interactionTypes = ref({})
getInteractionTypes().then(({ data }) => (interactionTypes.value = data))

// 获取客户列表
const customerList = ref([])
getCustomerList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  customerList.value = res.list || []
})

const isView = computed(() => route.query.action === 'view')
const hasInteractionId = computed(() => !!route.query.id)
const isEdit = computed(() => !!route.query.id && !isView.value)
const isReadonly = computed(() => isView.value)
const canInteractionAdd = computed(() => checkPermi(['business/crm/interactions/add']))
const canInteractionUpdate = computed(() => checkPermi(['business/crm/interactions/update']))

const defaultForm = () => ({
  customerId: '',
  interactionType: '1',
  content: '',
  interactionTime: '',
  operatorId: userStore.id,
  operatorName: userStore.nickname || userStore.name,
  nextFollowTime: '',
  attachments: [],
})

async function loadInteraction() {
  if (!hasInteractionId.value) {
    form.value = defaultForm()
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = { ...data }
}

watch(
  () => [route.query.id, route.query.action],
  () => {
    loadInteraction()
  },
  { immediate: true },
)

function submit() {
  if ((isEdit.value && !canInteractionUpdate.value) || (!isEdit.value && !canInteractionAdd.value)) {
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
  <div class="interaction-form-page">
    <div class="Gcard interaction-form-shell">
    <div class="interaction-form-shell__top">
      <el-page-header @back="$router.back()" :title="isReadonly ? '互动记录详情' : isEdit ? '编辑互动记录' : '新增互动记录'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
      <div class="interaction-sections">
      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">基本信息</div>
            <div class="section-desc">维护客户、互动类型和互动时间，先把跟进上下文建立完整。</div>
          </div>
        </div>

        <div class="interaction-section-fields">
      <el-form-item label="客户" prop="customerId">
        <ViewEntity v-if="isReadonly" :title="form.customer?.name" :subtitle="form.customer?.code" />
        <el-select v-else v-model="form.customerId" placeholder="请选择客户" filterable style="width: 100%">
          <el-option v-for="customer in customerList" :key="customer.id" :label="customer.name" :value="customer.id" />
        </el-select>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="互动类型" prop="interactionType">
            <ViewField v-if="isReadonly" :value="interactionTypes[form.interactionType]" />
            <el-select v-else v-model="form.interactionType" placeholder="请选择互动类型" style="width: 100%">
              <el-option v-for="(value, key) of interactionTypes" :key="key" :label="value" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="互动时间" prop="interactionTime">
            <ViewField v-if="isReadonly" :value="form.interactionTime" />
            <el-date-picker
              v-else
              v-model="form.interactionTime"
              type="datetime"
              placeholder="选择互动时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
        </div>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">跟进内容</div>
            <div class="section-desc">记录本次客户沟通、拜访或会议的关键信息，便于后续持续跟进。</div>
          </div>
        </div>

        <el-form-item label="互动内容" prop="content">
          <ViewField v-if="isReadonly" :value="form.content" />
          <el-input
            v-else
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入互动内容"
            maxlength="2000"
            show-word-limit />
        </el-form-item>
      </section>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">跟进安排与附件</div>
            <div class="section-desc">统一维护互动人、下次跟进时间和相关附件材料，便于形成连续跟进记录。</div>
          </div>
        </div>

        <div class="interaction-section-fields">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="互动人" prop="operatorName">
              <ViewField v-if="isReadonly" :value="form.operatorName" />
              <el-input v-else v-model="form.operatorName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下次跟进时间" prop="nextFollowTime">
              <ViewField v-if="isReadonly" :value="form.nextFollowTime" />
              <el-date-picker
                v-else
                v-model="form.nextFollowTime"
                type="datetime"
                placeholder="选择下次跟进时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="互动附件">
          <ViewFileList v-if="isReadonly" :files="form.attachments || []" />
          <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
        </el-form-item>
        </div>
      </section>

      <el-form-item class="footer-actions">
        <el-button v-if="!isReadonly && (isEdit ? canInteractionUpdate : canInteractionAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
      </el-form-item>
      </div>
    </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.interaction-form-page {
  min-height: 100%;
}

.interaction-form-shell__top {
  margin-bottom: 20px;
}

.interaction-sections {
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

.interaction-section-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.interaction-form-page :deep(.el-form-item) {
  margin: 0 !important;
}

.interaction-form-page :deep(.el-form-item__label) {
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
