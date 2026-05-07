import { Column } from "typeorm";
import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

@MyEntity("system_job_execution_log")
export class SystemScheduledJobExecutionLog extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "job_key", comment: "任务编码" })
  jobKey: string;

  @BaseColumn({ name: "job_name", comment: "任务名称" })
  jobName: string;

  @BaseColumn({ name: "job_type", comment: "任务类型" })
  jobType: string;

  @BaseColumn({ comment: "所属模块" })
  module: string;

  @BaseColumn({ name: "trigger_mode", comment: "触发方式" })
  triggerMode: string;

  @BaseColumn({ nullable: true, name: "start_time", comment: "开始时间" })
  startTime: string;

  @BaseColumn({ nullable: true, name: "end_time", comment: "结束时间" })
  endTime: string;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "duration_ms",
    comment: "耗时毫秒",
  })
  durationMs: number;

  @BaseColumn({ default: "running", comment: "执行状态" })
  status: string;

  @BaseColumn({ nullable: true, comment: "结果摘要" })
  summary: string;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "processed_count",
    comment: "处理数量",
  })
  processedCount: number;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "success_count",
    comment: "成功数量",
  })
  successCount: number;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "failed_count",
    comment: "失败数量",
  })
  failedCount: number;

  @BaseColumn({
    type: "longtext",
    nullable: true,
    name: "error_message",
    comment: "错误摘要",
  })
  errorMessage: string;

  @BaseColumn({
    type: "longtext",
    nullable: true,
    name: "error_stack",
    comment: "错误堆栈",
  })
  errorStack: string;

  @Column({ type: "json", nullable: true, comment: "执行上下文" })
  payload: Record<string, unknown>;

  @BaseColumn({ nullable: true, name: "operator_id", comment: "操作人ID" })
  operatorId: string;

  @BaseColumn({ nullable: true, name: "operator_name", comment: "操作人名称" })
  operatorName: string;
}
