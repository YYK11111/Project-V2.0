import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult } from '../../interface/node.interface';

/**
 * 开始节点处理器
 */
@Injectable()
export class StartNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.START;

  async onEnter(context: NodeExecutionContext): Promise<void> {
    // 记录流程开始
    console.log(`[Start] Flow instance ${context.instanceId} started at ${new Date().toISOString()}`);
  }

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    // 开始节点执行后直接流转到下一个节点
    return {
      success: true,
      nextNodeIds: [],
      outputData: { status: 'started' },
    };
  }

  async onExit(context: NodeExecutionContext): Promise<void> {
    console.log(`[Start] Flow instance ${context.instanceId} exited start node`);
  }
}
