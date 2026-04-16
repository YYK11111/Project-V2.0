import { WorkflowController } from './controller'

describe('WorkflowController', () => {
  const workflowService = {
    startWorkflow: jest.fn(),
    listInstances: jest.fn(),
    getPendingTasks: jest.fn(),
    completeTask: jest.fn(),
    transferTask: jest.fn(),
    addSignTask: jest.fn(),
    withdrawWorkflow: jest.fn(),
    cancelInstance: jest.fn(),
    closeReturnedInstance: jest.fn(),
    resubmitReturnedInstance: jest.fn(),
  }

  const businessFieldService = {} as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('启动流程时只使用服务端认证用户 ID', async () => {
    const controller = new WorkflowController(workflowService as any, businessFieldService)
    workflowService.startWorkflow.mockResolvedValue({ success: true })

    await controller.startWorkflow({ definitionId: 'def_1' } as any, {
      user: { id: 'server-user-id' },
      query: { userId: 'forged-user-id' },
    })

    expect(workflowService.startWorkflow).toHaveBeenCalledWith({ definitionId: 'def_1' }, 'server-user-id')
  })

  it('获取我的待办时只使用服务端认证用户 ID', async () => {
    const controller = new WorkflowController(workflowService as any, businessFieldService)
    workflowService.getPendingTasks.mockResolvedValue([])

    await controller.getMyTasks({
      user: { sub: 'server-user-sub' },
      query: { userId: 'forged-user-id' },
    })

    expect(workflowService.getPendingTasks).toHaveBeenCalledWith('server-user-sub')
  })

  it('缺少认证用户时拒绝执行敏感操作', async () => {
    const controller = new WorkflowController(workflowService as any, businessFieldService)

    await expect(controller.completeTask('task_1', { action: 'approve' } as any, { user: null })).rejects.toThrow('当前用户不存在')
    expect(workflowService.completeTask).not.toHaveBeenCalled()
  })
})
