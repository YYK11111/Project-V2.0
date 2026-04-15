<script>
import * as echarts from 'echarts'
import { echartColors } from '@/utils/common'
import merge from 'lodash.merge'

export default {
  // 饼图
  name: 'ChartPie',
  emits: ['slice-click'],
  components: {},
  props: {
    // 图例
    legend: {
      type: Array,
      default: () => [],
    },
    // 展示数据集
    series: {
      type: Array,
      default: () => [
        // { value: 484, name: 'Union Ads' },
        // { value: 300, name: 'Video Ads' },
      ],
    },
    // 自定义图表配置项，使用loadsh.merge(origin, option)和原有的配置进行覆盖合并
    // loadsh.merge: https://www.html.cn/doc/lodash/#_mergeobject-sources
    option: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      myChart: null,
      resizeObserver: null,
    }
  },
  computed: {},
  watch: {
    series: {
      deep: true,
      handler() {
        this.drawChart()
      },
    },
    option: {
      deep: true,
      handler() {
        this.drawChart()
      },
    },
  },
  created() {},
  mounted() {
    this.initResizeObserver()
    this.drawChart()
  },
  beforeUnmount() {
    this.destroyChart()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    initResizeObserver() {
      if (!this.$refs.chart || this.resizeObserver) return
      this.resizeObserver = new ResizeObserver(() => {
        this.myChart?.resize()
      })
      this.resizeObserver.observe(this.$refs.chart)
    },
    destroyChart() {
      if (this.myChart) {
        this.myChart.off('click')
        this.myChart.dispose()
        this.myChart = null
      }
    },
    drawChart() {
      if (!this.$refs.chart) return
      this.initResizeObserver()

      if (!this.series?.length) {
        this.destroyChart()
        return
      }

      this.destroyChart()
      this.myChart = echarts.init(this.$refs.chart)
      let option = {
        color: echartColors,
        // title: {
        //   text: 'Stacked Area Chart',
        //   left: 'center',
        //   top: 'bottom'
        // },
        tooltip: {
          trigger: 'item',
          // textStyle: {
          //   color: '#FFF', // 设置文字颜色
          //   fontSize: 12,
          // },
          // backgroundColor: '#505050',
          // borderWidth: 0,
          // axisPointer: {
          //   type: 'cross',
          //   label: {
          //     backgroundColor: '#6a7985',
          //   },
          // },
        },
        legend: {
          x: 'center',
          y: '88%',
          // selectedMode: false,
          type: 'scroll', // 分页类型
          icon: 'circle',
          itemWidth: 8,
          itemHeight: 8,
          tooltip: {
            show: true,
          },
          textStyle: {
            color: '#36363A',
            fontSize: 12,
            lineHeight: 14,
          },
        },
        grid: {
          left: '3%',
          right: '3%',
          bottom: '20px',
          top: '30px',
          containLabel: true,
        },
        series: {
          type: 'pie',
          radius: '50%',
          data: this.series,
          radius: ['40%', '70%'],
          padAngle: 5,
          itemStyle: {
            borderRadius: 10,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      }
      this.option && merge(option, this.option)
      option && this.myChart.setOption(option)
      this.myChart.on('click', (params) => {
        this.$emit('slice-click', params)
      })
      this.$nextTick(() => {
        this.myChart?.resize()
      })
    },
  },
}
</script>

<template>
  <div v-if="series?.length" ref="chart" class="chart-pie chart" key="1"></div>
  <div v-else class="chart-pie chart" key="2">
    <div class="centerCenter"><Empty /></div>
  </div>
</template>

<style lang="scss" scoped>
.chart {
  position: relative;
  max-height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 280px;
}
</style>
