import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult, ConditionNodeProperties, Condition, ConditionOperator } from '../../interface/node.interface';

/**
 * 条件节点处理器
 */
@Injectable()
export class ConditionNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.CONDITION;

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    // 条件节点需要根据变量值判断流转方向
    // 实际的条件配置会从流程定义中获取，这里提供基础实现
    return {
      success: true,
      nextNodeIds: [],
      outputData: { status: 'condition_evaluated' },
    };
  }

  /**
   * 评估条件
   */
  evaluateCondition(condition: Condition, variables: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(condition.field, variables);
    const { operator, value } = condition;

    switch (operator) {
      case ConditionOperator.EQ:
        return fieldValue === value;
      case ConditionOperator.NEQ:
        return fieldValue !== value;
      case ConditionOperator.GT:
        return Number(fieldValue) > Number(value);
      case ConditionOperator.GTE:
        return Number(fieldValue) >= Number(value);
      case ConditionOperator.LT:
        return Number(fieldValue) < Number(value);
      case ConditionOperator.LTE:
        return Number(fieldValue) <= Number(value);
      case ConditionOperator.IN:
        return Array.isArray(value) && value.includes(fieldValue);
      case ConditionOperator.CONTAINS:
        return String(fieldValue).includes(String(value));
      default:
        return false;
    }
  }

  /**
   * 获取字段值
   */
  private getFieldValue(field: string, variables: Record<string, any>): any {
    if (field.startsWith('${') && field.endsWith('}')) {
      const varName = field.slice(2, -1);
      if (varName.startsWith('variables.')) {
        return variables[varName.slice(10)];
      }
      if (varName === 'initiator') {
        return variables['starterId'];
      }
      return variables[varName];
    }
    return variables[field];
  }

  /**
   * 查找满足条件的目标节点
   */
  findNextNode(conditions: Condition[], variables: Record<string, any>): string | null {
    const sortedConditions = [...conditions].sort((a, b) => (a.priority || 0) - (b.priority || 0))
    for (const condition of sortedConditions) {
      if (this.evaluateCondition(condition, variables)) {
        return condition.id
      }
    }
    return null
  }
}
