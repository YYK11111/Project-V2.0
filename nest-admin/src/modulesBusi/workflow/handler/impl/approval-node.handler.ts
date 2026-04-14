import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult, ApprovalNodeProperties } from '../../interface/node.interface';

/**
 * 审批节点处理器
 */
@Injectable()
export class ApprovalNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.APPROVAL;

  async onEnter(context: NodeExecutionContext): Promise<void> {
    console.log(`[Approval] Creating approval task for instance ${context.instanceId}, node ${context.nodeId}`);
  }

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    // 审批节点需要等待人工审批，返回等待状态
    return {
      success: true,
      nextNodeIds: [],
      outputData: { status: 'waiting_approval' },
    };
  }

  async onExit(context: NodeExecutionContext): Promise<void> {
    console.log(`[Approval] Approval node ${context.nodeId} exited for instance ${context.instanceId}`);
  }
}
