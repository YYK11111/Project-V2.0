import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../interface/node-handler.interface';
import { NodeType } from '../interface/node.interface';
import { StartNodeHandler } from './impl/start-node.handler';
import { EndNodeHandler } from './impl/end-node.handler';
import { ApprovalNodeHandler } from './impl/approval-node.handler';
import { ConditionNodeHandler } from './impl/condition-node.handler';
import { NotificationNodeHandler } from './impl/notification-node.handler';
import { CcNodeHandler } from './impl/cc-node.handler';
import { DelayNodeHandler } from './impl/delay-node.handler';
import { FormNodeHandler } from './impl/form-node.handler';

/**
 * 节点处理器工厂
 */
@Injectable()
export class NodeHandlerFactory {
  constructor(
    private startHandler: StartNodeHandler,
    private endHandler: EndNodeHandler,
    private approvalHandler: ApprovalNodeHandler,
    private conditionHandler: ConditionNodeHandler,
    private notificationHandler: NotificationNodeHandler,
    private ccHandler: CcNodeHandler,
    private delayHandler: DelayNodeHandler,
    private formHandler: FormNodeHandler,
  ) {}

  /**
   * 获取节点处理器
   * @param type 节点类型
   * @returns 节点处理器实例
   */
  getHandler(type: NodeType): INodeHandler {
    switch (type) {
      case NodeType.START:
        return this.startHandler;
      case NodeType.END:
        return this.endHandler;
      case NodeType.APPROVAL:
        return this.approvalHandler;
      case NodeType.CONDITION:
        return this.conditionHandler;
      case NodeType.NOTIFICATION:
        return this.notificationHandler;
      case NodeType.CC:
        return this.ccHandler;
      case NodeType.DELAY:
        return this.delayHandler;
      case NodeType.FORM:
        return this.formHandler;
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }
}
