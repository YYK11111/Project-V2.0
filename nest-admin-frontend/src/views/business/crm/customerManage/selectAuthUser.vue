<template>
  <BaDialog ref="dialogRef" dynamicTitle="新增授权" width="960" @confirm="handleSelectUser">
    <template #form>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="customer-auth-select-form">
        <el-form-item label="授权类型" prop="grantType">
          <el-radio-group v-model="form.grantType">
            <el-radio value="permanent">永久授权</el-radio>
            <el-radio value="temporary">临时授权</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="form.grantType === 'temporary'">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择开始时间" />
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择结束时间" />
          </el-form-item>
        </template>
        <el-form-item label="允许编辑">
          <el-switch v-model="form.canEdit" />
        </el-form-item>
        <el-form-item label="授权原因">
          <el-input v-model="form.grantReason" type="textarea" :rows="2" placeholder="请输入本次授权原因" />
        </el-form-item>
      </el-form>

      <RequestChartTable ref="rctRef" :request="getList" :is-create-request="false" data-key="id">
        <template #query="{ query }">
          <BaInput v-model="query.userName" label="用户账号" prop="userName"></BaInput>
        </template>

        <template #table>
          <el-table-column type="selection" width="50" />
          <el-table-column label="用户账号" prop="name" min-width="140" />
          <el-table-column label="用户昵称" prop="nickname" min-width="140" />
          <el-table-column label="部门" prop="dept.name" min-width="140" />
          <el-table-column label="邮箱" prop="email" min-width="180" />
          <el-table-column label="手机" prop="phone" min-width="140" />
        </template>
      </RequestChartTable>
    </template>
  </BaDialog>
</template>

<script setup lang="ts" name="CustomerSelectAuthUser">
// @ts-nocheck
import { getUnallocatedViewerList, grantCustomerViewers } from './api'

const props = defineProps({
  customerId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['ok'])
const dialogRef = ref<any>(null)
const rctRef = ref<any>(null)
const formRef = ref<any>(null)

const defaultForm = () => ({
  grantType: 'permanent',
  startTime: '',
  endTime: '',
  canEdit: false,
  grantReason: '',
})

const form = ref(defaultForm())

const rules = {
  grantType: [{ required: true, message: '请选择授权类型', trigger: 'change' }],
  startTime: [
    {
      validator: (_rule, value, callback) => {
        if (form.value.grantType === 'temporary' && !value) return callback(new Error('请选择开始时间'))
        callback()
      },
      trigger: 'change',
    },
  ],
  endTime: [
    {
      validator: (_rule, value, callback) => {
        if (form.value.grantType === 'temporary' && !value) return callback(new Error('请选择结束时间'))
        callback()
      },
      trigger: 'change',
    },
  ],
}

function getList(query: any) {
  return getUnallocatedViewerList(String(props.customerId), query)
}

function show() {
  form.value = defaultForm()
  dialogRef.value.visible = true
  nextTick(() => {
    rctRef.value?.getList?.(1)
  })
}

async function handleSelectUser({ loading }: any) {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    loading.value = false
    return
  }

  const selectedIds = rctRef.value?.selectedIds || []
  if (!selectedIds.length) {
    ElMessage.error('请选择要授权的用户')
    loading.value = false
    return
  }

  grantCustomerViewers(String(props.customerId), {
    userIds: selectedIds,
    grantType: form.value.grantType,
    startTime: form.value.grantType === 'temporary' ? form.value.startTime : undefined,
    endTime: form.value.grantType === 'temporary' ? form.value.endTime : undefined,
    canEdit: form.value.canEdit ? '1' : '0',
    grantReason: form.value.grantReason || undefined,
  })
    .then(() => {
      $sdk.msgSuccess('授权成功')
      dialogRef.value.visible = false
      emit('ok')
    })
    .finally(() => {
      loading.value = false
    })
}

defineExpose({
  show,
})
</script>

<style scoped lang="scss">
.customer-auth-select-form {
  margin-bottom: 16px;
}

.customer-auth-select-form :deep(.el-date-editor) {
  width: 100%;
}
</style>
