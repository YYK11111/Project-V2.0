<script>
import { defineComponent } from 'vue'
import { ElFormItem } from 'element-plus'
export default defineComponent({
	name: '',
	props: {},
	components: { ElFormItem },
	data() {
		return {
			data: '',
		}
	},
	computed: {
		placeholderTransfer() {
			return this.placeholder || '请选择' + (this.$attrs.label || this.$.parent?.props?.label || '')
		},
	},
	watch: {},
	created() {},
	mounted() {},
	methods: {},
})
</script>

<template>
	<component :is="$attrs.label || $attrs.prop ? 'ElFormItem' : 'div'" v-bind="({ label, prop } = $attrs)">
		<el-radio-group class="BaseRadio" :placeholder="placeholderTransfer" v-bind="$attrs">
			<slot></slot>
		</el-radio-group>
	</component>
</template>

<style scoped></style>
