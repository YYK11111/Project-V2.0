import { of, throwError } from "rxjs";
import { FeishuNotifyProvider } from "./feishu.provider";

describe("FeishuNotifyProvider", () => {
  const oldEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...oldEnv,
      FEISHU_ENABLED: "true",
      FEISHU_APP_ID: "app_1",
      FEISHU_APP_SECRET: "secret_1",
      FEISHU_BASE_URL: "https://open.feishu.test",
    };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  it("获取并缓存 tenant_access_token 后发送文本消息", async () => {
    const httpService = {
      post: jest
        .fn()
        .mockResolvedValueOnce(
          of({
            data: {
              code: 0,
              tenant_access_token: "tenant-token",
              expire: 7200,
            },
          }),
        )
        .mockResolvedValueOnce(
          of({ data: { code: 0, data: { message_id: "m1" } } }),
        )
        .mockResolvedValueOnce(
          of({ data: { code: 0, data: { message_id: "m2" } } }),
        ),
    };
    const provider = new FeishuNotifyProvider(httpService as any);

    await provider.sendText({ externalUserId: "ou_1" } as any, {
      receiverId: "1",
      title: "审批待办",
      content: "您有一个新的审批任务",
      linkUrl: "http://localhost:1994/workflow/tasks",
    });
    await provider.sendText({ externalUserId: "ou_1" } as any, {
      receiverId: "1",
      title: "审批待办2",
      content: "您有一个新的审批任务",
    });

    expect(httpService.post).toHaveBeenCalledTimes(3);
    expect(httpService.post).toHaveBeenNthCalledWith(
      1,
      "https://open.feishu.test/open-apis/auth/v3/tenant_access_token/internal",
      { app_id: "app_1", app_secret: "secret_1" },
    );
    expect(httpService.post).toHaveBeenNthCalledWith(
      2,
      "https://open.feishu.test/open-apis/im/v1/messages",
      expect.objectContaining({
        receive_id: "ou_1",
        msg_type: "text",
      }),
      expect.objectContaining({
        params: { receive_id_type: "user_id" },
        headers: { Authorization: "Bearer tenant-token" },
      }),
    );
  });

  it("发送文本消息时普通外部用户ID按 user_id 发送", async () => {
    const httpService = {
      post: jest
        .fn()
        .mockResolvedValueOnce(
          of({
            data: {
              code: 0,
              tenant_access_token: "tenant-token",
              expire: 7200,
            },
          }),
        )
        .mockResolvedValueOnce(
          of({ data: { code: 0, data: { message_id: "m1" } } }),
        ),
    };
    const provider = new FeishuNotifyProvider(httpService as any);

    await provider.sendText({ externalUserId: "6400000001" } as any, {
      receiverId: "1",
      title: "审批待办",
      content: "您有一个新的审批任务",
    });

    expect(httpService.post).toHaveBeenNthCalledWith(
      2,
      "https://open.feishu.test/open-apis/im/v1/messages",
      expect.objectContaining({
        receive_id: "6400000001",
        msg_type: "text",
      }),
      expect.objectContaining({
        params: { receive_id_type: "user_id" },
        headers: { Authorization: "Bearer tenant-token" },
      }),
    );
  });

  it("发送工作流待办时使用飞书卡片并带审批入口", async () => {
    const httpService = {
      post: jest
        .fn()
        .mockResolvedValueOnce(
          of({
            data: {
              code: 0,
              tenant_access_token: "tenant-token",
              expire: 7200,
            },
          }),
        )
        .mockResolvedValueOnce(
          of({ data: { code: 0, data: { message_id: "m1" } } }),
        ),
    };
    const provider = new FeishuNotifyProvider(httpService as any);

    await provider.sendText(
      { externalUserId: "6400000001" } as any,
      {
        receiverId: "1",
        templateKey: "workflowTodo",
        title: "待办审批：项目立项",
        content: "您有一个新的审批任务待处理。",
        linkUrl:
          "https://admin.example.com/projectManage/approval?id=19&taskId=task-1",
        extraData: {
          businessLabel: "客户项目A",
          starterName: "张三",
          nodeName: "项目经理审批",
        },
      },
      {
        enabled: true,
        feishu: {
          enabled: true,
          appId: "app_1",
          appSecret: "secret_1",
          baseUrl: "https://open.feishu.test",
        },
      } as any,
    );

    const payload = httpService.post.mock.calls[1][1];
    const card = JSON.parse(payload.content);

    expect(payload).toEqual(
      expect.objectContaining({
        receive_id: "6400000001",
        msg_type: "interactive",
      }),
    );
    expect(card.header.title.content).toBe("待办审批：项目立项");
    expect(JSON.stringify(card)).toContain("客户项目A");
    expect(JSON.stringify(card)).toContain("项目经理审批");
    expect(JSON.stringify(card)).toContain("去审批");
    expect(JSON.stringify(card)).toContain(
      "https://admin.example.com/projectManage/approval?id=19&taskId=task-1",
    );
    expect(card.config).toEqual(
      expect.objectContaining({ wide_screen_mode: true, update_multi: true }),
    );
  });

  it("更新工作流待办卡片时调用飞书消息更新接口并切换状态颜色", async () => {
    const httpService = {
      post: jest.fn().mockResolvedValueOnce(
        of({
          data: {
            code: 0,
            tenant_access_token: "tenant-token",
            expire: 7200,
          },
        }),
      ),
      patch: jest
        .fn()
        .mockResolvedValueOnce(of({ data: { code: 0, data: {} } })),
    };
    const provider = new FeishuNotifyProvider(httpService as any);

    await provider.updateWorkflowTodoCard(
      "om_message_1",
      {
        receiverId: "1",
        templateKey: "workflowTodo",
        title: "待办审批：项目立项",
        content: "您有一个新的审批任务待处理。",
        linkUrl:
          "https://admin.example.com/projectManage/approval?id=19&taskId=task-1",
        extraData: {
          businessLabel: "客户项目A",
          starterName: "张三",
          nodeName: "项目经理审批",
        },
      },
      { status: "approved", statusText: "已同意" },
      {
        enabled: true,
        feishu: {
          enabled: true,
          appId: "app_1",
          appSecret: "secret_1",
          baseUrl: "https://open.feishu.test",
        },
      } as any,
    );

    expect(httpService.patch).toHaveBeenCalledWith(
      "https://open.feishu.test/open-apis/im/v1/messages/om_message_1",
      expect.objectContaining({
        content: expect.any(String),
      }),
      expect.objectContaining({
        headers: { Authorization: "Bearer tenant-token" },
      }),
    );
    const card = JSON.parse(httpService.patch.mock.calls[0][1].content);
    expect(card.header.template).toBe("green");
    expect(JSON.stringify(card)).toContain("已同意");
    expect(JSON.stringify(card)).toContain("查看详情");
  });

  it("通过邮箱和手机号批量获取飞书用户ID", async () => {
    const httpService = {
      post: jest
        .fn()
        .mockResolvedValueOnce(
          of({
            data: {
              code: 0,
              tenant_access_token: "tenant-token",
              expire: 7200,
            },
          }),
        )
        .mockResolvedValueOnce(
          of({
            data: {
              code: 0,
              data: {
                user_list: [{ user_id: "ou_1", email: "u1@example.com" }],
              },
            },
          }),
        ),
    };
    const provider = new FeishuNotifyProvider(httpService as any);

    await expect(
      provider.batchGetUserId({
        emails: ["u1@example.com"],
        mobiles: ["13800138000"],
      }),
    ).resolves.toEqual([{ user_id: "ou_1", email: "u1@example.com" }]);
    expect(httpService.post).toHaveBeenNthCalledWith(
      2,
      "https://open.feishu.test/open-apis/contact/v3/users/batch_get_id",
      {
        emails: ["u1@example.com"],
        mobiles: ["13800138000"],
      },
      expect.objectContaining({
        params: { user_id_type: "user_id" },
        headers: { Authorization: "Bearer tenant-token" },
      }),
    );
  });

  it("通过 UserID 获取飞书用户详情", async () => {
    const httpService = {
      post: jest.fn().mockResolvedValueOnce(
        of({
          data: {
            code: 0,
            tenant_access_token: "tenant-token",
            expire: 7200,
          },
        }),
      ),
      get: jest.fn().mockResolvedValueOnce(
        of({
          data: {
            code: 0,
            data: {
              user: {
                user_id: "ou_1",
                open_id: "open_1",
                union_id: "union_1",
                name: "用户1",
                email: "u1@example.com",
                mobile: "13800138000",
              },
            },
          },
        }),
      ),
    };
    const provider = new FeishuNotifyProvider(httpService as any);

    await expect(provider.getUserDetail("ou_1")).resolves.toEqual(
      expect.objectContaining({
        user_id: "ou_1",
        open_id: "open_1",
        name: "用户1",
      }),
    );
    expect(httpService.get).toHaveBeenCalledWith(
      "https://open.feishu.test/open-apis/contact/v3/users/ou_1",
      { user_id_type: "user_id" },
      expect.objectContaining({
        headers: { Authorization: "Bearer tenant-token" },
      }),
    );
  });

  it("发送消息时透出飞书接口返回的错误信息", async () => {
    const requestError: any = new Error("Request failed with status code 400");
    requestError.response = {
      status: 400,
      data: { code: 99991663, msg: "receive_id invalid" },
    };
    const httpService = {
      post: jest
        .fn()
        .mockResolvedValueOnce(
          of({
            data: {
              code: 0,
              tenant_access_token: "tenant-token",
              expire: 7200,
            },
          }),
        )
        .mockResolvedValueOnce(throwError(requestError)),
    };
    const provider = new FeishuNotifyProvider(httpService as any);

    await expect(
      provider.sendText({ externalUserId: "ou_old" } as any, {
        receiverId: "1",
        title: "飞书通知测试",
        content: "测试内容",
      }),
    ).rejects.toThrow(
      "发送飞书消息失败：receive_id invalid（code: 99991663，status: 400）",
    );
  });
});
