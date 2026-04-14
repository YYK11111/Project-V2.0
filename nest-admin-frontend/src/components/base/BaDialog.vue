<!-- <BaDialog ref="BaseDialogRef" title="重命名" width="500" @confirm="allocateCustomerFn">
  <template #form="{ form }">
    <RemoteSelect
      :request="getUserList"
      class="flex-none w-[100%]"
      v-model="form.userId"
      label="顾问选择"
      :defaultProps="{ id: 'userId', name: 'realName' }"></RemoteSelect>
  </template>
</BaDialog> -->
<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue'
const $emit = defineEmits(['confirm', 'cancel'])
const props = defineProps({
  dynamicTitle: { type: String, default: '' },
  rules: { type: Object, default: () => ({}) },
  idKey: { type: String, default: 'id' },
})

const visible = ref(false)
const loading = ref(false)
const form = ref({})
const formRef = ref()
const attrs = useAttrs()
const formProps = computed(() => attrs)
watch(
  () => visible.value,
  (val) => {
    val || (loading.value = val)
  },
)

function action(data = {}, callback: () => {}) {
  visible.value = true
  form.value = JSON.parse(JSON.stringify(data))
  callback?.()
}

function submit() {
  formRef.value.validate().then(() => {
    loading.value = true
    $emit('confirm', { form, visible, loading })
  })
}
function confirm(add, callback, update, idKey = 'id') {
  loading.value = true
  ;(form.value[idKey] ? update || add : add)(form.value)
    .then(() => {
      callback?.()
      $sdk.msgSuccess()
      visible.value = false
    })
    .finally(() => (loading.value = false))
}

defineExpose({
  visible,
  form,
  action,
  confirm,
})
</script>

<template>
  <el-dialog
    class="BaDialog"
    :title="dynamicTitle && (form[props.idKey] ? '编辑' : '新增') + dynamicTitle"
    v-model="visible"
    align-center
    draggable
    :close-on-click-modal="false"
    destroy-on-close
    v-bind="$attrs">
    <div v-loading="loading">
      <slot></slot>

      <el-form
        v-if="$slots.form"
        ref="formRef"
        class="dialogForm"
        label-width="80px"
        v-bind="formProps"
        :model="form"
        :rules="rules">
        <slot name="form" v-bind="{ form }"></slot>
      </el-form>
    </div>

    <template #footer>
      <slot name="footer">
        <el-button @click="($emit('cancel'), (visible = false))">取消</el-button>
        <el-button type="primary" :disabled="loading" v-loading="loading" @click="submit">确定</el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>
