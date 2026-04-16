import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult, NotificationNodeProperties } from '../../interface/node.interface';
import { WorkflowAssigneeResolverService } from '../../../../common/services/workflow-assignee-resolver.service';
import { MessagesService } from '../../../../modules/messages/service';

/**
 * 通知节点处理器
 */
@Injectable()
export class NotificationNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.NOTIFICATION;

  constructor(
    private assigneeResolver: WorkflowAssigneeResolverService,
    private messagesService: MessagesService,
  ) {}

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    const props = context.variables._nodeProperties as NotificationNodeProperties;
    if (!props) {
      console.warn(`[Notification] No properties found for node ${context.nodeId}`);
      return { success: true, nextNodeIds: [], outputData: { status: 'skipped' } };
    }

    const receivers = await this.getNotificationReceivers(props, context.variables);
    const title = this.renderTemplate(props.notificationTemplate || '流程通知', context.variables);
    const content = this.renderTemplate(props.notificationContent || '', context.variables);

    if (receivers.length === 0) {
      console.warn(`[Notification] No receivers for node ${context.nodeId}`);
      return { success: true, nextNodeIds: [], outputData: { status: 'no_receivers' } };
    }

    try {
      const businessData = context.variables?._businessData?.data || {}
      const businessTitle = businessData.name || businessData.title || context.instanceId
      const businessCode = businessData.code || businessData.id || ''
      const businessType = context.variables?._businessData?.businessType || ''
      const businessLabel = `${businessTitle}${businessCode ? `（${businessCode}）` : ''}`
      const normalizedTitle = `【待阅】流程通知 - ${businessLabel}`
      const normalizedContent = `${content || '您收到一条流程通知。'}

业务对象：${businessLabel}
节点：${context.nodeId}`.trim()
      for (const receiverId of receivers) {
        await this.messagesService.sendMessage({
          title: normalizedTitle,
          content: normalizedContent,
          messageType: 'cc',
          sourceType: 'workflow_instance',
          sourceId: context.instanceId,
          receiverId,
          linkUrl: '/system/messageCenter/index',
          linkParams: { instanceId: context.instanceId, fromWorkflow: '1' },
          extraData: {
            businessType,
            businessTitle,
            businessCode,
            nodeName: context.nodeId,
          },
        })
      }
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

  private async getNotificationReceivers(props: NotificationNodeProperties, variables: Record<string, any>): Promise<string[]> {
    if (props.assigneeType) {
      return this.assigneeResolver.resolve(
        {
          type: props.assigneeType as 'user' | 'department' | 'business_field',
          userId: props.assigneeValue,
          departmentId: props.departmentId,
          departmentMode: props.departmentMode,
          fieldPath: props.fieldPath,
          businessType: props.businessType,
        },
        variables._businessData,
      )
    }

    return this.parseReceivers(props.notificationReceiverExpr || props.notificationReceivers, variables)
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
