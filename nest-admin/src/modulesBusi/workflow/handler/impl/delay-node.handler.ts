import { Injectable } from '@nestjs/common';
import { INodeHandler } from '../../interface/node-handler.interface';
import { NodeType, NodeExecutionContext, NodeResult, DelayNodeProperties } from '../../interface/node.interface';
import { WorkflowInstance } from '../../entity/workflow-instance.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * 延时节点处理器
 *
 * 注意：当前为内存延时实现，仅适用于开发测试环境。
 * 生产环境建议使用持久化任务队列（如 BullMQ）实现可靠的延时调度。
 */
@Injectable()
export class DelayNodeHandler implements INodeHandler {
  readonly nodeType = NodeType.DELAY;

  constructor(
    @InjectRepository(WorkflowInstance)
    private instanceRepo: Repository<WorkflowInstance>,
  ) {}

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    const props = context.variables._nodeProperties as DelayNodeProperties;
    const delayMs = this.calculateDelayTime(props, context.variables);

    console.log(`[Delay] Node ${context.nodeId} delays ${delayMs}ms for instance ${context.instanceId}`);

    if (delayMs <= 0) {
      // 无延时，立即继续
      return {
        success: true,
        nextNodeIds: [],
        outputData: { status: 'no_delay' },
      };
    }

    // 延时调度：在后台继续流程
    // 注意：此实现不保证服务器重启后仍能继续，建议生产环境使用任务队列
    setTimeout(async () => {
      try {
        console.log(`[Delay] Resuming after ${delayMs}ms for instance ${context.instanceId}`);
        // 通知工作流引擎继续执行（通过更新实例状态或发送事件）
        // 当前为占位实现，实际需要工作流引擎支持异步resume
        await this.instanceRepo.update(
          { id: context.instanceId },
          { currentNodeId: context.nodeId },
        );
      } catch (error) {
        console.error(`[Delay] Failed to resume workflow: ${error.message}`);
      }
    }, delayMs);

    // 立即返回，不阻塞流程
    return {
      success: true,
      nextNodeIds: [],
      outputData: { status: 'delay_scheduled', delayMs },
    };
  }

  /**
   * 计算延时时间（毫秒）
   */
  calculateDelayTime(properties: DelayNodeProperties, variables: Record<string, any>): number {
    if (properties.delayType === 'variable') {
      const value = variables[properties.delayVariable || ''];
      return Number(value) || 0;
    }
    return properties.delayValue || 0;
  }
}
