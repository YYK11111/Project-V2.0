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
    )
  }

  it('按 conditionId + 连线命中目标节点', () => {
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

    const result = (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual(['node_a'])
  })

  it('条件不命中时走默认分支连线', () => {
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

    const result = (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual(['node_default'])
  })

  it('未命中任何条件且无默认分支时返回空数组', () => {
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

    const result = (service as any).findNextNodes(definition, currentNode, instance, [])
    expect(result).toEqual([])
  })
})
