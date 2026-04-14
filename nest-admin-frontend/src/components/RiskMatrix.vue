<script setup>
import { ref, computed, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  risks: {
    type: Array,
    default: () => [],
  },
  height: {
    type: String,
    default: '400px',
  },
})

const emit = defineEmits(['risk-click'])

const chartRef = ref(null)
let chartInstance = null

const riskData = computed(() => {
  return props.risks.map(risk => {
    let probability = 1
    let impact = 1
    
    if (risk.level === '1') {
      probability = 2
      impact = 2
    } else if (risk.level === '2') {
      probability = 3
      impact = 3
    } else if (risk.level === '3') {
      probability = 4
      impact = 4
    } else if (risk.level === '4') {
      probability = 5
      impact = 5
    }
    
    return {
      id: risk.id,
      name: risk.name,
      probability,
      impact,
      level: risk.level,
      status: risk.status,
    }
  })
})

function initChart() {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const option = {
    title: {
      text: '风险矩阵',
      left: 'center',
    },
    tooltip: {
      position: 'top',
      formatter: (params) => {
        if (params.data.type === 'cell') {
          return ''
        }
        const risk = params.data
        return `<div>
          <p><strong>${risk.name}</strong></p>
          <p>概率: ${risk.probability}</p>
          <p>影响: ${risk.impact}</p>
        </div>`
      },
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '60px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['很低', '低', '中', '高', '很高'],
      name: '概率',
      nameLocation: 'middle',
      nameGap: 30,
      splitArea: { show: true },
    },
    yAxis: {
      type: 'category',
      data: ['很低', '低', '中', '高', '很高'],
      name: '影响',
      nameLocation: 'middle',
      nameGap: 40,
      splitArea: { show: true },
    },
    series: [
      {
        name: '风险矩阵',
        type: 'heatmap',
        data: [
          [0, 0, 0.2],
          [0, 1, 0.3],
          [0, 2, 0.4],
          [0, 3, 0.5],
          [0, 4, 0.6],
          [1, 0, 0.3],
          [1, 1, 0.4],
          [1, 2, 0.5],
          [1, 3, 0.6],
          [1, 4, 0.7],
          [2, 0, 0.4],
          [2, 1, 0.5],
          [2, 2, 0.6],
          [2, 3, 0.7],
          [2, 4, 0.8],
          [3, 0, 0.5],
          [3, 1, 0.6],
          [3, 2, 0.7],
          [3, 3, 0.8],
          [3, 4, 0.9],
          [4, 0, 0.6],
          [4, 1, 0.7],
          [4, 2, 0.8],
          [4, 3, 0.9],
          [4, 4, 1.0],
        ],
        itemStyle: {
          color: (params) => {
            const colors = [
              ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a'],
              ['#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50'],
              ['#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047'],
              ['#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c'],
              ['#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32'],
            ]
            const [x, y] = params.data.value || params.data
            return colors[x]?.[y] || '#e8f5e9'
          },
        },
        label: {
          show: false,
        },
      },
      {
        name: '风险点',
        type: 'scatter',
        coordinateSystem: 'cartesian2d',
        symbolSize: (val, params) => {
          return props.risks.length > 10 ? 15 : 25
        },
        data: riskData.value.map(risk => ({
          value: [6 - risk.probability, 6 - risk.impact],
          id: risk.id,
          name: risk.name,
          level: risk.level,
          status: risk.status,
          type: 'risk',
        })),
        itemStyle: {
          color: (params) => {
            const colors = {
              '1': '#67C23A',
              '2': '#E6A23C',
              '3': '#F56C6C',
              '4': '#9C27B0',
            }
            return colors[params.data.level] || '#409EFF'
          },
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params) => {
            return params.data.name?.substring(0, 2) || ''
          },
          fontSize: 10,
          color: '#fff',
        },
        emphasis: {
          scale: 1.5,
          itemStyle: {
            borderWidth: 2,
            borderColor: '#fff',
          },
        },
      },
    ],
  }

  chartInstance.setOption(option)

  chartInstance.on('click', (params) => {
    if (params.data.type === 'risk') {
      emit('risk-click', params.data)
    }
  })
}

watch(() => props.risks, () => {
  initChart()
}, { deep: true })

watch(chartRef, () => {
  initChart()
})

defineExpose({ initChart })
</script>

<template>
  <div ref="chartRef" :style="{ height: height, width: '100%' }"></div>
</template>