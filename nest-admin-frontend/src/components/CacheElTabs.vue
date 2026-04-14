<!-- 扩展<el-tabs></el-tabs> 缓存当前激活索引和组件 -->
<!-- <CacheElTabs v-model="activeTab" #="{ opened }">
        <el-tab-pane v-for="(item, index) of tabs" :key="index" :label="item.label" :name="index">
          <component v-if="opened.includes(index)" :is="item.component"></component>
        </el-tab-pane>
      </CacheElTabs> -->
<script>
export default {
  props: {
    modelValue: '',
    isSyncRoute: Boolean,
  },
  data() {
    return {
      opened: [this.$route.query.index || this.modelValue || '0'],
    }
  },
  computed: {
    active: {
      get() {
        return this.$route.query.index || this.modelValue || '0'
      },
      set(val) {
        this.opened.includes(val) || this.opened.push(val)
        this.$emit('update:modelValue', val)
        this.isSyncRoute &&
          this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, index: val } })
      },
    },
  },
  watch: {},
  created() {
    // this.active = this.$route.query.index || this.modelValue || '0'
  },
  mounted() {},
  methods: {},
}
</script>

<template>
  <el-tabs class="CacheElTabs" v-model="active">
    <slot v-bind="{ active, opened }"></slot>
  </el-tabs>
</template>

<style lang="scss" scoped>
.CacheElTabs.el-tabs--top {
  height: var(--heightTabs, 100%);
  // z-index: 99;
  // position: sticky !important;
  // top: 0;
  ::v-deep > .el-tabs__header {
    z-index: 99;
    position: sticky !important;
    top: 0;
    background: var(--BgWhite);
    border-radius: var(--Radius);
    box-shadow: 0px 4px 20px 0px var(--BgBlack10);
    overflow: hidden;
    .el-tabs__item.is-top:nth-child(2) {
      margin-left: 20px;
    }
    .el-tabs__item.is-top:last-child {
      margin-right: 20px;
    }
  }
  :deep() {
    .el-tabs__content {
      height: 100%;
      flex: auto;
      overflow: auto;
    }
    .el-tab-pane {
      height: 100%;
      overflow: auto;
    }
  }
}
</style>
