<script setup lang="ts">
// @ts-nocheck
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
const route = useRoute()
import { yesOrNO, KEY_NO, KEY_YES } from '@/utils/dictionary'

import { getOne, save, getStatus } from './api'
const form = ref({ content: '' })
const formRef = ref()
const isEdited = ref(false)
const status = ref([])
getStatus().then(({ data }) => (status.value = data))

import { getTrees } from './api.catalog'
import { watch } from 'vue'
const trees = ref([])
getTrees().then(({ data }) => (trees.value = data))

if (route.query.id) {
  getOne(route.query.id).then(({ data }) => {
    form.value = data
    watch(form, (val) => ((isEdited.value = true), console.log(1)), { once: true, deep: true })
  })
}

function submit(type) {
  formRef.value.$refs.formRef.validate().then(() => {
    let _form = JSON.parse(JSON.stringify(form.value))
    type == 'draft' && (_form.status = '0')

    if (_form.publishTime && +new Date(_form.publishTime) <= +new Date()) {
      $sdk.msgError('定时发布时间不得早于当前时间')
      return
    }

    save(_form).then(() => {
      $sdk.msgSuccess()
      router.back()
    })
  })
}

function cancel() {
  isEdited.value
    ? $sdk.confirm('当前已编辑的内容未保存，取消将丢弃，确定取消吗？').then(() => {
        router.back()
      })
    : router.back()
}
</script>

<template>
  <div>
    <BaForm ref="formRef" class="Gcard" :model="form">
      <BaInput v-model="form.title" maxlength="100" prop="title" label="标题" required></BaInput>
      <BaInput v-model="form.desc" maxlength="200" prop="desc" label="描述"></BaInput>
      <BaInputNumber v-model="form.order" :precision="2" :step="1" :min="0" prop="order" label="排序" required />
      <BaDatePicker
        v-model="form.publishTime"
        value-format="YYYY-MM-DD HH:mm:ss"
        type="datetime"
        :disabledDate="(time) => time <= new Date(new Date().setDate(new Date().getDate() - 1))"
        prop="publishTime"
        label="定时发布" />
      <BaFormItem prop="catalogId" label="分类" required>
        <el-tree-select
          v-model="form.catalogId"
          :data="trees"
          show-checkbox
          ref="menuRef"
          node-key="id"
          check-strictly="true"
          empty-text="加载中，请稍后"
          :props="{ label: 'name' }"
          placeholder="选择分类"></el-tree-select>
      </BaFormItem>
      <BaFormItem prop="thumb" label="封面">
        <Upload v-model:fileUrl="form.thumb" :params="{ module: 'article' }"></Upload>
      </BaFormItem>
      <el-form-item prop="content" label="内容" style="max-width: none !important">
        <Editor v-model="form.content" style="min-height: 500px; height: auto"></Editor>
      </el-form-item>
    </BaForm>
    <OperateBar>
      <ElButton type="primary" @click="cancel">取消</ElButton>
      <ElButton type="primary" @click="submit('draft')">保存草稿</ElButton>
      <ElButton type="primary" @click="submit()">发布</ElButton>
    </OperateBar>
  </div>
</template>

<style lang="scss" scoped>
:deep(.BaForm) {
  max-width: none !important;
  .el-form-item {
    max-width: 800px;
  }
}
</style>
