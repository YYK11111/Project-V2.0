<template>
  <div v-if="!route.meta?.isHidden && !route?.isHidden">
    <!-- 叶子菜单：直接点击跳转 -->
    <app-link v-if="isLeafMenu(route)" :to="resolvePath(getLeafPath(route))">
      <el-menu-item :index="resolvePath(getLeafPath(route))">
        <div class="menu-title" :style="{ padding: `0px ${15 * level}px` }">
          <svg-icon v-if="route.meta?.icon" :icon="route.meta.icon" class="mr10" />
          {{ route.meta?.title || route.name }}
        </div>
      </el-menu-item>
    </app-link>

    <!-- 目录菜单：显示下拉 -->
    <el-sub-menu v-else-if="route.children && route.children.length > 0" :index="resolvePath(route.path)">
      <template #title>
        <div class="menu-title" :style="{ padding: `0px ${15 * level}px` }" v-if="route.meta">
          <svg-icon v-if="route.meta.icon" :icon="route.meta.icon" class="mr10" />
          {{ route.meta?.title || route.name }}
        </div>
      </template>
      <SidebarItem
        v-for="item in route.children"
        :key="item.path"
        :isNest="true"
        :level="~~level + 1"
        :route="item"
        :basePath="resolvePath(item.path)"
        class="nest-menu" />
    </el-sub-menu>
  </div>
</template>

<script>
import path from 'path-browserify'
import { isExternal } from '@/utils/validate'
import AppLink from './Link'
// import FixiOSBug from './FixiOSBug'

export default {
  components: { AppLink },
  // mixins: [FixiOSBug],
  props: {
    // route object
    route: {
      type: Object,
      required: true,
    },
    level: {
      type: [String, Number],
      default: 1,
    },
    isNest: {
      type: Boolean,
      default: false,
    },
    basePath: {
      type: String,
      default: '',
    },
  },
  data() {
    return {}
  },
  methods: {
    // 判断是否为叶子菜单（无下拉）
    isLeafMenu(route) {
      // 统一规则：没有子菜单，或所有子菜单都隐藏时，都按叶子菜单处理
      if (!route.children || route.children.length === 0) {
        return true
      }

      const visibleChildren = route.children.filter(c => !c.isHidden)
      return visibleChildren.length === 0
    },
    getLeafPath(route) {
      // 如果 route 或 route.path 不存在，返回 '/'
      if (!route || !route.path) {
        return '/'
      }
      
      // 确保 path 是绝对路径
      let targetPath = route.path.startsWith('/') ? route.path : '/' + route.path
      
      // 一级菜单
      if (this.level == 1) {
        // 如果有子菜单，检查是否有可见的
        if (route.children && route.children.length > 0) {
          const visibleChildren = route.children.filter(c => !c.isHidden)
          if (visibleChildren.length === 0) {
            // 所有子菜单都是隐藏的，返回自身 path
            return targetPath
          }
          // 有可见子菜单，不作为叶子菜单
          return '/'
        }
        // 没有子菜单，返回自身 path
        return targetPath
      }

      // 非一级菜单
      if (route.children && route.children.length > 0) {
        const visibleChildren = route.children.filter(c => !c.isHidden)
        if (visibleChildren.length === 0) {
          // 所有子菜单都是隐藏的，返回自身 path
          return targetPath
        }
        // 有可见子菜单，返回第一个可见子菜单的 path
        const firstVisible = route.children.find(c => !c.isHidden)
        if (firstVisible && firstVisible.path) {
          return firstVisible.path.startsWith('/') ? firstVisible.path : '/' + firstVisible.path
        }
        return targetPath
      }

      // 无子菜单，返回自身 path
      return targetPath
    },
    resolvePath(routePath, routeQuery) {
      // 如果 path 为空或无效，返回 '/'
      if (!routePath || routePath === '/') {
        return '/'
      }
      
      if (isExternal(routePath)) {
        return routePath
      }
      if (isExternal(this.basePath)) {
        return this.basePath
      }
      if (/^\//.test(routePath)) {
        return routePath
      }
      if (routeQuery) {
        let query = JSON.parse(routeQuery)
        return { path: path.resolve(this.basePath, routePath), query: query }
      }
      return path.resolve(this.basePath, routePath)
    },
  },
}
</script>
