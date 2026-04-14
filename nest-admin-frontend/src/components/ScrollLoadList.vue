<!-- 下拉刷新、下拉加载列表 组件 -->
<script>
export default {
  name: '',
  props: {
    // 加载请求接口
    request: {
      type: Function,
    },
    keywords: {
      type: String,
      default: 'keywords',
    },
    // 查询参数
    params: {
      type: Object,
      default: () => ({}),
    },
    // 是否显示搜索框
    isQuery: {
      type: Boolean,
      default: true,
    },
    queryPlaceholder: {
      type: String,
      default: '请输入关键词',
    },
    // 是否禁用滚动加载
    disabled: {
      type: Boolean,
      default: false,
    },
    // 是否分页查询/是否启用滚动加载
    isPageQuery: {
      type: Boolean,
      default: true,
    },
    // 自定义的查询参数处理方法，可用于添加和修改查询参数
    dealQueryFun: {
      type: Function,
      default: null,
    },
    // 自定义的返回数据处理方法，可用于添加和修改查询参数
    dealDataFun: {
      type: Function,
      default: null,
    },
    finishedText: {
      type: String,
      default: '没有更多啦~',
    },
  },
  data() {
    return {
      loading: false,
      query: {
        keywords: '',
      },
      // refreshing: false,
      finished: false,
      error: false,
      list: [],
      total: 0,
    }
  },
  computed: {},
  watch: {},
  created() {
    this.isPageQuery && Object.assign(this.query, { pageNum: 1, pageSize: 10 })
    this.getList()
  },
  mounted() {},
  methods: {
    getList(page) {
      if (!this.request) {
        return
      }
      if (this.disabled || this.error) {
        return
      }
      this.loading = true
      this.finished = false
      page && (this.query.pageNum = page)

      Object.assign(this.query, this.params)

      this.dealQueryFun?.(this.query)

      this.request(this.query)
        .then(({ rows, data, total = 0 }) => {
          this.total = total
          rows ??= data || []
          if (this.query.pageNum == 1) {
            this.list = []
          }
          rows = this.dealDataFun?.(rows) || rows

          this.list.push(...rows)
          this.loading = false
          // this.refreshing = false
          // 数据全部加载完成
          if (this.list.length >= +total) {
            if (total == 0) {
              this.query.pageNum = 1
            }
            this.finished = true
          } else {
            this.query.pageNum++
          }
        })
        .catch(() => {
          this.error = true
          this.loading = false
          // this.finished = true
        })
    },
  },
}
</script>

<template>
  <div class="ScrollLoadList">
    <div class="--MarginB" v-if="isQuery">
      <el-input
        v-model="query[keywords]"
        :placeholder="queryPlaceholder"
        placeholder="请输入关键词"
        clearable
        @keyup.enter.exact="getList(1)">
        <template #append>
          <el-button icon="el-icon-search" @click="getList(1)" />
        </template>
      </el-input>
    </div>

    <div
      ref="scroll"
      v-infinite-scroll="getList.bind()"
      style="overflow: auto; height: 100%"
      :infinite-scroll-disabled="loading || finished || !isPageQuery">
      <template v-for="(item, i) in list" :key="i">
        <slot name="item" v-bind="{ item }"></slot>
      </template>

      <div>
        <slot name="list" v-bind="{ list }"></slot>
      </div>

      <!-- v-if="loading || finished" -->
      <div class="alignCenter mt10 mb10" style="color: var(--FontBlack6)">
        <div v-if="!finished" class="flexCenterCenter">
          <span>正在加载...</span>
          <span class="font12 --ColorWarning pointer" v-if="query.pageNum > 1" @click="getList()">
            没有成功？点此加载
          </span>
        </div>
        <slot name="empty" v-else-if="finished && !list?.length">
          <Empty />
        </slot>
        <p v-else-if="finished">{{ finishedText }}</p>
        <p class="--ColorWarning" v-else-if="error" @click="getList()">加载失败，点击重试</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ScrollLoadList {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
