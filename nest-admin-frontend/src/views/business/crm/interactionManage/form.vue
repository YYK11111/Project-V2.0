<script setup>
import { watch } from 'vue'
import { getOne, save, update, getInteractionTypes } from './api'
import { getList as getCustomerList } from '../customerManage/api'
import { useUserStore } from '@/stores/user'
import ViewEntity from '@/components/view/ViewEntity.vue'
import ViewField from '@/components/view/ViewField.vue'
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
  <div class="Gcard">
    <div class="mb20">
      <el-page-header @back="$router.back()" :title="isReadonly ? '互动记录详情' : isEdit ? '编辑互动记录' : '新增互动记录'" />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
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

      <el-form-item>
        <el-button v-if="!isReadonly && (isEdit ? canInteractionUpdate : canInteractionAdd)" type="primary" @click="submit">提交</el-button>
        <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
</style>
