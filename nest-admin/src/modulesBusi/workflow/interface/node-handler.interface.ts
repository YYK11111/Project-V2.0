import { NodeType, NodeExecutionContext, NodeResult } from './node.interface';

/**
 * 节点处理器接口
 */
export interface INodeHandler {
  /** 节点类型 */
  readonly nodeType: NodeType;

  /**
   * 进入节点
   * @param context 执行上下文
   */
  onEnter?(context: NodeExecutionContext): Promise<void>;

  /**
   * 执行节点
   * @param context 执行上下文
   * @returns 执行结果
   */
  execute(context: NodeExecutionContext): Promise<NodeResult>;

  /**
   * 退出节点
   * @param context 执行上下文
   */
  onExit?(context: NodeExecutionContext): Promise<void>;
}
