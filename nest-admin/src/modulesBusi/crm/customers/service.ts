import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { Customer } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { CustomerDto } from "./dto";
import dayjs from "dayjs";
import { User } from "src/modules/users/entities/user.entity";

@Injectable()
export class CustomersService extends BaseService<Customer, CustomerDto> {
  constructor(@InjectRepository(Customer) repository: Repository<Customer>) {
    super(Customer, repository);
  }

  async save(dto: any) {
    if (!dto.code) {
      dto.code = await this.generateCustomerCode();
    }
    return super.save(dto);
  }

  async add(dto: any) {
    if (!dto.code) {
      dto.code = await this.generateCustomerCode();
    }
    return super.add(dto);
  }

  buildApprovalViewModel(entity?: {
    approvalStatus?: string | null;
    currentNodeName?: string | null;
  }) {
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

  async list(query: QueryListDto): Promise<ResponseListDto<Customer>> {
    const { name, code, shortName, level, status, industry, salesId } = query;

    // Build where conditions dynamically to avoid empty In([]) issues
    let whereConditions: any = {};

    if (name) {
      whereConditions.name = this.sqlLike(name);
    }
    if (code) {
      whereConditions.code = this.sqlLike(code);
    }
    if (shortName) {
      whereConditions.shortName = this.sqlLike(shortName);
    }
    if (level) {
      whereConditions.level = level;
    }
    if (status) {
      whereConditions.status = status;
    }
    if (industry) {
      whereConditions.industry = industry;
    }
    if (salesId) {
      whereConditions.salesId = salesId;
    }

    const queryOrm: FindManyOptions = {
      where: whereConditions,
      relations: ["sales"],
    };

    const result = await this.listBy(queryOrm, query);
    for (const row of result.list || []) {
      Object.assign(row, {
        approvalView: this.buildApprovalViewModel(row),
      });
    }
    return result;
  }

  async getCustomerDetail(id: string) {
    const customer = await this.getOne({ id });
    // Query interactions directly to avoid circular dependency
    const interactions = await this.repository.manager.query(
      "SELECT * FROM crm_interaction WHERE customer_id = ? AND is_delete IS NULL ORDER BY create_time DESC",
      [id],
    );
    return { ...customer, interactions };
  }

  async getCustomerStats(salesId?: string) {
    const where = salesId ? { salesId } : {};
    const [total, vip, important, regular, active] = await Promise.all([
      this.count({ where }),
      this.count({ where: { ...where, level: "1" } }),
      this.count({ where: { ...where, level: "2" } }),
      this.count({ where: { ...where, level: "3" } }),
      this.count({ where: { ...where, status: "3" } }),
    ]);
    return { total, vip, important, regular, active };
  }

  // Count method for stats
  async count(options: any): Promise<number> {
    return this.repository.count(options);
  }

  private async generateCustomerCode() {
    const datePart = dayjs().format("YYYYMMDD");
    const prefix = `CUS-${datePart}-`;
    const list = await this.repository.find({
      where: { code: this.sqlLike(prefix) as any },
      order: { code: "DESC" as any },
      take: 1,
    });
    const latestCode = list[0]?.code || "";
    const currentSeq = Number(latestCode.split("-").pop() || 0);
    return `${prefix}${String(currentSeq + 1).padStart(4, "0")}`;
  }

  private mapUserSummary(user?: User | null) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }

  async getOne(query, isError = true): Promise<any | null> {
    const customer = await super.getOne(
      {
        where: query,
        relations: ["sales"],
      },
      isError,
    );
    if (!customer) return customer;

    return {
      ...customer,
      sales: this.mapUserSummary(customer.sales),
      approvalView: this.buildApprovalViewModel(customer),
    };
  }
}
