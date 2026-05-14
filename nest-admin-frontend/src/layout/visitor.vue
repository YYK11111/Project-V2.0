<script setup>
import { RouterView } from 'vue-router'
</script>
<script>
export default {
  name: '',
  components: {},
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {},
}
</script>

<template>
  <div class="visitor">
    <router-view></router-view>
  </div>
</template>

<style lang="scss" scoped>
.contact-code {
  width: 80px;
}
.visitor {
  height: 100vh;
  background: var(--MainBg);
  .login-top--wrap {
    background: var(--BgWhite);
    padding: 5px 20px;
    box-shadow: 0px 5px 5px rgb(215 215 215 / 35%);
  }

  .logo-top--wrap {
    display: flex;
    align-items: center;
    .logo-top {
      max-height: 44px;
      max-width: 170px;
    }
  }

  .login-nav--wrap {
    .nav-li {
      color: var(--FontBlack7);
      margin-left: 20px;
    }
  }
}

</style>
