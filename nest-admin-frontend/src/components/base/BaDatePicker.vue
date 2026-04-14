<script>
import { defineComponent } from 'vue'
import { datePickerOptions } from '@/utils/common'
import { ElFormItem } from 'element-plus'
export default defineComponent({
  props: {
    placeholder: { type: String },
  },
  components: { ElFormItem },
  data() {
    return {
      datePickerOptions,
    }
  },
  computed: {
    placeholderTransfer() {
      return this.placeholder || '请选择' + (this.$attrs.label || this.$.parent?.props?.label || '')
    },
  },
})
</script>
<template>
  <component
    :is="$attrs.label || $attrs.prop ? 'ElFormItem' : 'div'"
    v-bind="{ label: $attrs.label, prop: $attrs.prop }">
    <el-date-picker
      class="BaDatePicker"
      value-format="YYYY-MM-DD"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      clearable
      v-bind="Object.assign({}, datePickerOptions, $attrs, { style: '', class: '', id: '' })"></el-date-picker>
    <!-- v-bind="{ ...datePickerOptions, ...$attrs }"></el-date-picker> -->
  </component>
</template>

<style lang="scss" scoped>
:deep() .el-date-editor {
  border: 1px solid var(--BorderBlack10);
  background-color: transparent;
  height: var(--heightBaseDate);
}
</style>
