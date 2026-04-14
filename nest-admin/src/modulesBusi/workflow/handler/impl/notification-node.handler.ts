import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult, NotificationNodeProperties } from '../../interface/node.interface';
import { NoticesService } from '../../../../modules/notices/service';
import { BoolNum } from '../../../../common/type/base';

/**
 * 通知节点处理器
 */
@Injectable()
export class NotificationNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.NOTIFICATION;

  constructor(private noticesService: NoticesService) {}

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    const props = context.variables._nodeProperties as NotificationNodeProperties;
    if (!props) {
      console.warn(`[Notification] No properties found for node ${context.nodeId}`);
      return { success: true, nextNodeIds: [], outputData: { status: 'skipped' } };
    }

    const receivers = this.parseReceivers(props.notificationReceiverExpr, context.variables);
    const title = this.renderTemplate(props.notificationTemplate || '流程通知', context.variables);
    const content = this.renderTemplate(props.notificationContent || '', context.variables);

    if (receivers.length === 0) {
      console.warn(`[Notification] No receivers for node ${context.nodeId}`);
      return { success: true, nextNodeIds: [], outputData: { status: 'no_receivers' } };
    }

    try {
      await this.noticesService.add({
        title,
        content,
        isActive: BoolNum.Yes,
        remark: `workflow_notification:${context.instanceId}:${context.nodeId}`,
        receiverIds: receivers,
      });
      console.log(`[Notification] Sent to ${receivers.length} receiver(s) for instance ${context.instanceId}`);
    } catch (error) {
      console.error(`[Notification] Failed to send notification: ${error.message}`);
    }

    return {
      success: true,
      nextNodeIds: [],
      outputData: { status: 'notification_sent', receivers },
    };
  }

  /**
   * 渲染通知模板
   */
  renderTemplate(template: string, variables: Record<string, any>): string {
    if (!template) return '';
    let result = template;
    const regex = /\$\{([^}]+)\}/g;
    result = result.replace(regex, (match, varName) => {
      let value: any = variables;
      const parts = varName.split('.');
      for (const part of parts) {
        value = value?.[part];
      }
      return value != null ? String(value) : '';
    });
    return result;
  }

  /**
   * 解析通知接收人
   */
  parseReceivers(receiverExpr: string, variables: Record<string, any>): string[] {
    if (!receiverExpr) return [];
    if (receiverExpr.startsWith('${') && receiverExpr.endsWith('}')) {
      const varName = receiverExpr.slice(2, -1);
      const value = variables[varName];
      if (Array.isArray(value)) return value;
      if (value) return [value];
    }
    return [receiverExpr];
  }
}
