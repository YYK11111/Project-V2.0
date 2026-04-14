<script>
import { getList, send } from './api'
import { useAppStore } from '@/stores/app'

export default {
  components: {
    History: defineAsyncComponent(() => import('./History')),
    MessageList: defineAsyncComponent(() => import('./MessageList')),
    ScrollLoadList: defineAsyncComponent(() => import('@/components/ScrollLoadList')),
  },
  data() {
    return {
      getList,
      useZIndex: 0,
      active: '0',
      loading: false,
      sessionId: undefined,
      question: '',
      list: [],
      answer: { text: '', createTime: '' },
      useAppStore,
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    createDialog() {
      // this.loading = true
      // closeConnect(this.sessionId)
      this.question = ''
      this.sessionId = ''
      this.list = []
      // createConnect().then((res) => {
      //   debugger
      //   console.log(res)
      // })
    },
    send(v) {
      // v == 1 &&
      //   setTimeout(() => {
      //     this.send()
      //   }, 15000)

      // this.question = this.question.trim().replace(/^\n/, '')
      if (!this.question) return

      this.loading = true
      this.list.push({ text: this.question, role: 'user' })
      let answer = this.answer
      this.list.push(answer)
      let finish = false
      let scrollEl = this.$refs.scroll.$refs.scroll
      this.$nextTick(() => (scrollEl.scrollTop = scrollEl.scrollHeight))
      send({ content: this.question, sessionId: this.sessionId }, ({ code, data, msg }) => {
        if (finish) return
        if (code == 200) {
          answer.text = ''
          data?.forEach?.((element, index) => {
            // v !== 1 && console.log('element?.event', element, element?.event)
            try {
              answer.text += element.data?.Choices?.[0]?.Delta?.Content + ''
              this.$nextTick(() => (scrollEl.scrollTop = scrollEl.scrollHeight))
              if (element.data?.Choices?.[0]?.FinishReason == 'stop') {
                // console.log(element.data?.Choices?.[0]?.FinishReason)
                answer.createTime = new Date().toLocaleString()
                answer.id = element.data?.id
                this.question = ''
                this.loading = false
                this.answer = { text: '', createTime: '' }
                this.sessionId = data?.[0]?.sessionId
                finish = true
              }
            } catch (error) {
              // console.log(error)
            }
          })
        } else {
          this.loading = false
          answer.text = '回答失败'
          $sdk.msgError(msg)
          this.answer = { text: '', createTime: '' }
          finish = true
        }
      })
    },
  },
}
</script>

<template>
  <el-drawer
    v-model="useAppStore().AIDrawer"
    title="AI 助手"
    size="50%"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false">
    <template #default>
      <div class="main">
        <el-tabs v-model="active">
          <el-tab-pane label="AI 对话" name="0"></el-tab-pane>
          <el-tab-pane label="历史对话" name="1"></el-tab-pane>
          <el-tab-pane label="我的收藏" name="2"></el-tab-pane>
        </el-tabs>

        <!-- <template v-if="active == 0">
          <MessageList v-if="!sessionId" isDefault :list="list"></MessageList>
        </template> -->
        <ScrollLoadList
          ref="scroll"
          v-show="active == 0"
          :isQuery="false"
          :disabled="!sessionId || !!list?.length"
          finishedText=""
          key="1">
          <template #list="{ list: _list }">
            <MessageList isDefault :list="list"></MessageList>
          </template>
          <template #empty>
            <span></span>
          </template>
        </ScrollLoadList>

        <History v-if="active == 1"></History>

        <ScrollLoadList v-if="active == 2" :params="{ isCollect: 1 }" :request="getList" key="2">
          <template #list="{ list }">
            <MessageList :list="list"></MessageList>
          </template>
        </ScrollLoadList>
      </div>
    </template>
    <template #footer v-if="active == 0">
      <div class="footer relative" v-loading="loading">
        <el-button class="mb10 floatLeft" type="primary" plain @click="createDialog">新建对话</el-button>
        <el-input
          class="textarea"
          type="textarea"
          v-model="question"
          placeholder="请您输入问题，shift +（左）回车换行，回车发送"
          :maxlength="200"
          :show-word-limit="false"
          :autosize="{ minRows: 1 }"
          @keydown.enter.exact.prevent
          @keyup.enter.exact="send"
          @input="(val) => (question = val.trim().replace(/(^\n|\n$)/, ''))"></el-input>
        <el-button class="send" :type="!question ? 'info' : 'primary'" :disabled="!question" @click="send(1)">
          发送
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
.main {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

::v-deep.textarea {
  .el-textarea__inner {
    resize: none;
    padding: 15px calc(50px + 10px * 2) 15px 10px;
  }
}
.send {
  position: absolute;
  bottom: 10px;
  right: 10px;
}
</style>
