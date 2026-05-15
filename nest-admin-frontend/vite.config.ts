// @ts-nocheck
import { fileURLToPath, URL } from 'node:url'
import { dateFormat } from './src/utils/common'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import vueJsx from '@vitejs/plugin-vue-jsx'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

import rollupPluginVisualizer from 'rollup-plugin-visualizer'
import vitePluginCompression from 'vite-plugin-compression'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

import tailwindcss from '@tailwindcss/vite'

const elDatePickerWithNowPath = fileURLToPath(
  new URL('./src/components/element-plus/ElDatePickerWithNow.ts', import.meta.url),
)
const elTimePickerWithNowPath = fileURLToPath(
  new URL('./src/components/element-plus/ElTimePickerWithNow.ts', import.meta.url),
)

interface SysConfig {
  SYSTEM_NAME_ALL: string
  BASE_URL: string
  BASE_API: string
}

interface ConfigEnv {
  command: string
  mode: string
}

const resolveElementPlusWithDefaults = (componentName: string) => {
  if (componentName === 'ElDatePicker') {
    return { name: 'default', from: elDatePickerWithNowPath }
  }

  if (componentName === 'ElTimePicker') {
    return { name: 'default', from: elTimePickerWithNowPath }
  }
}

export default defineConfig(async ({ command, mode }: ConfigEnv) => {
  globalThis.MODE = mode
  const config: SysConfig = (await import('./sys.config.js')).config
  process.env.VITE_APP_TITLE = config.SYSTEM_NAME_ALL

  return {
    define: {
      __PACK_DATETIME__: JSON.stringify(dateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')),
    },
    base: config.BASE_URL || '/',

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    server: {
      port: { development: 1994, production: 1995 }[mode as 'development' | 'production'] ?? 1994,
      host: true,
      open: true,
      proxy: {
        '/api': {
          target: config.BASE_API,
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      reportCompressedSize: false,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
          chunkFileNames: 'assets/js/[name]-[hash].js',
          manualChunks: (id: string) => {
            if (id.includes('assets/icons/svg')) {
              return 'icons-svg'
            } else if (['quill-image-resize-module', 'Quill'].some((e) => id.includes(e))) {
              return 'quill-image-resize-module'
            } else if (id.includes('node_modules')) {
              return id.split(/node_modules\/(\.store\/)??/)[1]?.split?.('/')[0]
            }
          },
        },
      },
    },
    plugins: [
      vue(),
      tailwindcss(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/svg')],
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: false
      }),
      ViteImageOptimizer({
        png: { quality: 100 },
        jpeg: { quality: 100 },
        jpg: { quality: 100 },
      }),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [
          ElementPlusResolver(),
          IconsResolver({ prefix: 'Icon' }),
        ],
      }),
      Components({
        resolvers: [
          resolveElementPlusWithDefaults,
          ElementPlusResolver(),
          IconsResolver({
            enabledCollections: ['ep'],
          }),
        ],
      }),
      Icons({
        autoInstall: true,
      }),
      vueJsx(),
      vitePluginCompression({
        threshold: 10000,
      }),
      process.env.npm_config_report &&
      rollupPluginVisualizer({
        emitFile: false,
        filename: 'report.html',
        open: false,
        gzipSize: true,
      }),
    ],
  }
})
