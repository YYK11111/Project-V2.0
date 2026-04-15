import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult, CcNodeProperties } from '../../interface/node.interface';
import { NoticesService } from '../../../../modules/notices/service';
import { BoolNum } from '../../../../common/type/base';
import { WorkflowAssigneeResolverService } from '../../../../common/services/workflow-assignee-resolver.service';
import { MessagesService } from '../../../../modules/messages/service';

/**
 * 抄送节点处理器
 */
@Injectable()
export class CcNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.CC;

  constructor(
    private noticesService: NoticesService,
    private assigneeResolver: WorkflowAssigneeResolverService,
    private messagesService: MessagesService,
  ) {}

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    const props = context.variables._nodeProperties as CcNodeProperties;
    if (!props) {
      console.warn(`[CC] No properties found for node ${context.nodeId}`);
      return { success: true, nextNodeIds: [], outputData: { status: 'skipped' } };
    }

    const ccReceivers = await this.getCcReceivers(props, context.variables);

    if (ccReceivers.length === 0) {
      console.warn(`[CC] No CC receivers for node ${context.nodeId}`);
      return { success: true, nextNodeIds: [], outputData: { status: 'no_receivers' } };
    }

    try {
      await this.noticesService.add({
        title: `【抄送】流程通知`,
        content: `您被抄送关注以下流程：
实例ID：${context.instanceId}
节点：${context.nodeId}
时间：${new Date().toISOString()}`,
        isActive: BoolNum.Yes,
        remark: `workflow_cc:${context.instanceId}:${context.nodeId}`,
        receiverIds: ccReceivers,
      });
      for (const receiverId of ccReceivers) {
        await this.messagesService.sendMessage({
          title: '【待阅】流程抄送通知',
          content: `您被抄送关注流程实例 ${context.instanceId}`,
          messageType: 'cc',
          sourceType: 'workflow_instance',
          sourceId: context.instanceId,
          receiverId,
          linkUrl: '',
          linkParams: { instanceId: context.instanceId, fromWorkflow: '1' },
        })
      }
      console.log(`[CC] Sent to ${ccReceivers.length} CC receiver(s) for instance ${context.instanceId}`);
    } catch (error) {
      console.error(`[CC] Failed to send CC notification: ${error.message}`);
    }

    return {
      success: true,
      nextNodeIds: [],
      outputData: { status: 'cc_sent', receivers: ccReceivers },
    };
  }

  private async getCcReceivers(props: CcNodeProperties, variables: Record<string, any>): Promise<string[]> {
    if (!props.assigneeType) {
      return []
    }

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
}
