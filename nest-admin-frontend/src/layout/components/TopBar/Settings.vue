<template>
  <el-drawer v-model="visible" title="主题设置" size="300px" :modal="false" append-to-body :z-index="999">
    <div class="pl20">
      <div class="drawer-item">
        <span class="mr20">主题颜色</span>
        <el-color-picker
          v-model="theme"
          @active-change="themeActiveChange"
          color-format="hsl"
          :predefine="['#9452fe', '#1890ff', '#212121', '#11a983', '#13c2c2', '#6959CD', '#f5222d']" />
      </div>

      <div class="mt10">
        <el-button type="primary" @click="confirm">确定</el-button>
        <el-button @click="cancel">取消</el-button>
        <el-button @click="reset">重置</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import { getTheme, updateTheme } from '@/views/system/users/api'

export default {
  components: {},
  data() {
    return {
      theme: getComputedStyle(document.documentElement).getPropertyValue('--Color').trim(),
      themeOld: '',
      visible: false,
    }
  },
  computed: {},
  async created() {
    // 从数据库恢复主题
    await this.restoreThemeFromDB()
  },
  methods: {
    // 从数据库恢复主题
    async restoreThemeFromDB() {
      try {
        const res = await getTheme()
        const themeHsl = res.data?.themeHsl
        
        if (themeHsl) {
          const [h, s, l] = themeHsl.split(',').map((e) => e.trim())
          const style = document.documentElement.style
          // 修复：使用大写变量名 --H/--S/--L 匹配 var.css
          style.setProperty('--H', h)
          style.setProperty('--S', s)
          style.setProperty('--L', l)
          
          // 更新 theme 值以匹配当前主题
          this.theme = `hsl(${h}, ${s}, ${l})`
          this.themeOld = this.theme
        } else {
          // 如果数据库没有主题，尝试从 localStorage 恢复（兼容旧数据）
          this.restoreThemeFromLocal()
        }
      } catch (error) {
        console.error('获取主题配置失败:', error)
        // 失败时尝试从 localStorage 恢复
        this.restoreThemeFromLocal()
      }
    },
    
    // 从 localStorage 恢复主题（兼容旧数据）
    restoreThemeFromLocal() {
      const hsl = localStorage.hsl
      if (hsl) {
        const [h, s, l] = hsl.split(',').map((e) => e.trim())
        const style = document.documentElement.style
        // 修复：使用大写变量名 --H/--S/--L 匹配 var.css
        style.setProperty('--H', h)
        style.setProperty('--S', s)
        style.setProperty('--L', l)
        
        // 更新 theme 值以匹配当前主题
        this.theme = `hsl(${h}, ${s}, ${l})`
        this.themeOld = this.theme
      } else {
        // 如果没有保存的主题，使用当前默认值
        this.themeOld = this.theme
      }
    },
    themeActiveChange(val) {
      val || (val = this.themeOld)
      if (val) {
        let [h, s, l] = val
          .slice(4, -1)
          .split(',')
          .map((e) => e.trim())
        let style = document.documentElement.style
        // 修复：使用大写变量名 --H/--S/--L 匹配 var.css
        style.setProperty('--H', h)
        style.setProperty('--S', s)
        style.setProperty('--L', l)

        // 同时保存到 localStorage（兼容）和内存中
        localStorage.hsl = `${h},${s},${l}`
      }
    },
    // 确定应用主题并保存到数据库
    async confirm() {
      try {
        const hsl = localStorage.hsl
        if (hsl) {
          await updateTheme({ themeHsl: hsl })
          ElMessage.success('主题保存成功')
        }
        this.visible = false
        this.themeOld = this.theme
      } catch (error) {
        console.error('保存主题失败:', error)
        ElMessage.error('主题保存失败')
      }
    },
    // 恢复默认主题
    async reset() {
      let style = document.documentElement.style
      // 修复：移除大写变量名
      style.removeProperty('--H')
      style.removeProperty('--S')
      style.removeProperty('--L')
      // 兼容旧版本，也移除小写变量名
      style.removeProperty('--h')
      style.removeProperty('--s')
      style.removeProperty('--l')
      localStorage.hsl = ''
      
      // 重置为默认颜色（从 var.css 中读取默认值：H: 345, S: 82%, L: 54%）
      style.setProperty('--H', '345')
      style.setProperty('--S', '82%')
      style.setProperty('--L', '54%')
      this.theme = 'hsl(345, 82%, 54%)'
      this.themeOld = this.theme
      
      // 清空数据库中的主题配置
      try {
        await updateTheme({ themeHsl: null })
        ElMessage.success('已恢复默认主题')
      } catch (error) {
        console.error('重置主题失败:', error)
      }
    },
    // 取消并恢复上一次主题
    cancel() {
      this.visible = false
      this.themeActiveChange(this.themeOld)
    },
  },
}
</script>

<style lang="scss" scoped>
.drawer-title {
  margin-bottom: 12px;
  color: var(--FontBlack2);
  font-size: 14px;
  line-height: 22px;
}

.drawer-item {
  color: var(--FontBlack5);
  font-size: 14px;
  padding: 0 0 12px;
}

.drawer-switch {
  float: right;
}
</style>
