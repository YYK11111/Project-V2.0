<!-- 查询数据表格或图表展示 -->
<script>
import { defineComponent, defineAsyncComponent } from 'vue'
export default defineComponent({
  components: {
    ChartLine: defineAsyncComponent(() => import('@/components/ChartLine')),
    ChartBar: defineAsyncComponent(() => import('@/components/ChartBar')),
    SearchTitle: defineAsyncComponent(() => import('@/components/SearchTitle')),
  },
  props: {
    // 标题
    title: {},
    // 数据展示图表类型
    type: {
      type: String, // lineChart, barChart, table
      default: 'table',
    },
    // 查询参数
    params: {
      type: Object,
      default: () => ({}),
    },
    // 是否分页查询
    isPageQuery: {
      type: Boolean,
      default: true,
    },
    // 接口请求
    request: {
      type: Function,
    },
    // 是否在创建的时候自动调用request接口请求
    isCreateRequest: {
      type: Boolean,
      default: true,
    },
    // 是否显示快捷时间查询
    isTimeQuery: {
      type: Boolean,
    },

    // 自定义的查询参数处理方法，可用于添加和修改查询参数
    dealQueryFun: {
      type: Function,
      default: null,
    },
    // 自定义的返回数据处理方法
    dealDataFun: {
      type: Function,
      default: null,
    },
    // 数据主键
    dataKey: {
      type: String,
      default: 'id',
    },

    // 导出接口请求
    requestExport: {
      type: Function,
      default: null,
    },
    // 导出文件名(需包含后缀名)
    exportFileName: { type: String },

    // 图表图例; 单个图例可传字符串，多个图例传数组
    legend: {
      type: [Array, String],
      default: null,
    },
    // 自定义图表配置项，使用loadsh.merge(origin, option)和原有的配置进行覆盖合并
    // loadsh.merge: https://www.html.cn/doc/lodash/#_mergeobject-sources
    option: {
      type: Object,
      default: null,
    },
    tableOprateWidth: {
      type: String,
      default: '220',
    },
    isSelection: {
      type: Boolean,
      default: false,
    },
    isSigleSelect: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      query: {},
      // 列表接口返回数据
      response: {},
      // 表格列表数据，或图表的series数据
      data: [],
      xData: [],

      total: 0,

      selectedIds: [], // 多选数据
    }
  },
  computed: {},
  watch: {},
  created() {
    this.isPageQuery && Object.assign(this.query, { pageNum: 1, pageSize: 10 })
    this.isCreateRequest && !this.isTimeQuery && this.getList()
  },
  mounted() {},
  methods: {
    getList(page) {
      if (typeof this.request !== 'function') {
        console.error('[RequestChartTable] invalid request prop', {
          route: this.$route?.fullPath,
          request: this.request,
        })
        this.loading = false
        return Promise.resolve()
      }

      this.loading = true
      if (this.type == 'table') {
        page && (this.query.pageNum = page)
      }

      Object.assign(this.query, this.params)

      this.dealQueryFun && this.dealQueryFun(this.query)

      let query = JSON.parse(JSON.stringify(this.query))
      if (query.dateRange) {
        query.beginTime = query.dateRange[0]
        query.endTime = query.dateRange[1]
      } else if (!this.isTimeQuery) {
        delete query.beginTime
        delete query.endTime
      }
      delete query.dateRange

      return this.request(query)
        .then((resp) => {
          let { rows, total, data } = resp
          let res = data || rows
          // if (!data) return
          if (this.type == 'table') {
            // 表格
            this.dealDataFun && this.dealDataFun(res, resp)
            this.response = resp
            this.data = res
            this.total = +total
          } else {
            // 自定义echarts图表数据处理
            // this.data = data
            this.dealDataFun && this.dealDataFun(res, this.data, this.xData, resp)
            this.response = resp
          }
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.loading = false
        })
    },
    reset(form) {
      this.$refs[form].resetFields()
      this.$emit('reset')
      setTimeout(() => {
        this.getList(1)
      }, 0)
    },

    /**
     * (批量)删除 供父组件调用
     * @param {*} delApi 删除接口
     * @param {*} id 字符串id
     */
    del(delApi, id) {
      if (!delApi) {
        return $sdk.msgError('无可用接口服务')
      }
      let ids = id || this.selectedIds?.join?.(',')
      if (!ids) {
        return $sdk.msgError('请选择需要删除的数据')
      }
      $sdk
        .confirm()
        .then(() => {
          this.loading = true
          return delApi(ids).then((res) => {
            $sdk.msgSuccess('删除成功')
            this.getList()
          })
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.loading = false
        })
    },

    /**
     * (批量)下载 供父组件调用
     * @param {*} download 下载接口函数 必需
     * @param {*} filename 文件名 需含文件后缀名 必需
     * @param {*} tips 弹窗提示语
     * @param {*} type 文件类型 enum: excel,zip,image
     */
    download(download, filename, tips = '是否确认下载', type = 'zip') {
      if (!(download && filename)) {
        return
      }
      $sdk
        .confirm(tips)
        .then(() => {
          return download(this.selectedIds?.join?.(','))
        })
        .then((res) => {
          this.downloadBlob(res, filename, type)
        })
        .catch(function () {})
    },

    /**
     * 路由跳转 供父组件调用
     * @param {*} path 路径
     * @param {*} idOrQuery 字符串id或路由query对象
     */
    goRoute(idOrQuery, path = 'form') {
      // 如果 path 不是以 / 开头，则拼接当前路由的路径
      const fullPath = path.startsWith('/') ? path : this.$route.path + '/' + path
      this.$router.push({
        path: fullPath,
        query: typeof idOrQuery === 'string' ? { id: idOrQuery } : idOrQuery,
      })
    },

    /**
     * 通用确认接口操作 供父组件调用
     * @param {*} delApi 功能接口
     * @param {*} id 字符串id
     * @param {*} tips 弹窗提示语
     */
    apiConfirm(apiRequest, id, tips) {
      if (!apiRequest) {
        return $sdk.msgError('无可用接口服务')
      }
      let ids = id || this.selectedIds?.join?.(',')
      if (!ids) {
        return $sdk.msgError('请选择数据')
      }
      $sdk
        .confirm(tips)
        .then(() => {
          this.loading = true
          return apiRequest(ids).then((res) => {
            $sdk.msgSuccess()
            this.getList()
          })
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
})
</script>

<template>
  <div class="RequestChartTable" :class="$slots.query || 'Gcard'" v-loading="loading">
    <!-- 顶部查询框 -->
    <el-form
      v-if="$slots.query"
      :model="query"
      ref="queryForm"
      inline
      class="GtopSearch"
      @keyup.enter.prevent="getList(1)">
      <slot name="query" v-bind="{ query }"></slot>
      <SearchResetButton @search="getList(1)" @reset="reset('queryForm')"></SearchResetButton>
    </el-form>

    <div :class="$slots.query && 'Gcard'">
      <!-- 卡片标题 -->
      <div class="GcardTitle" v-if="title">{{ title }}</div>

      <!-- 查询框和操作栏 -->
      <div class="queryMiddleWrap" v-if="requestExport || isTimeQuery || $slots.queryMiddle || $slots.operation">
        <!-- 快捷时间查询 -->
        <SearchTitle
          style="display: inline-flex"
          v-if="isTimeQuery"
          @search="(data) => (Object.assign(query, data), getList(1))"></SearchTitle>

        <el-form v-if="$slots.queryMiddle" :model="query" ref="queryFormMiddle" inline class="queryFormMiddle">
          <slot name="queryMiddle" v-bind="{ query }"></slot>
          <SearchResetButton @search="getList(1)" @reset="reset('queryFormMiddle')"></SearchResetButton>
        </el-form>

        <!-- 操作slot -->
        <slot name="operation" v-bind="{ selectedIds, response }"></slot>

        <el-button
          v-if="requestExport"
          class="export floatRight"
          type="primary"
          @click="$exportData(requestExport.bind(null, query), exportFileName)">
          导出 Excel
        </el-button>
      </div>

      <!-- 折线图 -->
      <ChartLine
        v-if="type == 'lineChart'"
        :xData="xData"
        :legend="legend"
        :series="data"
        :option="option"
        :bgLinearGradient="$attrs.bgLinearGradient"></ChartLine>

      <!-- 柱状图 -->
      <ChartBar v-else-if="'barChart'.includes(type)" :xData="xData" :series="data" :option="option"></ChartBar>

      <!-- 表格 -->
      <template v-else-if="type == 'table'">
        <slot v-bind="{ data, query, getList, apiConfirm, goRoute }"></slot>

        <el-table v-if="$slots.tableView" :data="data" show-overflow-tooltip>
          <slot name="tableView"></slot>
        </el-table>

        <el-table
          v-if="$slots.table"
          ref="table"
          :data="data"
          show-overflow-tooltip
          @selection-change="(val) => ((selectedIds = val.map((e) => e[dataKey])), $emit('selectionChange', val))">
          <template v-if="isSelection">
            <el-table-column v-if="isSigleSelect" width="30" fixed="left">
              <template #default="{ row }">
                <el-radio v-model="selectedIds" :label="row" @change="(val) => $emit('selectionChange', val)">
                  &nbsp;
                </el-radio>
              </template>
            </el-table-column>
            <el-table-column
              v-else
              type="selection"
              width="50"
              :selectable="
                (row) => selectedIds.includes(row[dataKey]) || !(isSigleSelect && selectedIds?.length)
              "></el-table-column>
          </template>
          <slot name="table" v-bind="{ query, getList, apiConfirm, goRoute }"></slot>
          <el-table-column label="最近更新" prop="updateTime" width="180">
            <template #default="{ row }">
              {{ row.updateUser || row.createUser || '-' }}
              <br />
              {{ row.updateTime || row.createTime || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" :width="tableOprateWidth">
            <template #default="scope">
              <slot name="tableOperation" v-bind="scope"></slot>
            </template>
          </el-table-column>

          <template #empty>
            <slot name="empty"></slot>
          </template>
        </el-table>

        <slot name="pagination" v-bind="{ total, query, getList }">
          <pagination
            v-if="isPageQuery && total >= 0"
            style="margin-bottom: -20px"
            :total="total"
            v-model:page="query.pageNum"
            v-model:limit="query.pageSize"
            @pagination="getList()" />
        </slot>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.Gcard {
  overflow: initial;
}
.queryMiddleWrap {
  position: relative;
  overflow: auto;
  // display: flex;
  // align-items: center;
  margin-bottom: var(--Card-margin, 16px);
}
::v-deep.queryFormMiddle {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 18px;
  .el-form-item__content {
    width: 210px;
  }
}

// ::v-deep .el-table {
//   .el-table-fixed-column--right .cell {
//     white-space: nowrap;
//     // display: inline-flex;
//     // flex-wrap: wrap;
//     // gap: 10px;
//     // .el-button.is-text {
//     //   margin: 0;
//     //   padding: 0;
//     // }
//   }
// }
</style>
