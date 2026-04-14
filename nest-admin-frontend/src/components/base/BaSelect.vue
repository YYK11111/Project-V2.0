<!-- <BaSelect class="flex-none w-[150px]" v-model="row.type" @change="(val) => saveOrUpdateFileFn(row)">
  <el-option
    v-for="(item, key) of customerStatusDict"
    :key="key"
    :label="item"
    :value="key"></el-option>
</BaSelect> -->
<script>
import { defineComponent } from 'vue'
import { ElFormItem } from 'element-plus'
export default defineComponent({
  props: {
    placeholder: { type: String },
    isAll: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
  },
  components: { ElFormItem },
  computed: {
    placeholderTransfer() {
      return this.placeholder !== undefined
        ? this.placeholder
        : '请输入' + (this.$attrs.label || this.$.parent?.props?.label || '')
    },
    requiredToRule() {
      return this.required ? [$sdk.ruleRequiredChange] : undefined
    },
  },
})
</script>
<template>
  <component
    class="BaSelect"
    :is="$attrs.label || $attrs.prop ? 'ElFormItem' : 'div'"
    :rules="requiredToRule"
    v-bind="Object.assign({}, $attrs, { modelValue: '' })">
    <el-select
      class="BaSelect"
      clearable
      :placeholder="placeholderTransfer"
      :empty-values="isAll && ['', null]"
      v-bind="Object.assign({}, $attrs, { style: '', class: '', id: '' })">
      <el-option v-if="isAll" label="全部" :value="undefined"></el-option>
      <slot></slot>
    </el-select>
  </component>
</template>

<style lang="scss" scoped>
// .BaSelect {
//   height: var(--heightBaseSelect);
// }
// :deep() .el-select__wrapper {
//   border: 1px solid var(--BorderBlack10);
//   background-color: transparent;
//   height: var(--heightBaseSelect);
// }
</style>
