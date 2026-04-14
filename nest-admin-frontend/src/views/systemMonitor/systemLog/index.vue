<script setup lang="ts">
// @ts-nocheck
import { getOne, del } from './api'

const detail = ref('')
function getOnefn() {
  getOne().then(({ data }) => {
    detail.value = data
  })
}
getOnefn()
</script>

<template>
  <div class="whitespace-pre-wrap">
    {{ detail }}
    <div class="GfooterSticky">
      <el-button @click="del().then(() => $sdk.msgSuccess('删除成功'), getOnefn())">删除</el-button>
    </div>
  </div>
</template>

<style lang="css" scoped></style>
