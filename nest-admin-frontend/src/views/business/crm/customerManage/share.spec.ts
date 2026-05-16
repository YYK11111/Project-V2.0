import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource(file) {
  return readFileSync(resolve(__dirname, file), 'utf-8')
}

describe('customer share entry', () => {
  it('客户列表和表单应接入授权查看与可编辑权限', () => {
    const indexSource = readSource('index.vue')
    const formSource = readSource('form.vue')
    const authSource = readSource('auth.vue')
    const selectAuthUserSource = readSource('selectAuthUser.vue')
    const apiSource = readSource('api.ts')
    const routeSource = readFileSync(resolve(__dirname, '../../../../router/routes.js'), 'utf-8')

    expect(apiSource).toContain('getAllocatedViewerList')
    expect(apiSource).toContain('getUnallocatedViewerList')
    expect(apiSource).toContain('grantCustomerViewers')
    expect(apiSource).toContain('cancelCustomerViewer')
    expect(apiSource).toContain('cancelCustomerViewers')
    expect(apiSource).toContain('getCustomerViewerRecords')
    expect(indexSource).toContain('授权查看')
    expect(indexSource).toContain('handleOpenAuthDialog')
    expect(indexSource).toContain("router.push(`/crm/customerManage/auth/${row.id}`)")
    expect(indexSource).toMatch(/const canEditCustomer = \(row\) => canCustomerUpdate\.value \|\| row\.permissionContext\?\.canEdit === true/)
    expect(indexSource).toContain('canEditCustomer(row)')
    expect(indexSource).not.toContain('<AuthDialog')
    expect(formSource).toMatch(/const canManageCurrentCustomer = computed\(\(\) => \(/)
    expect(formSource).toContain('form.value?.permissionContext?.canEdit === true')
    expect(formSource).toMatch(/<el-button v-if="isView && canManageCurrentCustomer" type="primary" size="small" @click="goToEdit">去编辑<\/el-button>/)
    expect(authSource).toContain('getAllocatedViewerList')
    expect(authSource).toContain('getCustomerViewerRecords')
    expect(authSource).toContain('cancelCustomerViewers')
    expect(selectAuthUserSource).toContain('getUnallocatedViewerList')
    expect(selectAuthUserSource).toContain('grantCustomerViewers')
    expect(routeSource).toContain('/crm/customerManage/auth/:customerId')
    expect(routeSource).toContain('@/views/business/crm/customerManage/auth.vue')
  })
})
