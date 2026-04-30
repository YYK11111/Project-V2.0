# 最近成功登录用户省份分布地图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在系统首页用中国省级地图展示“全历史每个账号最近一次成功登录地点推断出的省份分布”，并保留未知数据列表。

**Architecture:** 后端新增专用登录省份分布接口，不改变现有 `getUserAreaList`。服务层先按账号取最近成功登录记录，再在 TypeScript 中归一化省份并聚合。前端新增首页专用地图组件，复用现有本地 `china.json` 和 `echarts`，首页从柱状图切换到地图。

**Tech Stack:** NestJS 11, TypeORM, Jest, Vue 3 `<script setup>`, Vite, ECharts 6, Vitest, vue-tsc。

---

## File Structure

- Modify: `nest-admin/src/modules/loginLogs/service.ts`
  - 新增 `getUserLoginProvinceList()`。
  - 新增省份清单和 `normalizeLoginProvince()` 私有方法。
  - 使用 TypeORM 查询成功登录日志并按账号取最近记录。
- Modify: `nest-admin/src/modules/loginLogs/controller.ts`
  - 新增 `GET /system/loginLogs/getUserLoginProvinceList`。
- Modify: `nest-admin/src/modules/loginLogs/service.spec.ts`
  - 新增省份归一化、成功登录、账号去重测试。
- Modify: `nest-admin-frontend/src/views/systemMonitor/loginLog/api.ts`
  - 新增 `getUserLoginProvinceList` API 方法。
- Modify: `nest-admin-frontend/src/views/index/api.ts`
  - 新增首页专用 `getAdminUserLoginProvinceList()`。
- Create: `nest-admin-frontend/src/views/index/components/ChartChinaMap.vue`
  - 首页专用中国地图组件。
- Modify: `nest-admin-frontend/src/views/index/adminindex.vue`
  - 替换地区柱状图为地图组件。
- Modify: `nest-admin-frontend/src/views/index/adminindex.structure.spec.ts`
  - 更新首页结构断言。

---

### Task 1: 后端单元测试定义新统计口径

**Files:**
- Modify: `nest-admin/src/modules/loginLogs/service.spec.ts`
- Modify later: `nest-admin/src/modules/loginLogs/service.ts`

- [ ] **Step 1: 写失败测试**

将 `nest-admin/src/modules/loginLogs/service.spec.ts` 替换为以下内容：

```ts
import { BoolNum } from "src/common/type/base";
import { LoginLogsService } from "./service";

interface RawChartRow {
  date?: string;
  num?: number;
  account?: string;
  address?: string | null;
  createTime?: string;
}

describe("LoginLogsService charts", () => {
  function createService(rawRows: RawChartRow[] = []) {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      distinctOn: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rawRows),
    };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new LoginLogsService(repository as never, {} as never);

    return { service, queryBuilder };
  }

  it("访问趋势未传时间范围时默认返回最近 7 天数据", async () => {
    const { service, queryBuilder } = createService([]);

    const result = await service.getVisitedNumChart({});

    expect(result).toHaveLength(7);
    expect(result.every((item) => typeof item.date === "string")).toBe(true);
    expect(result.every((item) => item.num === 0)).toBe(true);
    expect(queryBuilder.where).toHaveBeenCalledWith(
      "DATE(LoginLog.createTime) BETWEEN :beginTime AND :endTime",
      expect.objectContaining({
        beginTime: expect.any(String),
        endTime: expect.any(String),
      }),
    );
  });

  it("用户地区分布应保留本地登录数据", async () => {
    const { service, queryBuilder } = createService([
      { address: "本地", num: 91 },
    ]);

    await expect(service.getUserAreaList({} as never)).resolves.toEqual([
      { name: "本地", value: 91 },
    ]);
    expect(queryBuilder.where).toHaveBeenCalledWith(
      "LoginLog.address IS NOT NULL AND LoginLog.address != ''",
    );
  });

  it("最近成功登录省份分布按账号去重并归一化省份", async () => {
    const { service } = createService([
      { account: "alice", address: "广东省深圳市", createTime: "2026-04-30 10:00:00" },
      { account: "bob", address: "北京", createTime: "2026-04-30 09:00:00" },
      { account: "carol", address: "北京市", createTime: "2026-04-30 08:00:00" },
      { account: "dave", address: "浙江杭州", createTime: "2026-04-30 07:00:00" },
      { account: "eric", address: "本地", createTime: "2026-04-30 06:00:00" },
      { account: "frank", address: null, createTime: "2026-04-30 05:00:00" },
    ]);

    await expect(service.getUserLoginProvinceList()).resolves.toEqual([
      { name: "北京", value: 2 },
      { name: "未知", value: 2 },
      { name: "广东", value: 1 },
      { name: "浙江", value: 1 },
    ]);
  });

  it("最近成功登录省份分布只查询成功登录且账号非空日志", async () => {
    const { service, queryBuilder } = createService([]);

    await service.getUserLoginProvinceList();

    expect(queryBuilder.where).toHaveBeenCalledWith(
      "LoginLog.isSuccess = :isSuccess",
      { isSuccess: BoolNum.Yes },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "LoginLog.account IS NOT NULL AND LoginLog.account != ''",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith({
      "LoginLog.account": "ASC",
      "LoginLog.createTime": "DESC",
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- loginLogs/service.spec.ts --runInBand`

Workdir: `nest-admin`

Expected: FAIL，报错包含 `service.getUserLoginProvinceList is not a function`。

---

### Task 2: 实现后端登录省份统计服务和接口

**Files:**
- Modify: `nest-admin/src/modules/loginLogs/service.ts`
- Modify: `nest-admin/src/modules/loginLogs/controller.ts`

- [ ] **Step 1: 修改服务实现**

在 `nest-admin/src/modules/loginLogs/service.ts` 中按以下方式修改：

```ts
import { Injectable } from "@nestjs/common";
import { LoginLogDto } from "./dto";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  FindManyOptions,
  Like,
  Raw,
  Repository,
  UpdateResult,
} from "typeorm";
import { LoginLog } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { getSystem, getBrowser } from "src/common/utils/common";
import dayjs from "dayjs";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { BoolNum } from "src/common/type/base";

interface ProvinceStatItem {
  name: string;
  value: number;
}

interface LoginProvinceRow {
  account: string;
  address: string | null;
  createTime: Date | string;
}

const unknownProvinceName = "未知";

const provinceNames = [
  "黑龙江",
  "内蒙古",
  "北京",
  "天津",
  "上海",
  "重庆",
  "河北",
  "山西",
  "辽宁",
  "吉林",
  "江苏",
  "浙江",
  "安徽",
  "福建",
  "江西",
  "山东",
  "河南",
  "湖北",
  "湖南",
  "广东",
  "广西",
  "海南",
  "四川",
  "贵州",
  "云南",
  "西藏",
  "陕西",
  "甘肃",
  "青海",
  "宁夏",
  "新疆",
  "台湾",
  "香港",
  "澳门",
];
```

删除未使用的 `Between`、`Like`、`Raw`、`UpdateResult`、`catchError`、`firstValueFrom`、`AxiosError` 导入。如果文件实际仍使用其中任意导入，则只删除未使用项。

在 `LoginLogsService` 类中追加方法：

```ts
  async getUserLoginProvinceList(): Promise<ProvinceStatItem[]> {
    const rows = await this.repository
      .createQueryBuilder("LoginLog")
      .select("LoginLog.account", "account")
      .addSelect("LoginLog.address", "address")
      .addSelect("LoginLog.createTime", "createTime")
      .where("LoginLog.isSuccess = :isSuccess", { isSuccess: BoolNum.Yes })
      .andWhere("LoginLog.account IS NOT NULL AND LoginLog.account != ''")
      .orderBy({
        "LoginLog.account": "ASC",
        "LoginLog.createTime": "DESC",
      })
      .getRawMany<LoginProvinceRow>();

    const latestByAccount = new Map<string, LoginProvinceRow>();
    rows.forEach((row) => {
      if (!latestByAccount.has(row.account)) {
        latestByAccount.set(row.account, row);
      }
    });

    const provinceCount = new Map<string, number>();
    latestByAccount.forEach((row) => {
      const provinceName = this.normalizeLoginProvince(row.address);
      provinceCount.set(provinceName, (provinceCount.get(provinceName) || 0) + 1);
    });

    return Array.from(provinceCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((current, next) => {
        if (next.value !== current.value) {
          return next.value - current.value;
        }
        return current.name.localeCompare(next.name, "zh-Hans-CN");
      });
  }

  private normalizeLoginProvince(address?: string | null): string {
    const normalizedAddress = String(address || "").trim();
    if (!normalizedAddress || normalizedAddress === "本地") {
      return unknownProvinceName;
    }

    const compactAddress = normalizedAddress.replace(/\s/g, "");
    const matchedProvince = provinceNames.find((provinceName) =>
      compactAddress.includes(provinceName),
    );

    return matchedProvince || unknownProvinceName;
  }
```

- [ ] **Step 2: 修改控制器新增路由**

在 `nest-admin/src/modules/loginLogs/controller.ts` 的 `LoginLogsController` 类中追加：

```ts
  /**
   * 最近成功登录用户省份分布
   * @returns
   */
  @Get("getUserLoginProvinceList")
  async getUserLoginProvinceList() {
    return await this.service.getUserLoginProvinceList();
  }
```

- [ ] **Step 3: 运行后端单元测试确认通过**

Run: `npm run test -- loginLogs/service.spec.ts --runInBand`

Workdir: `nest-admin`

Expected: PASS，`LoginLogsService charts` 全部通过。

---

### Task 3: 前端 API 增加新接口包装

**Files:**
- Modify: `nest-admin-frontend/src/views/systemMonitor/loginLog/api.ts`
- Modify: `nest-admin-frontend/src/views/index/api.ts`

- [ ] **Step 1: 修改登录日志 API**

在 `nest-admin-frontend/src/views/systemMonitor/loginLog/api.ts` 末尾追加：

```ts
// 获取最近成功登录用户省份分布
export const getUserLoginProvinceList = () => get(`${serve}/getUserLoginProvinceList`)
```

- [ ] **Step 2: 修改首页 API 导入和导出**

将 `nest-admin-frontend/src/views/index/api.ts` 的登录日志 API 导入改为：

```ts
import { getUserAreaList, getUserLoginProvinceList, getVisitedNumChart } from '@/views/systemMonitor/loginLog/api'
```

在文件末尾追加：

```ts
export async function getAdminUserLoginProvinceList(): Promise<AdminChartPoint[]> {
  return normalizeChartList(await getUserLoginProvinceList())
}
```

- [ ] **Step 3: 运行相关前端结构测试**

Run: `npm run test:unit -- src/views/index/adminindex.structure.spec.ts`

Workdir: `nest-admin-frontend`

Expected: 当前可能仍 PASS，因为首页还未使用新 API；如果因为类型或导入失败而 FAIL，先检查导入路径。

---

### Task 4: 新增首页中国地图组件

**Files:**
- Create: `nest-admin-frontend/src/views/index/components/ChartChinaMap.vue`

- [ ] **Step 1: 创建组件文件**

创建 `nest-admin-frontend/src/views/index/components/ChartChinaMap.vue`：

```vue
<script setup lang="ts">
import * as echarts from 'echarts'
import chinaJson from '@/components/ChinaMap/china.json'
import Empty from '@/components/Empty.vue'

interface ProvinceChartItem {
  name?: string | number
  value?: string | number
}

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    data?: ProvinceChartItem[]
  }>(),
  {
    title: '最近成功登录用户省份分布',
    description: '按账号去重，取每个账号全历史最近一次成功登录地点推断。',
    data: () => [],
  },
)

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const provinceNames = [
  '北京',
  '天津',
  '上海',
  '重庆',
  '河北',
  '山西',
  '辽宁',
  '吉林',
  '黑龙江',
  '江苏',
  '浙江',
  '安徽',
  '福建',
  '江西',
  '山东',
  '河南',
  '湖北',
  '湖南',
  '广东',
  '广西',
  '海南',
  '四川',
  '贵州',
  '云南',
  '西藏',
  '陕西',
  '甘肃',
  '青海',
  '宁夏',
  '新疆',
  '台湾',
  '香港',
  '澳门',
]

const provinceNameSet = new Set(provinceNames)

const normalizedData = computed(() =>
  props.data
    .map((item) => ({
      name: String(item.name || '').trim(),
      value: Number(item.value || 0),
    }))
    .filter((item) => item.name && item.value > 0),
)

const mapData = computed(() => normalizedData.value.filter((item) => provinceNameSet.has(item.name)))

const otherData = computed(() => normalizedData.value.filter((item) => !provinceNameSet.has(item.name)))

const totalValue = computed(() => normalizedData.value.reduce((sum, item) => sum + item.value, 0))

function renderChart() {
  if (!chartRef.value || !mapData.value.length) {
    return
  }

  echarts.registerMap('china', chinaJson)
  chart ||= echarts.init(chartRef.value)

  const maxValue = Math.max(...mapData.value.map((item) => item.value), 1)
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>用户数：{c}',
    },
    visualMap: {
      min: 0,
      max: maxValue,
      left: 12,
      bottom: 12,
      text: ['高', '低'],
      calculable: false,
      inRange: {
        color: ['#e8f3ff', '#79bbff', '#337ecc'],
      },
    },
    series: [
      {
        name: '最近成功登录用户数',
        type: 'map',
        map: 'china',
        roam: false,
        label: {
          show: true,
          color: '#606266',
          fontSize: 10,
        },
        emphasis: {
          label: {
            color: '#303133',
          },
          itemStyle: {
            areaColor: '#f3d19e',
          },
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1,
          areaColor: '#f4f7fb',
        },
        data: mapData.value,
      },
    ],
  })
}

function disposeChart() {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
}

watch(
  mapData,
  () => {
    nextTick(() => {
      if (!mapData.value.length) {
        disposeChart()
        return
      }
      renderChart()
    })
  },
  { deep: true },
)

onMounted(() => {
  renderChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chart?.resize()
    })
    resizeObserver.observe(chartRef.value)
  }
})

onBeforeUnmount(() => {
  disposeChart()
})
</script>

<template>
  <div class="Gcard china-map-card">
    <div class="GcardTitle">{{ title }}</div>
    <div class="map-description">{{ description }}</div>

    <div v-if="totalValue" class="map-content">
      <div v-if="mapData.length" ref="chartRef" class="map-chart"></div>
      <div v-else class="map-chart map-chart--empty">
        <Empty />
      </div>

      <div v-if="otherData.length" class="unknown-panel">
        <div class="unknown-title">无法上图</div>
        <div v-for="item in otherData" :key="item.name" class="unknown-item">
          <span>{{ item.name }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </div>

    <div v-else class="map-empty">
      <Empty />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.china-map-card {
  min-height: 472px;
}

.map-description {
  margin-top: -4px;
  color: var(--FontBlack5);
  font-size: 13px;
  line-height: 1.6;
}

.map-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  gap: 16px;
  align-items: stretch;
  margin-top: 12px;
}

.map-chart {
  min-height: 388px;
  min-width: 0;
}

.map-chart--empty,
.map-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-empty {
  min-height: 388px;
}

.unknown-panel {
  align-self: center;
  padding: 12px;
  border: 1px solid var(--BorderBlack10);
  border-radius: var(--Radius);
  background: linear-gradient(180deg, rgba(64, 158, 255, 0.06), rgba(64, 158, 255, 0.02));
}

.unknown-title {
  margin-bottom: 10px;
  color: var(--FontBlack5);
  font-size: 12px;
}

.unknown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--FontBlack2);
  line-height: 1.8;
}

.unknown-item strong {
  color: var(--Color);
}

@media (max-width: 768px) {
  .map-content {
    grid-template-columns: 1fr;
  }

  .unknown-panel {
    align-self: stretch;
  }
}
</style>
```

- [ ] **Step 2: 运行类型检查确认当前组件可编译**

Run: `npm run type-check`

Workdir: `nest-admin-frontend`

Expected: PASS；若报 `china.json` 类型问题，新增或复用项目已有 JSON 模块声明，不要使用 `any` 或 `@ts-ignore`。

---

### Task 5: 首页接入中国地图组件

**Files:**
- Modify: `nest-admin-frontend/src/views/index/adminindex.vue`
- Modify: `nest-admin-frontend/src/views/index/adminindex.structure.spec.ts`

- [ ] **Step 1: 修改首页脚本**

在 `nest-admin-frontend/src/views/index/adminindex.vue` 顶部导入组件，并新增数据源：

```ts
import ChartChinaMap from './components/ChartChinaMap.vue'
```

在 `const unread = ...` 后新增：

```ts
const provinceDistribution = ref<AdminChartPoint[]>([])
```

将 `loadHomeData()` 中的 `Promise.all` 改为：

```ts
    const [countRes, unreadRes, provinceRes] = await Promise.all([
      api.getAdminIndexSummary(),
      api.getHomeUnreadCount(),
      api.getAdminUserLoginProvinceList(),
    ])
    indexCounts.value = countRes
    unread.value = unreadRes
    provinceDistribution.value = provinceRes
```

删除 `dealAreaDistribution()` 函数，因为地区柱状图不再使用。

- [ ] **Step 2: 修改首页模板**

将原地区柱状图：

```vue
      <RequestChartTable
        title="用户地区分布"
        type="barChart"
        :is-page-query="false"
        :request="api.getAdminUserAreaList"
        :legend="['用户数']"
        :deal-data-fun="dealAreaDistribution"
      />
```

替换为：

```vue
      <ChartChinaMap :data="provinceDistribution" />
```

- [ ] **Step 3: 更新结构测试**

将 `nest-admin-frontend/src/views/index/adminindex.structure.spec.ts` 第一个测试中的：

```ts
    expect(source).toContain('用户地区分布')
```

改为：

```ts
    expect(source).toContain('最近成功登录用户省份分布')
    expect(source).toContain('ChartChinaMap')
```

- [ ] **Step 4: 运行首页结构测试**

Run: `npm run test:unit -- src/views/index/adminindex.structure.spec.ts`

Workdir: `nest-admin-frontend`

Expected: PASS。

---

### Task 6: 全量相关验证

**Files:**
- No file changes expected.

- [ ] **Step 1: 后端 lint**

Run: `npm run lint`

Workdir: `nest-admin`

Expected: PASS。注意该脚本带 `--fix`，如果自动格式化了文件，检查变更后再继续。

- [ ] **Step 2: 后端相关 Jest**

Run: `npm run test -- loginLogs/service.spec.ts --runInBand`

Workdir: `nest-admin`

Expected: PASS。

- [ ] **Step 3: 前端类型检查**

Run: `npm run type-check`

Workdir: `nest-admin-frontend`

Expected: PASS。

- [ ] **Step 4: 前端首页结构测试**

Run: `npm run test:unit -- src/views/index/adminindex.structure.spec.ts`

Workdir: `nest-admin-frontend`

Expected: PASS。

- [ ] **Step 5: API 契约检查**

Run: `npm run check:api-contract`

Workdir: repository root `/Users/yyk/工作/代码开发/Project-V2.0`

Expected: PASS。

---

## Self-Review

- Spec coverage: 新增接口、成功登录过滤、账号去重、最近记录、省份归一化、地图展示、未知列表、本地 `china.json`、不改用户表、不改旧接口均有任务覆盖。
- Placeholder scan: 未保留 TBD/TODO/implement later；代码步骤包含具体路径和具体代码。
- Type consistency: 后端返回类型统一为 `{ name: string; value: number }[]`；前端使用 `AdminChartPoint[]` 进入 `ChartChinaMap`，组件内部转换为明确的 `name/value`。
