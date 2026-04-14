<script setup>
import { ref, watch, onMounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      sprintName: '',
      startDate: '',
      endDate: '',
      totalPoints: 0,
      days: [],
      idealLine: [],
      actualLine: [],
    }),
  },
  height: {
    type: String,
    default: '300px',
  },
})

const chartRef = ref(null)
let chartInstance = null

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const option = {
    title: {
      text: props.data.sprintName || 'Sprint 燃尽图',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['理想线', '实际线'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '80px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: props.data.days || [],
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: '故事点',
      min: 0,
      max: props.data.totalPoints || 100,
    },
    series: [
      {
        name: '理想线',
        type: 'line',
        data: props.data.idealLine || [],
        smooth: true,
        lineStyle: {
          type: 'dashed',
          color: '#909399',
        },
        itemStyle: {
          color: '#909399',
        },
      },
      {
        name: '实际线',
        type: 'line',
        data: props.data.actualLine || [],
        smooth: true,
        lineStyle: {
          color: '#409EFF',
        },
        itemStyle: {
          color: '#409EFF',
        },
        connectNulls: true,
      },
    ],
  }

  chartInstance.setOption(option)
}

watch(() => props.data, () => {
  initChart()
}, { deep: true })

onMounted(() => {
  initChart()
})

defineExpose({ initChart })
</script>

<template>
  <div ref="chartRef" :style="{ height: height, width: '100%' }"></div>
</template>