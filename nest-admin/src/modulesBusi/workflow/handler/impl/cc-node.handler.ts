import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult, CcNodeProperties } from '../../interface/node.interface';
import { NoticesService } from '../../../../modules/notices/service';
import { BoolNum } from '../../../../common/type/base';
import { WorkflowAssigneeResolverService } from '../../../../common/services/workflow-assignee-resolver.service';

/**
 * 抄送节点处理器
 */
@Injectable()
export class CcNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.CC;

  constructor(
    private noticesService: NoticesService,
    private assigneeResolver: WorkflowAssigneeResolverService,
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

  /**
   * 解析抄送接收人
   */
  private parseCcReceivers(props: CcNodeProperties, variables: Record<string, any>): string[] {
    const ccConfig = props.ccConfig
    if (ccConfig?.assigneeType) {
      // 兼容新抄送配置模型
      return []
    }

    if (!props.ccValue && !props.ccExpr) return [];

    let expr = props.ccExpr || props.ccValue;
    if (expr.startsWith('${') && expr.endsWith('}')) {
      const varName = expr.slice(2, -1);
      const value = variables[varName];
      if (Array.isArray(value)) return value;
      if (value) return [value];
    }

    // 直接是用户ID列表（逗号分隔）
    if (typeof props.ccValue === 'string' && props.ccValue.includes(',')) {
      return props.ccValue.split(',').map(v => v.trim());
    }

    return [props.ccValue as string];
  }

  async onEnter(context: NodeExecutionContext): Promise<void> {
    const props = context.variables._nodeProperties as CcNodeProperties;
    if (!props?.ccConfig?.assigneeType) return

    const receivers = await this.assigneeResolver.resolve(
      {
        type: props.ccConfig.assigneeType as 'user' | 'department' | 'business_field',
        userId: props.ccConfig.assigneeValue,
        departmentId: props.ccConfig.departmentId,
        departmentMode: props.ccConfig.departmentMode,
        fieldPath: props.ccConfig.fieldPath,
        businessType: props.ccConfig.businessType,
      },
      context.variables._businessData,
    )

    context.variables._ccReceivers = receivers
  }

  private async getCcReceivers(props: CcNodeProperties, variables: Record<string, any>): Promise<string[]> {
    if (props.ccConfig?.assigneeType) {
      return variables._ccReceivers || []
    }
    return this.parseCcReceivers(props, variables)
  }
}
