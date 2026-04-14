import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult } from '../../interface/node.interface';

/**
 * 结束节点处理器
 */
@Injectable()
export class EndNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.END;

  async onEnter(context: NodeExecutionContext): Promise<void> {
    console.log(`[End] Flow instance ${context.instanceId} reached end node`);
  }

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    // 结束节点执行后流程结束
    return {
      success: true,
      nextNodeIds: [],
      outputData: { status: 'ended' },
    };
  }

  async onExit(context: NodeExecutionContext): Promise<void> {
    console.log(`[End] Flow instance ${context.instanceId} finished`);
  }
}
