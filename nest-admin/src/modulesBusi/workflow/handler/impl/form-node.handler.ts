import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult, FormNodeProperties } from '../../interface/node.interface';

/**
 * 表单节点处理器
 */
@Injectable()
export class FormNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.FORM;

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    // 表单节点需要显示表单，等待用户填写后继续
    console.log(`[Form] Waiting for form submission for instance ${context.instanceId}`);

    return {
      success: true,
      nextNodeIds: [],
      outputData: { status: 'waiting_form_submission' },
    };
  }
}
