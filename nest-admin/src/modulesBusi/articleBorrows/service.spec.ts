import dayjs from "dayjs";
import { ArticleBorrowsService } from "./service";
import { KnowledgeBorrowStatus } from "./entity";

describe("ArticleBorrowsService 工作流借阅申请", () => {
  const createService = () => {
    const borrowRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(async (payload) => ({
        ...payload,
        id: payload.id || "borrow-1",
      })),
      createQueryBuilder: jest.fn(),
    };
    const articleRepo = {
      findOne: jest.fn(),
    };
    const tasksService = {
      deleteTimeout: jest.fn(),
      addTimeout: jest.fn(),
    };
    const workflowService = {
      startBusinessWorkflow: jest.fn().mockResolvedValue({
        id: "wf-1",
        definitionId: "def-1",
        definitionCode: "article-borrow",
        status: "1",
        currentNodeId: "node-1",
        startTime: "2026-05-15 10:00:00",
      }),
    };
    const approvalContextService = {
      createFromWorkflowStart: jest.fn(),
      syncParticipantsFromWorkflow: jest.fn(),
    };
    const service = new ArticleBorrowsService(
      borrowRepo as any,
      articleRepo as any,
      tasksService as any,
      { getOne: jest.fn() } as any,
      { isJobEnabled: jest.fn(), runJob: jest.fn() } as any,
      workflowService as any,
      approvalContextService as any,
    );
    return {
      service,
      borrowRepo,
      articleRepo,
      workflowService,
      approvalContextService,
    };
  };

  it("提交借阅申请后创建借阅单并发起 articleBorrow 工作流", async () => {
    const {
      service,
      borrowRepo,
      articleRepo,
      workflowService,
      approvalContextService,
    } = createService();
    const requestedStartTime = dayjs()
      .add(1, "day")
      .format("YYYY-MM-DD HH:mm:ss");
    articleRepo.findOne.mockResolvedValue({
      id: "article-1",
      catalogId: "catalog-1",
      catalog: {
        allowBorrow: "1",
        maxBorrowDays: 7,
        needBorrowReason: "1",
      },
    });
    borrowRepo.findOne.mockResolvedValue(null);
    borrowRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });

    const result = await service.apply(
      {
        articleId: "article-1",
        requestedDays: 3,
        requestedStartTime,
        applyReason: "需要查阅项目交付方案",
      },
      { id: "u1", name: "申请人" },
    );

    expect(result.status).toBe(KnowledgeBorrowStatus.pending);
    expect(result.requestedStartTime).toBe(requestedStartTime);
    expect(workflowService.startBusinessWorkflow).toHaveBeenCalledWith(
      {
        businessType: "articleBorrow",
        businessScene: "approval",
        businessKey: "articleBorrow_borrow-1",
        variables: expect.objectContaining({
          starterId: "u1",
          businessType: "articleBorrow",
          articleId: "article-1",
          catalogId: "catalog-1",
        }),
      },
      "u1",
    );
    expect(approvalContextService.createFromWorkflowStart).toHaveBeenCalledWith(
      expect.objectContaining({
        businessType: "articleBorrow",
        businessId: "borrow-1",
        businessScene: "approval",
        sceneTitle: "知识借阅审批",
        rootBusinessType: "articleBorrow",
        rootBusinessId: "borrow-1",
        starterId: "u1",
      }),
    );
    expect(borrowRepo.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "borrow-1",
        workflowInstanceId: "wf-1",
        approvalStatus: "1",
        currentNodeName: "借阅审批中",
      }),
    );
  });

  it("审批列表应在数据库查询层过滤审批人、状态、关键词并分页", async () => {
    const { service, borrowRepo } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: "borrow-1",
            status: KnowledgeBorrowStatus.pending,
            article: {
              title: "交付方案",
              catalog: { managers: [{ userId: "u-manager" }] },
            },
          },
        ],
        1,
      ]),
    };
    borrowRepo.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.listPending(
      {
        pageNum: 2,
        pageSize: 5,
        keyword: "交付",
        status: KnowledgeBorrowStatus.pending,
      } as any,
      { id: "u-manager", permissions: [] },
    );

    expect(borrowRepo.find).not.toHaveBeenCalled();
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      "catalog.managers",
      "catalogManager",
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "catalogManager.userId = :managerUserId",
      { managerUserId: "u-manager" },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "borrow.status = :status",
      {
        status: KnowledgeBorrowStatus.pending,
      },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "(article.title LIKE :keyword OR catalog.name LIKE :keyword OR applicant.name LIKE :keyword OR applicant.nickname LIKE :keyword OR borrow.applyReason LIKE :keyword)",
      { keyword: "%交付%" },
    );
    expect(queryBuilder.distinct).toHaveBeenCalledWith(true);
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(result.total).toBe(1);
    expect(result.list).toHaveLength(1);
  });

  it("已通过旧状态不应继续作为有效借阅授权", async () => {
    const { service, borrowRepo } = createService();
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    borrowRepo.createQueryBuilder.mockReturnValue(queryBuilder);

    await service.hasActiveBorrow("article-1", "u1");

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "borrow.status = :status",
      { status: KnowledgeBorrowStatus.active },
    );
  });
});
