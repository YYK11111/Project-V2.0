import { getMetadataArgsStorage } from "typeorm";
import { BusinessApprovalParticipant } from "./business-approval-participant.entity";

describe("BusinessApprovalParticipant 索引", () => {
  it("声明审批可见性查询需要的复合索引", () => {
    const indices = getMetadataArgsStorage().indices.filter(
      (item) => item.target === BusinessApprovalParticipant,
    );
    const indexMap = new Map(
      indices.map((item) => [
        item.name,
        typeof item.columns === "function"
          ? item.columns(BusinessApprovalParticipant)
          : item.columns,
      ]),
    );

    expect(indexMap.get("idx_bap_user_root")).toEqual([
      "userId",
      "rootBusinessType",
      "rootBusinessId",
    ]);
    expect(indexMap.get("idx_bap_user_business")).toEqual([
      "userId",
      "businessType",
      "businessId",
    ]);
    expect(indexMap.get("idx_bap_workflow_role")).toEqual([
      "workflowInstanceId",
      "roleType",
    ]);
  });
});
