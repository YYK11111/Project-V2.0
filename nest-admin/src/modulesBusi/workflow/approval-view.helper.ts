export type ApprovalViewEntity = {
  approvalStatus?: string | null;
  currentNodeName?: string | null;
};

export function buildApprovalViewModel(entity?: ApprovalViewEntity) {
  const approvalStatus = String(entity?.approvalStatus || "0");
  const currentNodeName = String(entity?.currentNodeName || "");
  const isReturned =
    approvalStatus === "3" && currentNodeName.includes("退回发起人");

  if (isReturned) {
    return {
      status: "returned",
      label: "已退回发起人",
      currentNodeName,
      canSubmit: false,
      canResubmit: true,
    };
  }

  const statusMap = {
    "0": {
      status: "none",
      label: "无需审批",
      canSubmit: true,
      canResubmit: false,
    },
    "1": {
      status: "pending",
      label: "审批中",
      canSubmit: false,
      canResubmit: false,
    },
    "2": {
      status: "approved",
      label: "已通过",
      canSubmit: false,
      canResubmit: false,
    },
    "3": {
      status: "rejected",
      label: "已驳回",
      canSubmit: false,
      canResubmit: true,
    },
  } as const;

  return {
    ...(statusMap[approvalStatus as keyof typeof statusMap] || {
      status: "none",
      label: "无需审批",
      canSubmit: true,
      canResubmit: false,
    }),
    currentNodeName,
  };
}
