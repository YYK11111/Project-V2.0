import { vi } from 'vitest'
import { ref } from 'vue'
import { defineStore } from 'pinia'

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core')

  return {
    ...actual,
    useDark: () => ref(false),
  }
})

const testWindow = (globalThis.window ??= globalThis as typeof globalThis & Window)

Object.defineProperty(globalThis, '__PACK_DATETIME__', {
  value: '',
  writable: true,
})

Object.defineProperty(globalThis, 'defineStore', {
  value: defineStore,
  writable: true,
})

Object.defineProperty(testWindow, 'sysConfig', {
  value: {
    BASE_API: 'http://localhost:3000/api',
    BASE_URL: '/',
  },
  writable: true,
})

Object.defineProperty(testWindow, 'location', {
  value: {
    href: 'http://localhost/dashboard',
    pathname: '/dashboard',
    search: '?tab=1',
  },
  writable: true,
})

;(testWindow as any).ElMessageBox = {
  confirm: vi.fn(() => Promise.resolve()),
}

;(testWindow as any).ElMessage = vi.fn()
;(testWindow as any).ElMessage.error = vi.fn()
