declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

declare module 'vue-cropper/lib/vue-cropper.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

declare module '@/utils/request' {
  const request: any
  export default request
}

declare module '@/utils/common' {
  const value: any
  export const dateFormat: any
  export default value
  export = value
}

declare module '@/utils/validate' {
  const value: any
  export const isExternal: any
  export default value
  export = value
}

declare module '@/utils/dictionary' {
  const value: any
  export const yesOrNO: any
  export const KEY_NO: any
  export const KEY_YES: any
  export default value
  export = value
}

declare module '@/stores/user' {
  export const useUserStore: any
}

declare module '@/stores/app' {
  export const useAppStore: any
}

declare module '@/stores' {
  const stores: any
  export const store: any
  export default stores
}

declare module '@/router/routes' {
  export const constantRoutes: any
  export const getUserRoutes: any
}

declare module '@/router/permission' {
  const permission: any
  export default permission
}

interface Window {
  sysConfig: any
}

declare const ElMessage: any
declare const ElMessageBox: any
declare const process: any
