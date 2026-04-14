<script>
import { getSessionList, getList, del } from './api'
export default {
  name: '',
  components: {
    MessageList: defineAsyncComponent(() => import('./MessageList')),
    ScrollLoadList: defineAsyncComponent(() => import('@/components/ScrollLoadList')),
  },
  data() {
    return { getSessionList, getList, loading: false, visiable: false, sessionId: '' }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    remove(id) {
      $sdk
        .confirm()
        .then(() => {
          this.loading = true
          return del(id)
        })
        .then((res) => {
          $sdk.msgSuccess('删除成功')
          this.visiable = false
          this.sessionId = ''
          this.$refs.ScrollLoadList.getList(1)
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
}
</script>

<template>
  <div class="History" style="" v-loading="loading">
    <ScrollLoadList v-show="!visiable" ref="ScrollLoadList" :request="getSessionList" key="1">
      <template #item="{ item }">
        <div class="list-item --MarginB flexCenterBetween" @click=";(visiable = true), (sessionId = item.sessionId)">
          <div>
            <div class="title ellipsis">{{ item.question }}</div>
            <div class="time">{{ item.createTime }}</div>
          </div>
          <TbOpBtn icon="delete" @click.stop="remove(item.id)">删除</TbOpBtn>
        </div>
      </template>
    </ScrollLoadList>

    <ScrollLoadList v-if="visiable" ref="ScrollLoadList2" :params="{ sessionId }" :request="getList" key="2">
      <template #list="{ list }">
        <MessageList :list="list"></MessageList>

        <div class="footer sticky-b pad10 ar" v-if="list.length">
          <el-button class="" type="primary" plain @click="visiable = false">返回</el-button>
          <!-- <el-button class="" type="danger" plain @click="remove()">删除</el-button> -->
        </div>
      </template>
    </ScrollLoadList>
  </div>
</template>

<style lang="scss" scoped>
.History {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.list-item {
  background: var(--BgBlack10);
  padding: 10px;
  border-radius: var(--Radius);
  .title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  .time {
    color: var(--FontBlack-8);
  }
}
</style>
