import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkPermi } from './permission'

const userStoreState = vi.hoisted(() => ({
  permissions: [] as string[],
  roles: [] as string[],
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => userStoreState,
}))

describe('checkPermi', () => {
  beforeEach(() => {
    userStoreState.permissions = []
    userStoreState.roles = []
  })

  it('manageAll 权限可以放行同模块按钮权限', () => {
    userStoreState.permissions = ['business/projects/manageAll']

    expect(checkPermi(['business/projects/add'])).toBe(true)
    expect(checkPermi(['business/projects/delete'])).toBe(true)
    expect(checkPermi(['business/tasks/add'])).toBe(false)
  })

  it('旧 listAll 权限字符也可以继续放行同模块按钮权限', () => {
    userStoreState.permissions = ['business/crm/customers/listAll']

    expect(checkPermi(['business/crm/customers/add'])).toBe(true)
    expect(checkPermi(['business/crm/customers/delete'])).toBe(true)
  })

  it('access 权限只放行同模块只读权限', () => {
    userStoreState.permissions = ['business/tasks/access']

    expect(checkPermi(['business/tasks/list'])).toBe(true)
    expect(checkPermi(['business/tasks/getOne'])).toBe(true)
    expect(checkPermi(['business/tasks/update'])).toBe(false)
    expect(checkPermi(['business/projects/list'])).toBe(false)
  })

  it('access 权限放行明确的业务只读扩展权限', () => {
    userStoreState.permissions = ['business/tasks/access', 'business/workflow/instances/access']

    expect(checkPermi(['business/tasks/dependency/list'])).toBe(true)
    expect(checkPermi(['business/tasks/dependency/add'])).toBe(false)
    expect(checkPermi(['business/workflow/instances/history'])).toBe(true)
    expect(checkPermi(['business/workflow/instances/cancel'])).toBe(false)
  })

  it('工作流定义 access 只放行配置侧查看接口', () => {
    userStoreState.permissions = ['business/workflow/definitions/access']

    expect(checkPermi(['business/workflow/definitions/list'])).toBe(true)
    expect(checkPermi(['business/workflow/definitions/getOne'])).toBe(true)
    expect(checkPermi(['business/workflow/definitions/update'])).toBe(false)
    expect(checkPermi(['business/workflow/definitions/publish'])).toBe(false)
    expect(checkPermi(['business/workflow/definitions/start'])).toBe(false)
  })

  it('工作流实例 access 放行参与实例查看但不放行撤回取消', () => {
    userStoreState.permissions = ['business/workflow/instances/access']

    expect(checkPermi(['business/workflow/instances/list'])).toBe(true)
    expect(checkPermi(['business/workflow/instances/getOne'])).toBe(true)
    expect(checkPermi(['business/workflow/instances/history'])).toBe(true)
    expect(checkPermi(['business/workflow/instances/tasks'])).toBe(true)
    expect(checkPermi(['business/workflow/instances/withdraw'])).toBe(false)
    expect(checkPermi(['business/workflow/instances/cancel'])).toBe(false)
  })

  it('工作流任务 access 放行我的待办和本人审批处理动作', () => {
    userStoreState.permissions = ['business/workflow/tasks/access']

    expect(checkPermi(['business/workflow/tasks/list'])).toBe(true)
    expect(checkPermi(['business/workflow/tasks/complete'])).toBe(true)
    expect(checkPermi(['business/workflow/tasks/transfer'])).toBe(true)
    expect(checkPermi(['business/workflow/tasks/addSign'])).toBe(true)
    expect(checkPermi(['business/workflow/definitions/getOne'])).toBe(false)
  })

  it('工作流任务 access 放行审批表单所需项目只读初始化权限', () => {
    userStoreState.permissions = ['business/workflow/tasks/access']

    expect(checkPermi(['business/projects/getOne'])).toBe(true)
    expect(checkPermi(['business/projects/fieldPermissions'])).toBe(true)
    expect(checkPermi(['business/projects/update'])).toBe(false)
  })
})
