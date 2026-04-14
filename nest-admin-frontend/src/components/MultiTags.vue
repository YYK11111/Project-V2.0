<script>
export default {
  components: {},
  props: {
    // 可传入数组，或逗号隔开的数组字符串，示例：['1','2'] 或 [{name:1}] 或 '1,2'
    list: {
      type: [Array, String],
      default: () => [],
    },
    // 限制显示多少个元素后使用省略号，默认：2
    limit: {
      type: [String, Number],
      default: 2,
    },
    // list对象数组形式元素的文字回显字段，默认：name
    defaultProps: {
      type: String,
      default: 'name',
    },
    // 空数据时显示的文本内容
    emptyText: {
      type: [Boolean, String], // Boolean必须在前，方便显式设置默认值， 具体规则参考vue3文档
    },
    // 标签显示是否换行（flex-wrap）
    isNoWrap: Boolean,
  },
  data() {
    return {}
  },
  computed: {
    _list() {
      return (typeof this.list === 'string' ? this.list?.split(',') : this.list)?.filter((e) =>
        typeof e === 'string' ? e : e[this.defaultProps],
      )
    },
  },
  watch: {},
  created() {
    // 可传入 el-tag 的props
    this.elTagProps = Object.assign({}, this.$attrs)
    delete this.elTagProps.style
    delete this.elTagProps.class
  },
  mounted() {},
  methods: {},
}
</script>

<template>
  <div class="MultiTags" v-if="_list?.length || emptyText">
    <div v-if="!_list?.length">{{ typeof emptyText === 'string' ? emptyText : '无' }}</div>

    <el-popover v-else placement="bottom" trigger="hover" :disabled="_list.length <= +limit">
      <!-- 插入到body，这里用css scoped calss无效，需使用style-->
      <div class="tags" :style="{ display: 'flex', gap: '10px', 'flex-wrap': isNoWrap ? 'nowrap' : 'wrap' }">
        <el-tag v-bind="elTagProps" v-for="(item, unique) in _list" :key="unique" style="margin: 0">
          {{ item[defaultProps] || item }}
        </el-tag>
      </div>
      <template #reference>
        <div class="tags" :style="{ 'flex-wrap': isNoWrap ? 'nowrap' : 'wrap' }">
          <el-tag v-bind="elTagProps" v-for="(item, unique) in _list.slice(0, +limit)" :key="unique">
            {{ item[defaultProps] || item }}
          </el-tag>
          <el-tag v-bind="elTagProps" key="a" v-if="_list.length > +limit">...</el-tag>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<style lang="scss" scoped>
.MultiTags {
  display: inline-block;
  // line-height: 34px;
  .tags {
    display: flex;
    gap: 10px;
    .el-tag {
      margin: 0;
    }
  }
}
</style>
