<script>
import { defineComponent, defineAsyncComponent } from 'vue'
import { ElFormItem } from 'element-plus'
export default defineComponent({
  props: {
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
  },
  // components: { ElFormItem: defineAsyncComponent(() => import('element-plus')['ElFormItem']) },
  components: { ElFormItem },
  computed: {
    placeholderTransfer() {
      return this.placeholder || '请输入' + (this.$attrs.label || this.$.parent?.props?.label || '')
    },
    requiredToRule() {
      // console.log(this.$slots)

      return this.required && [$sdk.ruleRequiredChange]
    },
  },
})
</script>
<template>
  <component
    :is="$attrs.label || $attrs.prop ? 'ElFormItem' : 'div'"
    :rules="requiredToRule"
    v-bind="{ label, prop, rules } = $attrs">
    <template
      #[item]
      v-for="(item, index) of Object.keys($slots).filter((e) => ['label', 'error'].includes(e))"
      :key="index">
      <slot :name="item"></slot>
    </template>
    <el-input-number
      class="BaInputNumber"
      clearable
      controls-position="right"
      :placeholder="placeholderTransfer"
      v-bind="$attrs">
      <template
        #[item]
        v-for="(item, index) of Object.keys($slots).filter((e) =>
          ['prefix', 'suffix', 'decrease-icon', 'increase-icon'].includes(e),
        )"
        :key="index">
        <slot :name="item"></slot>
      </template>
    </el-input-number>
  </component>
</template>

<style lang="scss" scoped></style>
