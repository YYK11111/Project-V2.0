<script>
export default {
  name: '',
  props: {
    required: { type: Boolean, default: false },
    isOperateBar: { type: Boolean, default: false },
    // prop: { type: String, default: '' },
  },
  components: {},
  data() {
    return {
      data: '',
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    async submit() {
      await this.$refs.formRef.validate()
      $emit('submit')
    },
  },
}
</script>

<template>
  <el-form class="BaForm" ref="formRef" label-width="80px" v-bind="$attrs">
    <slot></slot>
  </el-form>
  <OperateBar v-if="isOperateBar">
    <ElButton type="primary" @click="$emit('cancel')">取消</ElButton>
    <ElButton type="primary" @click="submit()">发布</ElButton>
  </OperateBar>
</template>

<style lang="scss" scoped></style>
