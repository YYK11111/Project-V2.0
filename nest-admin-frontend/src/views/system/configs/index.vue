<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue'
import { getList, save } from './api'
import { checkPermi } from '@/utils/permission'
const form = ref<any>({})
const rules = {}
const canConfigUpdate = computed(() => checkPermi(['system/configs/update']))
function getListFun() {
  getList().then(({ data: [data] }) => {
    form.value = data || {}
  })
}
getListFun()
function submit() {
  if (!canConfigUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  save(form.value).then(() => {
    $sdk.msgSuccess()
    getListFun()
  })
  // .finally(() => (loading.value = false))
}
</script>

<template>
  <div class="Gcard">
    <div class="GcardTitle">系统配置</div>
    <el-form ref="formRef" label-position="right" :model="form" :rules="rules" label-width="80px">
      <BaInput v-model="form.systemName" label="系统名称" prop="systemName"></BaInput>
      <el-form-item label="系统logo" prop="systemLogo">
        <upload class="" v-model:fileUrl="form.systemLogo" type="image"></upload>
        <div class="Gtip">仅支持大小 2M 以内， png/jpg/svg 等图片类型</div>
      </el-form-item>
      <el-form-item label="">
        <el-button v-if="canConfigUpdate" type="primary" @click="submit()">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped></style>
