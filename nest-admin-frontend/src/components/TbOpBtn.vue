<script>
let keys = {}
let dict = {
  [(keys.edit ??= 'edit')]: {
    icon: 'el-icon-edit',
    content: '编辑',
  },
  [(keys.delete ??= 'delete')]: {
    icon: 'el-icon-delete',
    content: '删除',
  },
  [(keys.detail ??= 'detail')]: {
    icon: 'el-icon-view',
    content: '详情',
  },
  [(keys.copy ??= 'copy')]: {
    icon: 'el-icon-CopyDocument',
    content: '复制',
  },
}
</script>
<script setup>
import { useSlots, useAttrs } from 'vue'

defineProps({
  icon: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: true,
  },
})

const slots = useSlots()
const attrs = useAttrs()
</script>

<template>
  <div class="TbOpBtn TableOperateBtn">
    <el-tooltip
      effect="dark"
      :content="$slots.default?.()[0].children || $attrs.content || dict[icon].content"
      placement="top"
      :disabled="disabled"
      v-bind="Object.assign({}, $attrs, { class: '', style: '' })">
      <el-button
        text
        :icon="dict[icon]?.icon || icon"
        :title="$slots.default?.()[0].children || $attrs.content || dict[type].content">
        <slot></slot>
      </el-button>
    </el-tooltip>
  </div>
</template>

<style lang="scss" scoped>
.TableOperateBtn {
  display: inline-block;
  + .TableOperateBtn {
    margin-left: 10px;
  }
  .el-button {
    font-size: 13px;
  }

  :deep() .el-icon {
    font-size: 16px;
  }
}
</style>
