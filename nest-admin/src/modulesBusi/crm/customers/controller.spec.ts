import { CustomersController } from "./controller";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { CustomersService } from "./service";
import { WorkflowIntegrationService } from "src/common/services/workflow-integration.service";

describe("CustomersController", () => {
  const service = {
    grantCustomerViewAccess: jest.fn(),
    revokeCustomerViewAccess: jest.fn(),
    getCustomerAuthUsers: jest.fn(),
    allocatedViewerList: jest.fn(),
    unallocatedViewerList: jest.fn(),
    selectCustomerViewers: jest.fn(),
    cancelCustomerViewer: jest.fn(),
    cancelCustomerViewers: jest.fn(),
    viewerRecords: jest.fn(),
  };
  const workflowService = {
    startCustomerApproval: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("授权接口只授予客户查看权限", async () => {
    const controller = new CustomersController(
      service as any,
      workflowService as any,
    );
    service.grantCustomerViewAccess.mockResolvedValue({
      success: true,
      userIds: ["u2"],
    });

    const result = await controller.grantViewAccess(
      "c1",
      { userIds: ["u2"] },
      { user: { id: "u1", name: "yyk", permissions: [] } },
    );

    expect(service.grantCustomerViewAccess).toHaveBeenCalledWith(
      "c1",
      ["u2"],
      "u1",
      "yyk",
      [],
    );
    expect(result).toEqual({ success: true, userIds: ["u2"] });
  });

  it("授权接口应透传允许编辑与授权配置", async () => {
    const controller = new CustomersController(
      service as any,
      workflowService as any,
    );
    service.grantCustomerViewAccess.mockResolvedValue({
      success: true,
      userIds: ["u2"],
    });

    await controller.grantCustomerViewAccess(
      {
        customerId: "c1",
        userIds: ["u2"],
        grantType: "temporary" as any,
        startTime: "2026-05-16 10:00:00",
        endTime: "2026-05-17 10:00:00",
        canEdit: "1",
        grantReason: "客户协同编辑",
      },
      { user: { id: "u1", name: "yyk", permissions: [] } },
    );

    expect(service.grantCustomerViewAccess).toHaveBeenCalledWith(
      "c1",
      ["u2"],
      "u1",
      "yyk",
      [],
      expect.objectContaining({
        grantType: "temporary",
        startTime: new Date("2026-05-16 10:00:00"),
        endTime: new Date("2026-05-17 10:00:00"),
        canEdit: "1",
        grantReason: "客户协同编辑",
      }),
    );
  });

  it("授权用户查询接口应匹配客户授权路由", async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        { provide: CustomersService, useValue: service },
        { provide: WorkflowIntegrationService, useValue: workflowService },
      ],
    }).compile();
    const app: INestApplication = moduleRef.createNestApplication();
    await app.init();

    service.getCustomerAuthUsers.mockResolvedValue([
      { customerId: "7", userId: "u2", sourceType: "manual" },
    ]);

    const response = await request(app.getHttpServer())
      .get("/business/crm/customers/7/auth-users")
      .send();

    expect(response.status).toBe(200);
    expect(service.getCustomerAuthUsers).toHaveBeenCalledWith(
      "7",
      undefined,
      undefined,
      [],
    );
    expect(response.body).toEqual([
      { customerId: "7", userId: "u2", sourceType: "manual" },
    ]);

    await app.close();
  });

  it("角色式新增授权接口应透传客户、用户与授权配置", async () => {
    const controller = new CustomersController(
      service as any,
      workflowService as any,
    );
    service.selectCustomerViewers.mockResolvedValue({
      success: true,
      userIds: ["u2", "u3"],
    });

    const result = await controller.selectCustomerViewers(
      "c1",
      {
        userIds: ["u2", "u3"],
        grantType: "temporary" as any,
        startTime: "2026-05-16 10:00:00",
        endTime: "2026-05-17 10:00:00",
        canEdit: "1",
        grantReason: "协同跟进",
      },
      { user: { id: "u1", name: "yyk", permissions: ["p1"] } },
    );

    expect(service.selectCustomerViewers).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        userIds: ["u2", "u3"],
        grantType: "temporary",
        startTime: new Date("2026-05-16 10:00:00"),
        endTime: new Date("2026-05-17 10:00:00"),
        canEdit: "1",
        grantReason: "协同跟进",
      }),
      {
        id: "u1",
        name: "yyk",
        permissions: ["p1"],
      },
    );
    expect(result).toEqual({ success: true, userIds: ["u2", "u3"] });
  });

  it("角色式授权记录接口应透传客户和查询条件", async () => {
    const controller = new CustomersController(
      service as any,
      workflowService as any,
    );
    service.viewerRecords.mockResolvedValue({ list: [], total: 0 });

    await controller.getCustomerViewerRecords(
      "c1",
      { pageNum: 1, pageSize: 10 },
      { user: { id: "u1", name: "yyk", permissions: ["p1"] } },
    );

    expect(service.viewerRecords).toHaveBeenCalledWith(
      "c1",
      { pageNum: 1, pageSize: 10 },
      {
        id: "u1",
        name: "yyk",
        permissions: ["p1"],
      },
    );
  });
});
