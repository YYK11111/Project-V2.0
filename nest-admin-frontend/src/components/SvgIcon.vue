<!-- <svg-icon :icon="icon" style="font-size: 18px" /> -->
<template>
  <component v-if="elementIcon" :is="elementIcon" class="SvgIcon elementIcon" />
  <svg v-else class="SvgIcon" aria-hidden="true">
    <use :xlink:href="iconName" />
  </svg>
</template>

<script>
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default {
  props: {
    icon: {
      type: String,
    },
    color: {
      type: String,
      default: '',
    },
  },
  // setup(props) {
  //   return {
  //     iconName: computed(() => `#icon-${props.icon }`),
  //   }
  // },
  computed: {
    iconName() {
      return `#icon-${this.icon}`
    },
    elementIcon() {
      if (!this.icon || !this.icon.startsWith('el:')) return null
      const rawName = this.icon.slice(3)
      const pascalName = rawName
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
        .join('')
      return ElementPlusIconsVue[pascalName] || null
    },
  },
}
</script>

<style scoped>
.SvgIcon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
