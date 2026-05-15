import { of } from "rxjs";
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
        .mockResolvedValueOnce(of({ data: { code: 0, data: { message_id: "m1" } } }))
        .mockResolvedValueOnce(of({ data: { code: 0, data: { message_id: "m2" } } })),
    };
    const provider = new FeishuNotifyProvider(httpService as any);

    await provider.sendText(
      { externalUserId: "ou_1" } as any,
      {
        receiverId: "1",
        title: "审批待办",
        content: "您有一个新的审批任务",
        linkUrl: "http://localhost:1994/workflow/tasks",
      },
    );
    await provider.sendText(
      { externalUserId: "ou_1" } as any,
      {
        receiverId: "1",
        title: "审批待办2",
        content: "您有一个新的审批任务",
      },
    );

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
      {
        headers: { Authorization: "Bearer tenant-token" },
      },
    );
  });
});
