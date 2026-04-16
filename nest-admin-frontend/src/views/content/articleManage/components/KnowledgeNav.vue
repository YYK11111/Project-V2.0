<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { checkPermi } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const navItems = computed(() => [
  { label: '知识首页', path: '/content/articleManage/home', show: true },
  { label: '知识搜索', path: '/content/articleManage/search', show: true },
  { label: '后台管理', path: '/content/articleManage/manage', show: checkPermi(['business/articles/list']) },
  { label: '我的借阅', path: '/content/articleManage/myBorrows', show: checkPermi(['business/articleBorrows/my']) },
  { label: '借阅审批', path: '/content/articleManage/borrowApproval', show: checkPermi(['business/articleBorrows/pending']) },
  { label: 'AI检索调试', path: '/content/articleManage/aiRetrieveDebug', show: true },
])

function go(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="knowledge-nav Gcard">
    <div class="knowledge-nav__title">知识中心导航</div>
    <div class="knowledge-nav__actions">
      <el-button
        v-for="item in navItems"
        v-show="item.show"
        :key="item.path"
        :type="route.path === item.path ? 'primary' : 'default'"
        @click="go(item.path)">
        {{ item.label }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.knowledge-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.knowledge-nav__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.knowledge-nav__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
