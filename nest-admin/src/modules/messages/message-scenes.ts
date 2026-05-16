import { MessageType } from "./entity";

export const MESSAGE_SCENE_KEYS = {
  workflowApprovalTodo: "workflow.approval.todo",
  workflowInstanceCc: "workflow.instance.cc",
  projectAlert: "project.alert",
  taskAssignment: "task.assignment",
  taskStatus: "task.status",
  taskReminderDueSoon: "task.reminder.dueSoon",
  taskReminderOverdue: "task.reminder.overdue",
  taskReminderReportStale: "task.reminder.reportStale",
} as const;

export type MessageSceneKey =
  (typeof MESSAGE_SCENE_KEYS)[keyof typeof MESSAGE_SCENE_KEYS];

export type MessageScene = {
  key: MessageSceneKey;
  label: string;
  category: string;
  messageTypeLabel: string;
  description: string;
  defaultEnabledPlatforms: string[];
  supportedTemplates: Record<string, string>;
  match: (message: Partial<SceneMessage>) => boolean;
};

export type SceneMessage = {
  messageType?: string;
  sourceType?: string;
  extraData?: Record<string, any>;
};

const TASK_STATUS_REMINDER_TYPES = [
  "taskStarted",
  "taskDelayed",
  "taskCompletionApproved",
  "taskCompletionRejected",
];

export const MESSAGE_SCENES: MessageScene[] = [
  {
    key: MESSAGE_SCENE_KEYS.workflowApprovalTodo,
    label: "流程审批待办",
    category: "工作流",
    messageTypeLabel: "待办",
    description: "审批节点、加签等工作流任务生成的待办消息。",
    defaultEnabledPlatforms: ["feishu"],
    supportedTemplates: { feishu: "workflowTodo" },
    match: (message) =>
      message.messageType === MessageType.todo &&
      message.sourceType === "workflow_task",
  },
  {
    key: MESSAGE_SCENE_KEYS.workflowInstanceCc,
    label: "流程待阅通知",
    category: "工作流",
    messageTypeLabel: "待阅",
    description: "流程抄送节点、通知节点和退回发起人消息。",
    defaultEnabledPlatforms: ["feishu"],
    supportedTemplates: { feishu: "feishuText" },
    match: (message) =>
      message.messageType === MessageType.cc &&
      message.sourceType === "workflow_instance",
  },
  {
    key: MESSAGE_SCENE_KEYS.projectAlert,
    label: "项目提醒",
    category: "项目",
    messageTypeLabel: "待阅",
    description: "项目驾驶舱异常提醒同步到消息中心。",
    defaultEnabledPlatforms: ["feishu"],
    supportedTemplates: { feishu: "feishuText" },
    match: (message) =>
      message.messageType === MessageType.cc &&
      message.sourceType === "project_alert",
  },
  {
    key: MESSAGE_SCENE_KEYS.taskAssignment,
    label: "任务指派",
    category: "任务",
    messageTypeLabel: "待办",
    description: "任务创建或分配后发送给负责人和执行人的待办。",
    defaultEnabledPlatforms: ["feishu"],
    supportedTemplates: { feishu: "feishuText" },
    match: (message) =>
      message.sourceType === "task" &&
      message.extraData?.reminderType === "taskAssigned",
  },
  {
    key: MESSAGE_SCENE_KEYS.taskStatus,
    label: "任务状态通知",
    category: "任务",
    messageTypeLabel: "待办/待阅",
    description: "任务开始、延期、完成通过和完成驳回等状态变化通知。",
    defaultEnabledPlatforms: ["feishu"],
    supportedTemplates: { feishu: "feishuText" },
    match: (message) =>
      message.sourceType === "task" &&
      TASK_STATUS_REMINDER_TYPES.includes(
        String(message.extraData?.reminderType || ""),
      ),
  },
  {
    key: MESSAGE_SCENE_KEYS.taskReminderDueSoon,
    label: "任务即将到期",
    category: "任务",
    messageTypeLabel: "待阅",
    description: "定时扫描生成的任务临期提醒。",
    defaultEnabledPlatforms: ["feishu"],
    supportedTemplates: { feishu: "feishuText" },
    match: (message) =>
      message.sourceType === "task_reminder" &&
      message.extraData?.reminderType === "taskDueSoon",
  },
  {
    key: MESSAGE_SCENE_KEYS.taskReminderOverdue,
    label: "任务已逾期",
    category: "任务",
    messageTypeLabel: "待办",
    description: "定时扫描生成的任务逾期处理提醒。",
    defaultEnabledPlatforms: ["feishu"],
    supportedTemplates: { feishu: "feishuText" },
    match: (message) =>
      message.sourceType === "task_reminder" &&
      message.extraData?.reminderType === "taskOverdue",
  },
  {
    key: MESSAGE_SCENE_KEYS.taskReminderReportStale,
    label: "任务汇报提醒",
    category: "任务",
    messageTypeLabel: "待办",
    description: "定时扫描生成的长时间未汇报提醒。",
    defaultEnabledPlatforms: ["feishu"],
    supportedTemplates: { feishu: "feishuText" },
    match: (message) =>
      message.sourceType === "task_reminder" &&
      message.extraData?.reminderType === "taskReportStale",
  },
];

export function getMessageScene(
  message: Partial<SceneMessage>,
): MessageScene | null {
  return MESSAGE_SCENES.find((scene) => scene.match(message)) || null;
}

export function listMessageScenes() {
  return MESSAGE_SCENES.map(({ match, ...scene }) => scene);
}
