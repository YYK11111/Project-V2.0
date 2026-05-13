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
});
