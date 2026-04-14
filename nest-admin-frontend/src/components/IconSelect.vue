<template>
  <div class="IconSelect">
    <el-input
      v-model="name"
      class="mb5"
      clearable
      placeholder="请输入图标名称"
      @clear="filterIcons"
      @input="filterIcons">
      <template #suffix><el-icon-search class="el-icon-search el-input__icon" /></template>
    </el-input>
    <div class="iconGroupTitle">常用图标</div>
    <div class="iconList compact">
      <div v-for="(item, index) in commonIconList" :key="'common-' + index" @click="selectedIcon(item.value)">
        <svg-icon :icon="item.value" style="height: 30px; width: 16px" />
        <span class="ml10">{{ item.label }}</span>
      </div>
    </div>
    <div class="iconGroupTitle">本地 SVG</div>
    <div class="iconList">
      <div v-for="(item, index) in svgIconList" :key="'svg-' + index" @click="selectedIcon(item)">
        <svg-icon :icon="item" style="height: 30px; width: 16px" />
        <span class="ml10">{{ item }}</span>
      </div>
    </div>
    <div class="iconGroupTitle">Element Plus</div>
    <div class="iconList">
      <div v-for="(item, index) in elementIconList" :key="'el-' + index" @click="selectedIcon(item.value)">
        <svg-icon :icon="item.value" style="height: 30px; width: 16px" />
        <span class="ml10">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script>
// import icons from './requireIcons'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
let icons = import.meta.glob('./../assets/icons/svg/**/*.svg')
let svgIcons = []
for (const key in icons) {
  if (Object.hasOwnProperty.call(icons, key)) {
    let reg = 'svg/'
    svgIcons.push(key.slice(key.lastIndexOf(reg) + reg.length, -4).replace('/', '-'))
  }
}

const elementIcons = Object.keys(ElementPlusIconsVue)
  .sort()
  .map((name) => ({
    label: name,
    value: `el:${name}`,
  }))

const commonIconList = [
  'House',
  'Setting',
  'Menu',
  'User',
  'UserFilled',
  'Files',
  'Reading',
  'Document',
  'FolderOpened',
  'List',
  'Bell',
  'Monitor',
  'DataAnalysis',
  'Share',
  'Clock',
  'Flag',
  'WarningFilled',
  'Switch',
  'TrendCharts',
  'Tools',
].map((name) => ({ label: name, value: `el:${name}` }))

export default {
  name: 'IconSelect',
  data() {
    return {
      name: '',
      commonIconList,
      svgIconList: svgIcons,
      elementIconList: elementIcons,
    }
  },
  methods: {
    filterIcons() {
      const keyword = this.name?.toLowerCase?.() || ''
      this.commonIconList = commonIconList.filter((item) => item.label.toLowerCase().includes(keyword))
      this.svgIconList = svgIcons.filter((item) => item.toLowerCase().includes(keyword))
      this.elementIconList = elementIcons.filter((item) => item.label.toLowerCase().includes(keyword))
    },
    selectedIcon(name) {
      this.$emit('selected', name)
      document.body.click()
    },
    reset() {
      this.name = ''
      this.commonIconList = commonIconList
      this.svgIconList = svgIcons
      this.elementIconList = elementIcons
    },
  },
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.IconSelect {
  .iconGroupTitle {
    font-size: 12px;
    color: var(--FontBlack6);
    margin: 8px 0 4px;
  }
  .iconList {
    height: 200px;
    overflow-y: scroll;
    div {
      height: 30px;
      line-height: 30px;
      margin-bottom: -5px;
      cursor: pointer;
      width: 33%;
      float: left;
    }
    span {
      display: inline-block;
      vertical-align: -0.15em;
      fill: currentColor;
      overflow: hidden;
    }
  }
  .iconList.compact {
    height: auto;
    max-height: 110px;
  }
}
</style>
