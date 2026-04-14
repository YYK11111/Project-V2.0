<script>
import { Marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
// import 'highlight.js/styles/github.css'
import 'highlight.js/styles/default.min.css'
import 'highlight.js/styles/dark.min.css'

import { collect } from './api'

const markedTrans = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  }),
)
markedTrans.use(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
  }),
)
export default {
  name: '',
  props: {
    // 消息列表 根据text（文字），title（图文），image（图片）字段自动判断类型
    // 示例：[{ text: form.welcomeMsg || '请输入加群引导语' },{ title: form.linkTitle, desc: form.linkDesc, image: form.linkCoverUrl },]
    list: {
      type: Array,
      default: () => [],
    },
    isDefault: Boolean,
  },
  components: {},
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    collect(item) {
      collect({ id: item.id, isCollect: item.isCollect == 1 ? 0 : 1 }).then(() => {
        $sdk.msgSuccess((item.isCollect == 1 ? '取消' : '') + '收藏成功')
        item.isCollect = item.isCollect == 1 ? 0 : 1
      })
    },
    transToMd(mdString) {
      return markedTrans.parse(mdString)
    },
  },
}
</script>

<template>
  <ul class="msg-ul">
    <li class="flex msg-li" v-if="isDefault && !list?.length">
      <div class="avatar flexNone"><svg-icon icon="AIkefu" /></div>

      <div class="msg">
        <slot>Hello，我是你的AI助手，如果有任何需要帮助的地方，请随时告诉我哦~</slot>
      </div>
    </li>

    <template v-for="(item, index) in list" :key="index">
      <li class="flex msg-li" :class="item.role == 'user' && 'user'">
        <div class="avatar flexNone" v-if="item.role !== 'user'"><svg-icon icon="AIkefu" /></div>

        <div :class="['msg', item.role == 'user' && 'user']">
          <div v-if="!(item.text || item.image || item.title)">让我想想哈~...</div>
          <!-- 根据text（文字），title（图文），image（图片）字段自动判断类型 -->
          <!-- 文字 -->
          <div class="msg-text" v-if="item.text" v-html="transToMd(item.text)"></div>
          <!-- 图文 -->
          <slot v-else-if="item.title" name="imageText" :msg="item">
            <div class="msg-image-text">
              <div class="image-text-title">{{ item.title }}</div>
              <div class="image-text-content">
                <div class="image-text-desc">{{ item.desc }}</div>
                <el-image class="image-text-image flexNone" :src="item.image" fit="contain"></el-image>
              </div>
            </div>
          </slot>
          <!-- 图片 -->
          <el-image class="msg-image" v-else-if="item.image" :src="item.image" fit="contain" />

          <div class="mt20" v-if="item.createTime && item.role !== 'user'">（免责说明，智能AI返回）</div>
          <div class="flexBwtween mt10" v-if="item.createTime && item.role !== 'user'">
            <span class="msg-time">{{ item.createTime }}</span>
            <div class="msg-action-icon">
              <el-icon-copy-document
                class="el-icon-copy-document mr10 pointer"
                title="复制"
                @click="$copyText(item.text)"></el-icon-copy-document>
              <el-icon-star
                class="el-icon-star pointer"
                :style="{ color: item.isCollect == 1 ? 'var(--Color)' : '' }"
                @click="collect(item)"></el-icon-star>
            </div>
          </div>
        </div>
        <div class="avatar flexNone me" v-if="item.role == 'user'">我</div>
      </li>
    </template>
  </ul>
</template>

<style lang="scss" scoped>
.msg-ul {
  margin: 0;
  overflow: auto;
  padding: 0 10px;
}
.msg-li {
  margin-bottom: 20px;
  &.user {
    justify-content: flex-end;
  }
}
.msg {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 28px;
  background: var(--BgWhite);
  border: 1px solid var(--BorderBlack9);
  position: relative;
  text-align: left;
  font-size: 14px;
  line-height: 22px;
  padding: 6px 12px;
  border-radius: var(--Radius);
  max-width: 80%;
  min-width: 24px;
  box-sizing: border-box;
  word-break: break-all;
  white-space: pre-line;
  margin-left: 10px;
  &.user {
    color: var(--FontWhite);
    background: var(--Color);
    border: none;
    margin-right: 10px;
  }
}
.msg-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--FontWhite);
  background: var(--Color);
  font-size: 26px;
  &.me {
    background: var(--FontBlack7);
    font-size: 16px;
    font-weight: 700;
  }
}
.msg-time {
  color: var(--FontBlack6);
}
.msg-action-icon {
  color: var(--FontBlack6);
  font-size: 16px;
}

.msg-image-text {
  .image-text-title {
    font-weight: 500;
  }
  .image-text-content {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 2px;
  }
  .image-text-desc {
    font-size: 12px;
    color: var(--FontBlack6);
  }
  .image-text-image {
    width: 50px;
    height: 50px;
    border-radius: 6px;
    border: 1px solid var(--BorderBlack11);
  }
}
</style>
