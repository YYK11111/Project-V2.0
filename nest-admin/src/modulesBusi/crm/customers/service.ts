import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, SelectQueryBuilder } from "typeorm";
import { Customer } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { CustomerDto } from "./dto";
import dayjs from "dayjs";
import { User } from "src/modules/users/entities/user.entity";
import {
  CustomerViewer,
  CustomerViewerSourceType,
} from "./entities/customer-viewer.entity";
import { WorkflowHistory } from "src/modulesBusi/workflow/entity/workflow-history.entity";

@Injectable()
export class CustomersService extends BaseService<Customer, CustomerDto> {
  constructor(
    @InjectRepository(Customer) repository: Repository<Customer>,
    @InjectRepository(CustomerViewer)
    private readonly viewerRepository: Repository<CustomerViewer>,
  ) {
    super(Customer, repository);
  }

  async save(dto: any) {
    const operatorId = dto?._operatorId;
    this.normalizeNullableFields(dto);
    if (!dto.code) {
      dto.code = await this.generateCustomerCode();
    }
    const result = await super.save(dto);
    const saved = Array.isArray(result) ? result[0] : result;
    if (saved?.id) {
      await this.ensureCreatorViewer(saved.id, operatorId || saved.createUser);
    }
    return result;
  }

  async add(dto: any) {
    this.normalizeNullableFields(dto);
    if (!dto.code) {
      dto.code = await this.generateCustomerCode();
    }
    return super.add(dto);
  }

  private canViewAllCustomers(permissions: string[] = []) {
    return (
      permissions.includes("*") ||
      permissions.includes("business/crm/customers/listAll")
    );
  }

  private canManageAllCustomers(permissions: string[] = []) {
    return (
      permissions.includes("*") ||
      permissions.includes("business/crm/customers/manageAll")
    );
  }

  async getVisibleCustomerIds(
    operatorId: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) return [];
    if (this.canViewAllCustomers(permissions)) return null;
    const operatorKeys = this.getOperatorKeys(operatorId, operatorName);
    const viewers = await this.viewerRepository.find({
      where: {
        userId: In(operatorKeys),
        isDelete: null as any,
      } as any,
      select: ["customerId"] as any,
    });
    return Array.from(
      new Set(viewers.map((item) => String(item.customerId)).filter(Boolean)),
    );
  }

  async applyCustomerVisibility(
    queryBuilder: SelectQueryBuilder<Customer>,
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    if (!operatorId || this.canViewAllCustomers(permissions)) return;
    const visibleCustomerIds = await this.getVisibleCustomerIds(
      String(operatorId),
      operatorName,
      permissions,
    );
    if (!visibleCustomerIds?.length) {
      queryBuilder.andWhere("customer.createUser IN (:...creatorKeys)", {
        creatorKeys: this.getOperatorKeys(operatorId, operatorName),
      });
      return;
    }
    queryBuilder.andWhere(
      "(customer.createUser IN (:...creatorKeys) OR customer.id IN (:...visibleCustomerIds))",
      {
        creatorKeys: this.getOperatorKeys(operatorId, operatorName),
        visibleCustomerIds,
      },
    );
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Customer>> {
    const {
      name,
      code,
      shortName,
      level,
      status,
      industry,
      salesId,
      _operatorId,
      _operatorName,
      _operatorPermissions,
    } = query as any;

    const queryBuilder = this.repository
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.sales", "sales")
      .where("customer.isDelete IS NULL");

    if (name)
      queryBuilder.andWhere("customer.name LIKE :name", { name: `%${name}%` });
    if (code)
      queryBuilder.andWhere("customer.code LIKE :code", { code: `%${code}%` });
    if (shortName) {
      queryBuilder.andWhere("customer.shortName LIKE :shortName", {
        shortName: `%${shortName}%`,
      });
    }
    if (level) queryBuilder.andWhere("customer.level = :level", { level });
    if (status) queryBuilder.andWhere("customer.status = :status", { status });
    if (industry) {
      queryBuilder.andWhere("customer.industry = :industry", { industry });
    }
    if (salesId) {
      queryBuilder.andWhere("customer.salesId = :salesId", { salesId });
    }

    await this.applyCustomerVisibility(
      queryBuilder,
      _operatorId,
      _operatorName,
      Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
    );

    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const [list, total] = await queryBuilder
      .orderBy("customer.createTime", "DESC")
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total } as any;
  }

  async getCustomerDetail(query: string | Record<string, any>) {
    const detailQuery =
      typeof query === "string"
        ? { id: query }
        : {
            id: query.id,
            _operatorId: query._operatorId,
            _operatorName: query._operatorName,
            _operatorPermissions: query._operatorPermissions || [],
          };
    const customer = await this.getOne(detailQuery);
    // Query interactions directly to avoid circular dependency
    const interactions = await this.repository.manager.query(
      "SELECT * FROM crm_interaction WHERE customer_id = ? AND is_delete IS NULL ORDER BY create_time DESC",
      [detailQuery.id],
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

  async assertCustomerReadable(
    customerId: string,
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    if (!operatorId || this.canViewAllCustomers(permissions)) return;
    const customer = await this.repository.findOne({
      where: { id: customerId, isDelete: null as any } as any,
      select: ["id", "createUser"] as any,
    });
    if (!customer) throw new NotFoundException("客户不存在");
    if (this.isCustomerCreator(customer, operatorId, operatorName)) return;
    const viewer = await this.viewerRepository.findOne({
      where: {
        customerId,
        userId: In(this.getOperatorKeys(operatorId, operatorName)),
        isDelete: null as any,
      } as any,
      select: ["id"] as any,
    });
    if (!viewer) throw new ForbiddenException("当前无查看该客户的权限");
  }

  async assertCustomerWritable(
    customerId: string,
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    if (!operatorId || this.canManageAllCustomers(permissions)) return;
    const customer = await this.repository.findOne({
      where: { id: customerId, isDelete: null as any } as any,
      select: ["id", "createUser"] as any,
    });
    if (!customer) throw new NotFoundException("客户不存在");
    if (!this.isCustomerCreator(customer, operatorId, operatorName)) {
      throw new ForbiddenException("当前无编辑该客户的权限");
    }
  }

  async update(dto: any) {
    if (dto.id) {
      await this.assertCustomerWritable(
        String(dto.id),
        dto._operatorId,
        dto._operatorName,
        dto._operatorPermissions || [],
      );
    }
    return super.update(dto);
  }

  async del(
    ids: string[] | string,
    updateUser?: string,
    permissions: string[] = [],
    operatorName?: string,
    operatorId?: string,
  ) {
    const idList = Array.isArray(ids)
      ? ids
      : String(ids || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    for (const id of idList) {
      await this.assertCustomerWritable(
        id,
        operatorId,
        operatorName,
        permissions,
      );
    }
    return super.del(idList, updateUser, permissions, operatorName, operatorId);
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
        where: {
          id: query.id,
        },
        relations: ["sales"],
      },
      isError,
    );
    if (!customer) return customer;
    await this.assertCustomerReadable(
      customer.id,
      query?._operatorId,
      query?._operatorName,
      query?._operatorPermissions || [],
    );

    return {
      ...customer,
      sales: this.mapUserSummary(customer.sales),
    };
  }

  private async ensureViewer(
    customerId: string,
    userId: string,
    sourceType: CustomerViewerSourceType,
    operatorId?: string,
  ) {
    if (!customerId || !userId) return;
    const exists = await this.viewerRepository.findOne({
      where: {
        customerId: String(customerId),
        userId: String(userId),
        sourceType,
        isDelete: null as any,
      } as any,
      select: ["id"] as any,
    });
    if (exists) return;
    await this.viewerRepository.save(
      new CustomerViewer({
        customerId: String(customerId),
        userId: String(userId),
        sourceType,
        canEdit: "0",
        createUser: operatorId || "system",
        updateUser: operatorId || "system",
      }),
    );
  }

  private async ensureCreatorViewer(customerId: string, userId?: string) {
    if (!userId) return;
    await this.ensureViewer(
      customerId,
      userId,
      CustomerViewerSourceType.creator,
      userId,
    );
  }

  async grantCustomerViewAccess(
    customerId: string,
    userIds: string[] = [],
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    await this.assertCustomerWritable(
      customerId,
      operatorId,
      operatorName,
      permissions,
    );
    const normalizedUserIds = Array.from(
      new Set(userIds.map((item) => String(item || "")).filter(Boolean)),
    );
    for (const userId of normalizedUserIds) {
      await this.ensureViewer(
        customerId,
        userId,
        CustomerViewerSourceType.manual,
        operatorId,
      );
    }
    return { success: true, userIds: normalizedUserIds };
  }

  async revokeCustomerViewAccess(
    customerId: string,
    userId: string,
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    await this.assertCustomerWritable(
      customerId,
      operatorId,
      operatorName,
      permissions,
    );
    await this.viewerRepository.update(
      {
        customerId,
        userId,
        sourceType: CustomerViewerSourceType.manual,
        isDelete: null as any,
      } as any,
      { isDelete: "1" as any, updateUser: operatorId } as any,
    );
    return { success: true };
  }

  async getCustomerAuthUsers(
    customerId: string,
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    await this.assertCustomerReadable(
      customerId,
      operatorId,
      operatorName,
      permissions,
    );
    return this.viewerRepository.find({
      where: {
        customerId,
        sourceType: CustomerViewerSourceType.manual,
        isDelete: null as any,
      } as any,
      order: { createTime: "DESC" } as any,
    });
  }

  async syncApprovalParticipants(customerId: string, instanceId: string) {
    if (!customerId || !instanceId) return { success: true, userIds: [] };
    const histories = await this.repository.manager
      .getRepository(WorkflowHistory)
      .find({
        where: {
          instanceId,
          isDelete: null as any,
        } as any,
        select: ["operatorId"] as any,
      });
    const userIds: string[] = Array.from(
      new Set(
        (histories || [])
          .map((item) => String(item.operatorId || ""))
          .filter(Boolean),
      ),
    );
    for (const userId of userIds) {
      await this.ensureViewer(
        customerId,
        userId,
        CustomerViewerSourceType.approval,
        "system",
      );
    }
    return { success: true, userIds };
  }

  private normalizeNullableFields(
    dto: Partial<CustomerDto> & { salesId?: string },
  ) {
    if (dto.salesId === "") {
      dto.salesId = null as never;
    }
  }

  private getOperatorKeys(operatorId?: string, operatorName?: string) {
    return Array.from(
      new Set(
        [operatorId, operatorName]
          .map((item) => String(item || ""))
          .filter(Boolean),
      ),
    );
  }

  private isCustomerCreator(
    customer: Pick<Customer, "createUser">,
    operatorId?: string,
    operatorName?: string,
  ) {
    return this.getOperatorKeys(operatorId, operatorName).includes(
      String(customer.createUser || ""),
    );
  }
}
