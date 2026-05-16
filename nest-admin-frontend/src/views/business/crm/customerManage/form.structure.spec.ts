import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

describe('customer form structure', () => {
  it('新建客户默认销售负责人为当前登录用户', () => {
    const source = readSource()

    expect(source).toContain("import { useUserStore } from '@/stores/user'")
    expect(source).toContain('const userStore = useUserStore()')
    expect(source).toContain("const currentUserId = computed(() => String(userStore.id || ''))")
    expect(source).toContain('salesId: currentUserId.value,')
  })

  it('销售负责人字段必须存在必填校验', () => {
    const source = readSource()

    expect(source).toContain("salesId: [{ required: true, message: '请选择销售负责人', trigger: 'change' }],")
  })

  it('编辑客户时仍使用接口返回值而不是当前登录用户覆盖', () => {
    const source = readSource()

    expect(source).toContain('const { data } = await getOne(route.query.id)')
    expect(source).toContain('form.value = { ...data }')
    expect(source).not.toContain('form.value = { ...data, salesId: currentUserId.value }')
  })

  it('客户表单不在页面脚本里声明响应式断点', () => {
    const source = readSource()

    expect(source).not.toContain('viewportWidth')
    expect(source).not.toContain('formLabelPosition')
    expect(source).not.toContain('isCompactScreen')
    expect(source).not.toContain(':label-position="formLabelPosition"')
    expect(source).not.toContain('window.addEventListener(\'resize\', updateViewportWidth)')
    expect(source).not.toContain('window.removeEventListener(\'resize\', updateViewportWidth)')
  })

  it('已有客户表单应展示关联业务记录', () => {
    const source = readSource()

    expect(source).toContain("import CustomerRelatedRecords from './components/CustomerRelatedRecords.vue'")
    expect(source).toContain('<CustomerRelatedRecords')
    expect(source).toContain('v-if="hasCustomerId"')
    expect(source).toContain(':customer-id="String(route.query.id || \'\')"')
  })
})
