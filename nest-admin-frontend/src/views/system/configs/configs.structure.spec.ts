import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

function readAppStoreSource() {
  return readFileSync(resolve(__dirname, '..', '..', '..', 'stores', 'app.js'), 'utf-8')
}

describe('system configs structure', () => {
  it('基础配置支持手动维护系统版本', () => {
    const source = readSource()

    expect(source).toContain("systemVersion: ''")
    expect(source).toContain('v-model="form.systemVersion"')
    expect(source).toContain('label="系统版本"')
  })

  it('基础配置支持维护新增用户默认密码', () => {
    const source = readSource()

    expect(source).toContain("defaultUserPassword: ''")
    expect(source).toContain('v-model="form.defaultUserPassword" label="默认用户密码" prop="defaultUserPassword"')
    expect(source).not.toContain('show-password')
    expect(source).not.toContain('defaultUserPasswordSet')
    expect(source).not.toContain('默认用户密码已设置')
  })

  it('加载系统配置后写入全局系统版本', () => {
    const source = readAppStoreSource()

    expect(source).toContain('window.sysConfig.SYSTEM_VERSION = data.systemVersion ||')
  })

  it('保存系统版本后刷新全局配置缓存', () => {
    const source = readSource()

    expect(source).toContain('const appStore = useAppStore()')
    expect(source).toContain('appStore.sysConfig = null')
    expect(source).toContain('appStore.getConfig()')
  })

  it('系统配置支持维护外部通知配置', () => {
    const source = readSource()

    expect(source).toContain('label="外部通知"')
    expect(source).toContain("externalNotifyConfig: getDefaultExternalNotifyConfig()")
    expect(source).toContain("import UserSelect from '@/components/UserSelect.vue'")
    expect(source).toContain("const testUserId = ref('')")
    expect(source).toContain('v-model="testUserId"')
    expect(source).toContain('默认当前登录用户，可选其他用户')
    expect(source).toContain('v-model="form.externalNotifyConfig.feishu.enabled"')
    expect(source).toContain('v-model="form.externalNotifyConfig.siteUrl"')
    expect(source).toContain('v-model="form.externalNotifyConfig.feishu.appId"')
    expect(source).toContain('v-model="form.externalNotifyConfig.feishu.appSecret"')
    expect(source).toContain('发送测试消息')
    expect(source).toContain('userId: testUserId.value || undefined')
    expect(source).toContain('testFeishuNotify')
  })

  it('系统配置无更新权限时以只读查看态展示', () => {
    const source = readSource()

    expect(source).toContain('const isConfigReadonly = computed(() => !canConfigUpdate.value)')
    expect(source).toContain(':disabled="isConfigReadonly"')
    expect(source).toContain(':disabled="isConfigReadonly || form.projectReminderStrategy.frequency.mode !==')
    expect(source).toContain('v-if="canConfigUpdate" type="primary"')
    expect(source).not.toContain('readonly="false"')
  })
})
