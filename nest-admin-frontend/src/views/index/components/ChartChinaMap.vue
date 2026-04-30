<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption, EChartsType } from 'echarts'
import Empty from '@/components/Empty.vue'
import chinaJson from '@/components/ChinaMap/china.json'

interface ChartChinaMapDataItem {
  name?: string | number
  value?: string | number
}

interface ChinaMapFeature {
  properties?: {
    name?: string
  }
}

interface ChinaMapJson {
  features?: ChinaMapFeature[]
}

interface MapDataItem {
  name: string
  value: number
}

interface UnmappedDataItem {
  name: string
  value: number
}

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    data?: ChartChinaMapDataItem[]
  }>(),
  {
    title: '最近成功登录用户省份分布',
    description: '按账号去重，取每个账号全历史最近一次成功登录地点推断。',
    data: () => [],
  },
)

const chartRef = ref<HTMLDivElement | null>(null)
const chartInstance = shallowRef<EChartsType | null>(null)
let resizeObserver: ResizeObserver | null = null
let observedChartElement: HTMLDivElement | null = null

const chinaMapName = 'homeChinaMap'
const provinceNames = (chinaJson as ChinaMapJson).features?.map((feature) => feature.properties?.name).filter((name): name is string => Boolean(name)) || []
const provinceNameSet = new Set(provinceNames)

const normalizedProvinceMap = provinceNames.reduce<Record<string, string>>((result, provinceName) => {
  result[getNormalizedProvinceName(provinceName)] = provinceName
  result[provinceName] = provinceName
  return result
}, {})

const mapData = computed<MapDataItem[]>(() => {
  const dataMap = new Map<string, number>()

  props.data.forEach((item) => {
    const mapName = getMatchedProvinceName(item.name)
    if (!mapName) return

    dataMap.set(mapName, (dataMap.get(mapName) || 0) + getNumberValue(item.value))
  })

  return Array.from(dataMap.entries()).map(([name, value]) => ({ name, value }))
})

const unmappedData = computed<UnmappedDataItem[]>(() => {
  return props.data
    .filter((item) => !getMatchedProvinceName(item.name))
    .map((item) => ({
      name: getDisplayName(item.name),
      value: getNumberValue(item.value),
    }))
})

const hasData = computed(() => props.data.length > 0)
const hasMapData = computed(() => mapData.value.length > 0)
const hasChartValue = computed(() => mapData.value.some((item) => item.value > 0))
const visualMax = computed(() => Math.max(1, ...mapData.value.map((item) => item.value)))

watch(
  () => props.data,
  () => {
    nextTick(() => {
      if (hasMapData.value) {
        renderChart()
        return
      }

      destroyChart()
    })
  },
  { deep: true },
)

onMounted(() => {
  echarts.registerMap(chinaMapName, chinaJson as Parameters<typeof echarts.registerMap>[1])
  nextTick(() => {
    renderChart()
  })
})

onBeforeUnmount(() => {
  destroyChart()
})

function getDisplayName(name?: string | number): string {
  const text = String(name ?? '').trim()
  return text || '未知'
}

function getNumberValue(value?: string | number): number {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function getNormalizedProvinceName(name: string): string {
  return name
    .trim()
    .replace(/特别行政区$/, '')
    .replace(/维吾尔自治区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/自治区$/, '')
    .replace(/[省市]$/, '')
}

function getMatchedProvinceName(name?: string | number): string | null {
  const displayName = getDisplayName(name)
  if (provinceNameSet.has(displayName)) return displayName

  return normalizedProvinceMap[getNormalizedProvinceName(displayName)] || null
}

function disconnectResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
  observedChartElement = null
}

function observeChartElement() {
  if (!chartRef.value) return
  if (resizeObserver && observedChartElement === chartRef.value) return

  disconnectResizeObserver()

  resizeObserver = new ResizeObserver(() => {
    chartInstance.value?.resize()
  })
  resizeObserver.observe(chartRef.value)
  observedChartElement = chartRef.value
}

function destroyChart() {
  disconnectResizeObserver()
  chartInstance.value?.dispose()
  chartInstance.value = null
}

function renderChart() {
  if (!chartRef.value || !hasMapData.value) {
    destroyChart()
    return
  }

  observeChartElement()

  if (!chartInstance.value) {
    chartInstance.value = echarts.init(chartRef.value)
  }

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const itemName = params.name || ''
        const itemValue = typeof params.value === 'number' ? params.value : 0
        return `${itemName}<br />登录用户：${itemValue}`
      },
    },
    visualMap: {
      min: 0,
      max: visualMax.value,
      left: 12,
      bottom: 18,
      itemWidth: 10,
      itemHeight: 80,
      text: ['高', '低'],
      textStyle: {
        color: '#86909c',
        fontSize: 12,
      },
      inRange: {
        color: ['#eef5ff', '#8bb9ff', '#2f7df6'],
      },
    },
    series: [
      {
        name: props.title,
        type: 'map',
        map: chinaMapName,
        roam: false,
        zoom: 1.1,
        data: mapData.value,
        label: {
          show: true,
          color: '#4e5969',
          fontSize: 10,
        },
        itemStyle: {
          areaColor: '#f4f7fb',
          borderColor: '#d8e2ef',
          borderWidth: 1,
        },
        emphasis: {
          label: {
            color: '#1d2129',
            fontWeight: 600,
          },
          itemStyle: {
            areaColor: '#79a8ff',
            borderColor: '#2f7df6',
          },
        },
      },
    ],
  }

  chartInstance.value.setOption(option, true)
  nextTick(() => {
    chartInstance.value?.resize()
  })
}
</script>

<template>
  <div class="chart-china-map">
    <div class="map-header">
      <div>
        <div class="map-title">{{ title }}</div>
        <div class="map-description">{{ description }}</div>
      </div>
      <div v-if="hasChartValue" class="map-total">{{ visualMax }}<span>峰值</span></div>
    </div>

    <div v-if="hasMapData" class="map-content">
      <div ref="chartRef" class="map-chart"></div>

      <aside class="unmapped-panel">
        <div class="unmapped-head">
          <span>无法上图</span>
          <em>{{ unmappedData.length }}</em>
        </div>
        <div v-if="unmappedData.length" class="unmapped-list">
          <div v-for="(item, index) in unmappedData" :key="`${item.name}-${index}`" class="unmapped-item">
            <span class="unmapped-name">{{ item.name }}</span>
            <span class="unmapped-value">{{ item.value }}</span>
          </div>
        </div>
        <div v-else class="unmapped-empty">全部数据已匹配省级地图</div>
      </aside>
    </div>

    <div v-else-if="hasData" class="map-unmapped-only">
      <Empty description="暂无可上图省份数据" :image-size="90" />

      <aside class="unmapped-panel">
        <div class="unmapped-head">
          <span>无法上图</span>
          <em>{{ unmappedData.length }}</em>
        </div>
        <div class="unmapped-list">
          <div v-for="(item, index) in unmappedData" :key="`${item.name}-${index}`" class="unmapped-item">
            <span class="unmapped-name">{{ item.name }}</span>
            <span class="unmapped-value">{{ item.value }}</span>
          </div>
        </div>
      </aside>
    </div>

    <div v-else class="map-empty centerCenter">
      <Empty description="暂无登录省份数据" :image-size="90" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart-china-map {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-height: 420px;
}

.map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.map-title {
  color: var(--FontBlack1);
  font-size: 16px;
  font-weight: 700;
}

.map-description {
  margin-top: 6px;
  color: var(--FontBlack5);
  font-size: 13px;
  line-height: 20px;
}

.map-total {
  min-width: 74px;
  padding: 8px 12px;
  border: 1px solid var(--BorderBlack10);
  border-radius: 12px;
  background: #f7faff;
  color: var(--Color);
  font-size: 22px;
  font-weight: 700;
  text-align: center;

  span {
    display: block;
    margin-top: 2px;
    color: var(--FontBlack5);
    font-size: 12px;
    font-weight: 400;
  }
}

.map-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: var(--Margin);
  flex: 1;
  min-height: 340px;
}

.map-unmapped-only {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  align-items: center;
  gap: var(--Margin);
  min-height: 320px;
}

.map-chart {
  width: 100%;
  min-width: 0;
  min-height: 340px;
}

.unmapped-panel {
  align-self: stretch;
  padding: 14px;
  border: 1px solid var(--BorderBlack10);
  border-radius: 12px;
  background: #fff;
}

.unmapped-head,
.unmapped-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.unmapped-head {
  color: var(--FontBlack1);
  font-weight: 700;

  em {
    min-width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #f2f3f5;
    color: var(--FontBlack5);
    font-style: normal;
    font-size: 12px;
    line-height: 24px;
    text-align: center;
  }
}

.unmapped-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.unmapped-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f8fa;
  color: var(--FontBlack2);
  font-size: 13px;
}

.unmapped-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unmapped-value {
  color: var(--Color);
  font-weight: 700;
}

.unmapped-empty {
  margin-top: 12px;
  color: var(--FontBlack5);
  font-size: 13px;
  line-height: 20px;
}

.map-empty {
  flex: 1;
  min-height: 320px;
}

@media (max-width: 960px) {
  .map-header,
  .map-content,
  .map-unmapped-only {
    grid-template-columns: 1fr;
  }

  .map-header {
    display: grid;
  }

  .map-total {
    justify-self: start;
  }

  .unmapped-panel {
    align-self: auto;
  }
}
</style>
