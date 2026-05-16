import {
  getMessageScene,
  listMessageScenes,
  MESSAGE_SCENE_KEYS,
} from "./message-scenes";
import { MessageType } from "./entity";

describe("message scenes", () => {
  it("识别流程审批待办场景", () => {
    const scene = getMessageScene({
      messageType: MessageType.todo,
      sourceType: "workflow_task",
    });

    expect(scene).toEqual(
      expect.objectContaining({
        key: MESSAGE_SCENE_KEYS.workflowApprovalTodo,
        label: "流程审批待办",
        supportedTemplates: expect.objectContaining({
          feishu: "workflowTodo",
        }),
      }),
    );
  });

  it("识别流程待阅通知场景", () => {
    const scene = getMessageScene({
      messageType: MessageType.cc,
      sourceType: "workflow_instance",
    });

    expect(scene?.key).toBe(MESSAGE_SCENE_KEYS.workflowInstanceCc);
  });

  it("识别项目提醒场景", () => {
    const scene = getMessageScene({
      messageType: MessageType.cc,
      sourceType: "project_alert",
    });

    expect(scene?.key).toBe(MESSAGE_SCENE_KEYS.projectAlert);
  });

  it("按任务 reminderType 识别任务业务场景", () => {
    expect(
      getMessageScene({
        messageType: MessageType.todo,
        sourceType: "task",
        extraData: { reminderType: "taskAssigned" },
      })?.key,
    ).toBe(MESSAGE_SCENE_KEYS.taskAssignment);
    expect(
      getMessageScene({
        messageType: MessageType.cc,
        sourceType: "task",
        extraData: { reminderType: "taskDelayed" },
      })?.key,
    ).toBe(MESSAGE_SCENE_KEYS.taskStatus);
    expect(
      getMessageScene({
        messageType: MessageType.cc,
        sourceType: "task_reminder",
        extraData: { reminderType: "taskDueSoon" },
      })?.key,
    ).toBe(MESSAGE_SCENE_KEYS.taskReminderDueSoon);
    expect(
      getMessageScene({
        messageType: MessageType.todo,
        sourceType: "task_reminder",
        extraData: { reminderType: "taskOverdue" },
      })?.key,
    ).toBe(MESSAGE_SCENE_KEYS.taskReminderOverdue);
    expect(
      getMessageScene({
        messageType: MessageType.todo,
        sourceType: "task_reminder",
        extraData: { reminderType: "taskReportStale" },
      })?.key,
    ).toBe(MESSAGE_SCENE_KEYS.taskReminderReportStale);
  });

  it("未知消息不匹配业务场景", () => {
    expect(
      getMessageScene({
        messageType: MessageType.cc,
        sourceType: "unknown",
      }),
    ).toBeNull();
  });

  it("返回稳定的业务场景列表", () => {
    const scenes = listMessageScenes();

    expect(scenes.map((item) => item.key)).toEqual([
      MESSAGE_SCENE_KEYS.workflowApprovalTodo,
      MESSAGE_SCENE_KEYS.workflowInstanceCc,
      MESSAGE_SCENE_KEYS.projectAlert,
      MESSAGE_SCENE_KEYS.taskAssignment,
      MESSAGE_SCENE_KEYS.taskStatus,
      MESSAGE_SCENE_KEYS.taskReminderDueSoon,
      MESSAGE_SCENE_KEYS.taskReminderOverdue,
      MESSAGE_SCENE_KEYS.taskReminderReportStale,
    ]);
  });

  it("所有业务场景都声明飞书发送模板", () => {
    const scenes = listMessageScenes();

    expect(
      scenes.every((scene) => Boolean(scene.supportedTemplates.feishu)),
    ).toBe(true);
  });
});
