<script>
export default {
  name: '',
  props: {
    required: { type: Boolean, default: false },
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
  methods: {},
}
</script>

<template>
  <el-form-item class="BaFormItem" :rules="required && [$sdk.ruleRequiredChange]">
    <slot></slot>
  </el-form-item>
</template>

<style lang="scss" scoped></style>
