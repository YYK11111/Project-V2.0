<script setup>
import { ref, computed, watch } from 'vue'
import { grantCustomerViewAccess, revokeCustomerViewAccess, getCustomerAuthUsers } from '../api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  customer: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref()
const submitting = ref(false)

const form = ref({
  userIds: [],
  grantType: 'permanent',
  startTime: '',
  endTime: '',
  canEdit: false,
  grantReason: ''
})

const originalUserIds = ref([])
const isTemporary = computed(() => form.value.grantType === 'temporary')

const rules = {
  userIds: [{ required: true, message: '请选择可查看人员', trigger: 'change' }]
}

watch(visible, async (val) => {
  if (val && props.customer?.id) {
    form.value = {
      userIds: [],
      grantType: 'permanent',
      startTime: '',
      endTime: '',
      canEdit: false,
      grantReason: ''
    }
    const res = await getCustomerAuthUsers(props.customer.id)
    const list = res?.data?.data || res?.data || []
    form.value.userIds = (Array.isArray(list) ? list : []).map((item) => item.userId).filter(Boolean)
    originalUserIds.value = [...form.value.userIds]
  }
})

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || submitting.value) return

  submitting.value = true
  try {
    const nextUserIds = form.value.userIds.filter(Boolean)
    const removedUserIds = originalUserIds.value.filter((userId) => !nextUserIds.includes(userId))

    if (nextUserIds.length) {
      await grantCustomerViewAccess({
        customerId: props.customer.id,
        userIds: nextUserIds,
        grantType: form.value.grantType,
        startTime: isTemporary.value ? form.value.startTime : undefined,
        endTime: isTemporary.value ? form.value.endTime : undefined,
        canEdit: form.value.canEdit ? '1' : '0',
        grantReason: form.value.grantReason || undefined
      })
    }

    for (const userId of removedUserIds) {
      await revokeCustomerViewAccess({
        customerId: props.customer.id,
        userId,
        reason: form.value.grantReason || undefined
      })
    }

    $sdk.msgSuccess('授权成功')
    emit('success')
    visible.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="授权查看客户" width="720px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="客户">
        <strong>{{ customer?.name || '-' }}</strong>
      </el-form-item>

      <el-form-item label="可查看人员" prop="userIds">
        <UserSelect v-model="form.userIds" multiple filter-dept placeholder="请选择可查看人员" />
      </el-form-item>

      <el-form-item label="授权类型" prop="grantType">
        <el-radio-group v-model="form.grantType">
          <el-radio value="permanent">永久授权</el-radio>
          <el-radio value="temporary">临时授权</el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="isTemporary">
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </template>

      <el-form-item label="允许编辑">
        <el-checkbox v-model="form.canEdit" :true-value="true" :false-value="false" />
      </el-form-item>

      <el-form-item label="授权原因">
        <el-input v-model="form.grantReason" type="textarea" :rows="3" placeholder="请输入授权原因" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确认授权</el-button>
    </template>
  </el-dialog>
</template>