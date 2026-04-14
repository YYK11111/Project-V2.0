<script setup lang="ts">
// @ts-nocheck
import * as api from './api'
import { getVisitedNumChart, getUserAreaList } from '@/views/systemMonitor/loginLog/api'
import { getList } from '@/views/system/notices/api'
import { useUserStore } from '@/stores/user'
let userStore = useUserStore()

import hljs from 'highlight.js'
// import 'highlight.js/styles/default.min.css'
import 'highlight.js/styles/dark.min.css'

import RELEASE from '../../../RELEASE.md?raw'

const greeting = ref('')
function greetingFun() {
  let date = new Date()
  let hour = date.getHours()
  if (0 <= hour && hour < 8) {
    greeting.value = '早上好'
  } else if (8 <= hour && hour < 12) {
    greeting.value = '上午好'
  } else if (12 <= hour && hour < 14) {
    greeting.value = '中午好'
  } else if (14 <= hour && hour < 18) {
    greeting.value = '下午好'
  } else if (18 <= hour && hour < 24) {
    greeting.value = '晚上好'
  }
}
greetingFun()

const pannelList = ref([])
api.getIndexCountData().then(({ data }) => {
  pannelList.value = [
    {
      title: 'Star量',
      tips: 'Gitee Star 的数量',
      value: data.stars,
      link: 'https://gitee.com/hixinla/nest-admin',
    },
    {
      title: '访问量-2026',
      tips: '2026年度登录成功的用户数量',
      value: data.visitedNum,
      link: { name: 'loginLog' },
      title1: '较昨日',
      value1: data.visitedNumComparedYd,
    },
    {
      title: '活跃量',
      tips: '系统用户实时在线数量',
      value: data.onlineUserNum,
      link: { name: 'onlineUser' },
    },
  ]
})

// 数据趋势 数据处理
function dealDataTrend(data, series, xData) {
  xData.length = 0
  series.length = 0
  let _data = [[]]
  data.forEach((element) => {
    xData.push(element.date)
    _data[0].push(element.num)
  })
  series.push(..._data)
}
</script>

<template>
  <div class="grid grid-cols-[3fr_1fr] --Gap h-full">
    <div class="!overflow-auto">
      <div class="flexBetween --Gap">
        <div class="userinfo flex flexAuto flexCenter Gcard pointer" @click="$router.push('/user/profile')">
          <div class="portrait">
            <img class="portraitImg" :src="userStore.avatar" alt="" v-if="userStore.avatar" />
          </div>
          <div style="max-width: 220px">
            <el-tooltip
              :content="userStore.name"
              placement="top-end"
              effect="light"
              :disabled="userStore.name?.length < 7">
              <div class="wel ellipsis --Color">{{ '过年好' || greeting }}，{{ userStore.name }}</div>
            </el-tooltip>
            <div style="color: var(--FontBlack5)">今天又是充满活力的一天!</div>
          </div>
        </div>
        <div class="Gcard --Gap grid flex1 items-center">
          <div>
            <span class="--FontBlack5">更新时间：</span>
            <span class="--FontBlack2 blod">{{ sysConfig._packDateTime }}</span>
          </div>
          <div>
            <span class="--FontBlack5">系统版本：</span>
            <span class="--FontBlack2 blod">{{ RELEASE.match('## (.*)')?.[1] }}</span>
          </div>
        </div>
      </div>
      <CardGroup class="--MarginT" :data="pannelList"></CardGroup>

      <div class="gridCard --MarginT">
        <RequestChartTable class="!overflow-auto" title="用户地区分布" :request="getUserAreaList">
          <template #="{ data }"> <ChinaMap :data="data"></ChinaMap></template>
        </RequestChartTable>

        <RequestChartTable
          class="!overflow-auto"
          title="访问趋势"
          type="lineChart"
          isTimeQuery
          :legend="['用户数']"
          :request="getVisitedNumChart"
          :dealDataFun="dealDataTrend"></RequestChartTable>
      </div>

      <div class="gridCard --MarginT">
        <div class="Gcard flexCol stickyPadding">
          <div class="GcardTitle stickyTop !top-(--Padding)">项目动态</div>
          <ScrollLoadList ref="ScrollLoadList" :request="getList" keywords="title">
            <template #item="{ item }">
              <div class="list-item Gmargin-b flexBetween Gcard" style="background: var(--ColorLight10)">
                <div class="title ellipsis">{{ item.content }}</div>
                <div class="time">{{ item.createTime }}</div>
              </div>
            </template>
          </ScrollLoadList>
        </div>
      </div>
    </div>

    <div class="Gcard mt0 !overflow-auto stickyPadding">
      <div class="GcardTitle stickyTop !top-(--Padding)">更新日志</div>
      <div>
        <pre v-html="hljs.highlight(RELEASE || '', { language: 'markdown' }).value"></pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.userinfo {
  &:hover {
    color: var(--Color);
  }
  .portrait {
    position: relative;
    padding-right: 10px;
    .portraitImg {
      display: block;
      margin: 0 auto;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 1px solid var(--BorderBlack10);
    }
  }
  .wel {
    position: relative;
    font-size: 20px;
    font-weight: bold;
    margin: 2px 0 16px;
    width: 100%;
  }
}

.gridCard {
  display: grid;
  grid-template: auto / 1fr 1fr;
  gap: var(--Margin);
  > .Gcard {
    margin-top: 0;
  }
}

:deep() {
  .hljs-keyword,
  .hljs-link,
  .hljs-literal,
  .hljs-section,
  .hljs-selector-tag {
    color: var(--Color);
  }
}
</style>
