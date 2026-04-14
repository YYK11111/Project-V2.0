<script>
import { CountTo } from 'vue3-count-to'
export default {
  // 指标卡片组
  components: { CountTo },
  props: {
    // 数据列表
    data: {
      type: Array,
      default: () => [],
    },
    // isArrow: {
    //   type: Boolean,
    //   default: false
    // },
    defaultProps: {
      type: Object,
      default: () => ({
        title: 'title',
        tips: 'tips',
        value: 'value',
        title1: 'title1',
        value1: 'value1',
        noArrow: 'noArrow',
        link: 'link',
      }),
    },
  },
  data() {
    return {}
  },
  methods: {
    getClass(value) {
      let val = Number(value)
      if (val > 0) {
        return 'ascend'
      } else if (val < 0) {
        return 'descend'
      }
    },
    getArrow(value) {
      let val = Number(value)
      if (val > 0) {
        return '↑'
      } else if (val < 0) {
        return '↓'
      } else {
        return ''
      }
    },
  },
}
</script>

<template>
  <ul class="CardGroup flex">
    <li v-for="(row, index) in data" :key="index" class="card-index-li Gcard">
      <div class="label">
        <span>{{ row[defaultProps.title] }}</span>

        <el-icon-ArrowRightBold
          class="el-icon-ArrowRightBold floatRight pointer"
          v-if="row[defaultProps.link] !== undefined"
          @click="$sdk.goLink(row[defaultProps.link], $router)"></el-icon-ArrowRightBold>

        <div class="tips ellipsis mt10" v-if="row[defaultProps.tips] !== undefined">
          <el-popover trigger="hover" :content="row[defaultProps.tips]" placement="top-start">
            <template #reference>
              {{ row[defaultProps.tips] }}
            </template>
          </el-popover>
        </div>
      </div>
      <div class="mt10 value">
        <CountTo class="view-item-num" :start-val="0" :end-val="+row[defaultProps.value] || 0"></CountTo>
      </div>
      <div class="mt15" v-if="row[defaultProps.title1] !== undefined || row[defaultProps.value1] !== undefined">
        {{ row[defaultProps.title1] }}
        <span class="floatRight" :class="row[defaultProps.noArrow] || getClass(row[defaultProps.value1])">
          {{ row[defaultProps.noArrow] ? '' : getArrow(row[defaultProps.value1]) }}
          {{ Math.abs(row[defaultProps.value1]) || 0 }}
        </span>
      </div>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
// 指标卡片
.CardGroup {
  display: flex;
  flex-wrap: wrap;
  gap: var(--Margin);
}
.card-index-li {
  position: relative;
  flex: auto;
  min-width: 200px;
  // background: var(--cardBg);
  // border-radius: var(--RadiusBig);
  // border: 1px solid var(--BorderBlack10);
  line-height: 1;
  padding: 22px 20px;
  .tips {
    font-size: 11px;
    color: var(--FontBlack6);
  }
  .el-icon-ArrowRightBold {
    font-size: 12px;
    color: var(--FontBlack6);
  }
  // // 6个以上的换行 需定宽并使用 media query
  // &:nth-child(n + 8) {
  //   margin-top: var(--Margin);ç
  // }
  .card-icon {
    position: absolute;
    top: 0;
    right: 0;
  }
  .label {
    position: relative;
    font-size: 14px;
  }
  .value,
  .value2 {
    font-size: 20px;
    font-weight: bold;
  }
  .value2 {
    font-size: 24px;
    line-height: 1.15;
  }
  .el-icon-warning {
    color: var(--FontBlack6);
  }
  .icon-arrow {
    position: absolute;
  }

  .el-radio,
  .el-checkbox {
    position: relative;
    float: right;
    margin-right: 0;
    top: -8px;
  }

  .descend {
    color: green;
  }

  .ascend {
    color: red;
  }
}
</style>
