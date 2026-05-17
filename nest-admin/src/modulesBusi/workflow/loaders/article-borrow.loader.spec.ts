import { ArticleBorrowLoader } from "./article-borrow.loader";

describe("ArticleBorrowLoader", () => {
  it("按 articleBorrow 业务键加载借阅申请、知识和分类管理员", async () => {
    const borrowRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: "borrow-1",
        articleId: "article-1",
        catalogId: "catalog-1",
        userId: "u1",
        applyReason: "申请查阅",
        requestedDays: 3,
        requestedStartTime: "2026-05-16 10:00:00",
        status: "pending",
        article: {
          id: "article-1",
          title: "交付方案",
          catalog: {
            id: "catalog-1",
            name: "项目知识",
            managers: [{ userId: "manager-1" }],
          },
        },
        applicant: {
          id: "u1",
          name: "zhangsan",
          nickname: "张三",
          deptId: "dept-1",
        },
      }),
    };
    const loader = new ArticleBorrowLoader(borrowRepo as any);

    const result = await loader.load("articleBorrow_borrow-1");

    expect(borrowRepo.findOne).toHaveBeenCalledWith({
      where: { id: "borrow-1" },
      relations: [
        "article",
        "article.catalog",
        "article.catalog.managers",
        "applicant",
      ],
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: "borrow-1",
        type: "articleBorrow",
        data: expect.objectContaining({
          articleTitle: "交付方案",
          applicant: expect.objectContaining({ id: "u1" }),
          catalog: expect.objectContaining({
            id: "catalog-1",
            managerUserIds: ["manager-1"],
          }),
        }),
      }),
    );
  });
});
