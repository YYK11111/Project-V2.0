import { MyEntity, BaseEntity, BaseColumn } from "src/common/entity/BaseEntity";

@MyEntity("project_cockpit_snapshot")
export class ProjectCockpitSnapshot extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "project_id", comment: "项目ID" })
  projectId: string;

  @BaseColumn({
    length: 20,
    name: "snapshot_date",
    comment: "快照日期 YYYY-MM-DD",
  })
  snapshotDate: string;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "health_score",
    comment: "健康度得分",
  })
  healthScore: number;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "risk_count",
    comment: "高风险数量",
  })
  riskCount: number;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "knowledge_update_count",
    comment: "知识最近更新数",
  })
  knowledgeUpdateCount: number;

  @BaseColumn({
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
    name: "cost_variance",
    comment: "成本偏差",
  })
  costVariance: number;
}
