<!-- <BaInput v-model.trim="dataUser.username" label="分支" prop="username"></BaInput> -->

<!-- <script setup lang="ts">
import { ref } from 'vue'
const $props = defineProps({
	placeholder: { type: String, default: '' },
})
const input = ref()
const placeholderTransfer = computed(() => {
	if (!$props.placeholder) {
		console.log(input)

		return '请输入'
	} else {
		return $props.placeholder
	}
})
</script> -->
<script>
import { defineComponent, defineAsyncComponent } from 'vue'
// import { ElFormItem } from 'element-plus'
export default defineComponent({
  props: {
    placeholder: { type: String },
    required: { type: Boolean, default: false },
  },
  // components: { ElFormItem: defineAsyncComponent(() => import('element-plus')['ElFormItem']) },
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
    :is="$attrs.label || $attrs.prop ? 'ElFormItem' : 'div'"
    class="inline-block"
    :rules="requiredToRule"
    v-bind="{ label: $attrs.label, prop: $attrs.prop }">
    <!-- v-bind="({ label, prop, rules } = $attrs)"> -->
    <template
      #[item]
      v-for="(item, index) of Object.keys($slots).filter((e) => ['label', 'error'].includes(e))"
      :key="index">
      <slot :name="item"></slot>
    </template>
    <el-input
      class="BaInput"
      clearable
      show-word-limit
      :placeholder="placeholderTransfer"
      v-bind="Object.assign({}, $attrs, { style: '', class: '', id: '' })">
      <template
        #[item]
        v-for="(item, index) of Object.keys($slots).filter((e) =>
          ['prefix', 'suffix', 'prepend', 'append'].includes(e),
        )"
        :key="index">
        <slot :name="item"></slot>
      </template>
    </el-input>
  </component>
</template>

<style lang="scss" scoped></style>
