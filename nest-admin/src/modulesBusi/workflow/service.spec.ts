import { WorkflowService } from './service'
import { NodeType, ConditionOperator } from './interface/node-type.enum'

describe('WorkflowService 条件路由', () => {
  const createService = () => {
    return new WorkflowService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )
  }

  it('按 conditionId + 连线命中目标节点', async () => {
    const service = createService()
    const definition = {
      flows: [
        {
          id: 'flow_cond_1',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_a',
          flowType: 'condition',
          conditionId: 'c1',
        },
        {
          id: 'flow_default',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_default',
          flowType: 'default',
        },
      ],
    } as any
    const currentNode = {
      id: 'cond_1',
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: 'c1',
            field: 'amount',
            operator: ConditionOperator.GT,
            value: 5,
          },
        ],
      },
    } as any
    const instance = {
      variables: { amount: 10 },
    } as any

    const result = await (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual(['node_a'])
  })

  it('条件不命中时走默认分支连线', async () => {
    const service = createService()
    const definition = {
      flows: [
        {
          id: 'flow_cond_1',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_a',
          flowType: 'condition',
          conditionId: 'c1',
        },
        {
          id: 'flow_default',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_default',
          flowType: 'default',
        },
      ],
    } as any
    const currentNode = {
      id: 'cond_1',
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: 'c1',
            field: 'amount',
            operator: ConditionOperator.GT,
            value: 100,
          },
        ],
      },
    } as any
    const instance = {
      variables: { amount: 10 },
    } as any

    const result = await (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual(['node_default'])
  })

  it('人员属于部门命中条件分支', async () => {
    const service = createService()
    const definition = {
      flows: [
        {
          id: 'flow_cond_1',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_member',
          flowType: 'condition',
          conditionId: 'c1',
        },
      ],
    } as any
    const currentNode = {
      id: 'cond_1',
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: 'c1',
            field: 'approverId',
            operator: ConditionOperator.MEMBER_OF,
            value: 'dept_2',
          },
        ],
      },
    } as any
    const instance = {
      variables: {
        approverId: 'user_1',
        _businessData: {
          data: {
            approver: { id: 'user_1', deptId: 'dept_2' },
          },
        },
      },
    } as any

    const result = await (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual(['node_member'])
  })

  it('人员属于部门或子部门命中条件分支', async () => {
    const service = createService()
    const definition = {
      flows: [
        {
          id: 'flow_cond_1',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_member',
          flowType: 'condition',
          conditionId: 'c1',
        },
      ],
    } as any
    const currentNode = {
      id: 'cond_1',
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: 'c1',
            field: 'approverId',
            operator: ConditionOperator.MEMBER_OF_OR_SUB,
            value: 'dept_1',
          },
        ],
      },
    } as any
    const instance = {
      variables: {
        approverId: 'user_1',
        _businessData: {
          data: {
            approver: { id: 'user_1', deptId: 'dept_2' },
            deptTree: [
              { id: 'dept_1', children: [{ id: 'dept_2', children: [] }] },
            ],
          },
        },
      },
    } as any

    const result = await (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual(['node_member'])
  })

  it('数组包含人员命中条件分支', async () => {
    const service = createService()
    const definition = {
      flows: [
        {
          id: 'flow_cond_1',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_contains',
          flowType: 'condition',
          conditionId: 'c1',
        },
      ],
    } as any
    const currentNode = {
      id: 'cond_1',
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: 'c1',
            field: 'memberIds',
            operator: ConditionOperator.CONTAINS_USER,
            value: 'user_2',
          },
        ],
      },
    } as any
    const instance = {
      variables: {
        memberIds: ['user_1', 'user_2'],
      },
    } as any

    const result = await (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual(['node_contains'])
  })

  it('数组包含部门命中条件分支', async () => {
    const service = createService()
    const definition = {
      flows: [
        {
          id: 'flow_cond_1',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_contains',
          flowType: 'condition',
          conditionId: 'c1',
        },
      ],
    } as any
    const currentNode = {
      id: 'cond_1',
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: 'c1',
            field: 'deptIds',
            operator: ConditionOperator.CONTAINS_DEPT,
            value: 'dept_2',
          },
        ],
      },
    } as any
    const instance = {
      variables: {
        deptIds: ['dept_1', 'dept_2'],
      },
    } as any

    const result = await (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual(['node_contains'])
  })

  it('未命中任何条件且无默认分支时抛错', async () => {
    const service = createService()
    const definition = {
      flows: [
        {
          id: 'flow_cond_1',
          sourceNodeId: 'cond_1',
          targetNodeId: 'node_a',
          flowType: 'condition',
          conditionId: 'c1',
        },
      ],
    } as any
    const currentNode = {
      id: 'cond_1',
      type: NodeType.CONDITION,
      properties: {
        conditions: [
          {
            id: 'c1',
            field: 'amount',
            operator: ConditionOperator.GT,
            value: 100,
          },
        ],
      },
    } as any
    const instance = {
      variables: { amount: 10 },
    } as any

    await expect((service as any).findNextNodes(definition, currentNode, instance, [])).rejects.toThrow('条件节点')
  })

  it('非条件节点存在多条流出连接线时抛错', async () => {
    const service = createService()
    const definition = {
      flows: [
        {
          id: 'flow_1',
          sourceNodeId: 'approval_1',
          targetNodeId: 'node_a',
          flowType: 'normal',
        },
        {
          id: 'flow_2',
          sourceNodeId: 'approval_1',
          targetNodeId: 'node_b',
          flowType: 'normal',
        },
      ],
    } as any
    const currentNode = {
      id: 'approval_1',
      name: '审批节点',
      type: NodeType.APPROVAL,
      properties: {},
    } as any
    const instance = {
      variables: {},
    } as any

    await expect((service as any).findNextNodes(definition, currentNode, instance, [])).rejects.toThrow('多条流出连接线')
  })
})

describe('WorkflowService listInstances', () => {
  const createService = () => {
    const taskQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    }

    const instanceQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    }

    const service = new WorkflowService(
      {} as any,
      { createQueryBuilder: jest.fn(() => instanceQb) } as any,
      { createQueryBuilder: jest.fn(() => taskQb) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { getOne: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    jest.spyOn(service as any, 'attachBusinessSummaryToInstance').mockImplementation(async (instance) => instance)

    return { service, taskQb, instanceQb }
  }

  it('participant 模式按最近任务去重实例后查询', async () => {
    const { service, taskQb, instanceQb } = createService()
    taskQb.getRawMany.mockResolvedValue([{ instanceId: 'ins_1' }, { instanceId: 'ins_2' }])
    instanceQb.getMany.mockResolvedValue([{ id: 'ins_1' }, { id: 'ins_2' }])

    const result = await service.listInstances('user_1', '1', 'participant')

    expect(taskQb.where).toHaveBeenCalledWith('task.assigneeId = :userId', { userId: 'user_1' })
    expect(taskQb.groupBy).toHaveBeenCalledWith('task.instanceId')
    expect(instanceQb.where).toHaveBeenCalledWith('instance.id IN (:...instanceIds)', { instanceIds: ['ins_1', 'ins_2'] })
    expect(instanceQb.andWhere).toHaveBeenCalledWith('instance.status = :status', { status: '1' })
    expect(result).toEqual([{ id: 'ins_1' }, { id: 'ins_2' }])
  })

  it('starter 模式按发起人和状态查询实例', async () => {
    const { service, instanceQb } = createService()
    instanceQb.getMany.mockResolvedValue([{ id: 'ins_3' }])

    const result = await service.listInstances('starter_1', '2', 'starter')

    expect(instanceQb.andWhere).toHaveBeenCalledWith('instance.starterId = :userId', { userId: 'starter_1' })
    expect(instanceQb.andWhere).toHaveBeenCalledWith('instance.status = :status', { status: '2' })
    expect(result).toEqual([{ id: 'ins_3' }])
  })
})
