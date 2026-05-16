import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Between, Repository, SelectQueryBuilder } from "typeorm";
import { Customer } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { CustomerDto } from "./dto";
import dayjs from "dayjs";
import { User } from "src/modules/users/entities/user.entity";
import {
  CustomerViewer,
  CustomerViewerSourceType,
  CustomerViewerGrantType,
  CustomerViewerStatus,
} from "./entities/customer-viewer.entity";
import {
  CustomerViewerRecord,
  CustomerViewerRecordActionType,
} from "./entities/customer-viewer-record.entity";
import { MessagesService } from "src/modules/messages/service";
import { WorkflowHistory } from "src/modulesBusi/workflow/entity/workflow-history.entity";
import { WorkflowInstance } from "src/modulesBusi/workflow/entity/workflow-instance.entity";
import { InstanceStatus } from "src/modulesBusi/workflow/interface/node-type.enum";
import { hasModuleFullAccess } from "src/common/utils/business-list-permission";
import { BusinessApprovalContextService } from "src/modulesBusi/approval-contexts/service";

@Injectable()
export class CustomersService extends BaseService<Customer, CustomerDto> {
  constructor(
    @InjectRepository(Customer) repository: Repository<Customer>,
    @InjectRepository(CustomerViewer)
    private readonly viewerRepository: Repository<CustomerViewer>,
    private readonly businessApprovalContextService?: BusinessApprovalContextService,
    @Optional()
    private readonly messagesService?: MessagesService,
    @Optional()
    @InjectRepository(CustomerViewerRecord)
    private readonly viewerRecordRepository?: Repository<CustomerViewerRecord>,
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
    return hasModuleFullAccess(permissions, "business/crm/customers/list");
  }

  private canManageAllCustomers(permissions: string[] = []) {
    return hasModuleFullAccess(permissions, "business/crm/customers/update");
  }

  private isViewerEditable(viewer: CustomerViewer) {
    return this.isViewerActive(viewer) && String(viewer.canEdit || "") === "1";
  }

  private async getCustomerVisibilityInfo(
    operatorId: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) {
      return {
        visibleCustomerIds: [],
        editableCustomerIds: [],
      };
    }

    const operatorKeys = this.getOperatorKeys(operatorId, operatorName);
    const viewers = await this.viewerRepository.find({
      where: {
        userId: In(operatorKeys),
        isDelete: null as any,
        status: CustomerViewerStatus.enabled,
      } as any,
      select: [
        "customerId",
        "canEdit",
        "grantType",
        "startTime",
        "endTime",
        "status",
      ] as any,
    });
    const approvalVisibleCustomerIds = this.canViewAllCustomers(permissions)
      ? []
      : (await this.businessApprovalContextService?.findVisibleBusinessIdsForUser(
          operatorId,
          "customer",
        )) || [];
    const activeViewers = viewers.filter((viewer) =>
      this.isViewerActive(viewer),
    );
    const visibleCustomerIds = this.canViewAllCustomers(permissions)
      ? null
      : Array.from(
          new Set(
            [
              ...activeViewers.map((item) => String(item.customerId)),
              ...approvalVisibleCustomerIds,
            ].filter(Boolean),
          ),
        );
    const editableCustomerIds = Array.from(
      new Set(
        activeViewers
          .filter((viewer) => String(viewer.canEdit || "") === "1")
          .map((viewer) => String(viewer.customerId))
          .filter(Boolean),
      ),
    );

    return {
      visibleCustomerIds,
      editableCustomerIds,
    };
  }

  async getVisibleCustomerIds(
    operatorId: string,
    operatorName?: string,
    permissions: string[] = [],
  ) {
    return (
      await this.getCustomerVisibilityInfo(
        operatorId,
        operatorName,
        permissions,
      )
    ).visibleCustomerIds;
  }

  async applyCustomerVisibility(
    queryBuilder: SelectQueryBuilder<Customer>,
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
    visibilityInfo?: {
      visibleCustomerIds: string[] | null;
      editableCustomerIds: string[];
    },
  ) {
    if (!operatorId || this.canViewAllCustomers(permissions)) return;
    const info =
      visibilityInfo ||
      (await this.getCustomerVisibilityInfo(
        String(operatorId),
        operatorName,
        permissions,
      ));
    const visibleCustomerIds = info.visibleCustomerIds;
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

    const visibilityInfo = await this.getCustomerVisibilityInfo(
      _operatorId,
      _operatorName,
      Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
    );

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
      visibilityInfo,
    );

    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const [list, total] = await queryBuilder
      .orderBy("customer.createTime", "DESC")
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const editableCustomerIds = new Set(
      visibilityInfo.editableCustomerIds || [],
    );
    for (const customer of list as any[]) {
      customer.permissionContext = {
        canEdit:
          this.canManageAllCustomers(
            Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
          ) ||
          this.isCustomerCreator(customer, _operatorId, _operatorName) ||
          editableCustomerIds.has(String(customer.id)),
      };
    }

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
        status: CustomerViewerStatus.enabled as any,
      } as any,
      select: ["id", "grantType", "startTime", "endTime", "status"] as any,
    });
    if (!viewer || !this.isViewerActive(viewer)) {
      const hasApprovalAccess =
        await this.businessApprovalContextService?.hasBusinessParticipantAccess(
          operatorId,
          "customer",
          customerId,
        );
      if (!hasApprovalAccess)
        throw new ForbiddenException("当前无查看该客户的权限");
    }
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
    if (
      !this.isCustomerCreator(customer, operatorId, operatorName) &&
      !this.canManageAllCustomers(permissions)
    ) {
      const viewer = await this.viewerRepository.findOne({
        where: {
          customerId,
          userId: In(this.getOperatorKeys(operatorId, operatorName)),
          isDelete: null as any,
          status: CustomerViewerStatus.enabled as any,
        } as any,
        select: [
          "id",
          "canEdit",
          "grantType",
          "startTime",
          "endTime",
          "status",
        ] as any,
      });
      if (!viewer || !this.isViewerEditable(viewer)) {
        throw new ForbiddenException("当前无编辑该客户的权限");
      }
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
    const reconciledCustomer =
      await this.reconcileCustomerApprovalStatus(customer);
    await this.assertCustomerReadable(
      reconciledCustomer.id,
      query?._operatorId,
      query?._operatorName,
      query?._operatorPermissions || [],
    );
    const permissionContext = await this.buildCustomerPermissionContext(
      reconciledCustomer,
      query?._operatorId,
      query?._operatorName,
      query?._operatorPermissions || [],
    );

    return {
      ...reconciledCustomer,
      sales: this.mapUserSummary(reconciledCustomer.sales),
      permissionContext,
    };
  }

  private async reconcileCustomerApprovalStatus(customer: Customer) {
    if (
      String(customer.approvalStatus || "") !== "1" ||
      !customer.workflowInstanceId
    ) {
      return customer;
    }

    const instanceRepository =
      this.repository.manager.getRepository(WorkflowInstance);
    const instance = await instanceRepository.findOne({
      where: { id: customer.workflowInstanceId } as any,
      select: ["id", "status", "endTime"] as any,
    });
    if (!instance || instance.status === InstanceStatus.RUNNING) {
      return customer;
    }

    const historyRepository =
      this.repository.manager.getRepository(WorkflowHistory);
    const endHistory = await historyRepository.findOne({
      where: {
        instanceId: customer.workflowInstanceId,
        nodeName: "结束",
        action: "execute",
        isDelete: null as any,
      } as any,
      select: ["id"] as any,
    });
    const isCompleted =
      instance.status === InstanceStatus.COMPLETED || !!endHistory?.id;
    const nextState = isCompleted
      ? {
          status: "2",
          approvalStatus: "2",
          currentNodeName: "客户审批已通过，转为意向客户",
        }
      : {
          status: "4",
          approvalStatus: "3",
          currentNodeName: "客户审批已驳回，实例已结束",
        };
    await this.repository.update(customer.id, nextState as any);
    Object.assign(customer, nextState);
    return customer;
  }

  private async buildCustomerPermissionContext(
    customer: Pick<Customer, "id" | "createUser">,
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
    visibilityInfo?: {
      visibleCustomerIds: string[] | null;
      editableCustomerIds: string[];
    },
  ) {
    const canManageAll = this.canManageAllCustomers(permissions);
    const canEditByCreator = this.isCustomerCreator(
      customer,
      operatorId,
      operatorName,
    );
    if (canManageAll || canEditByCreator) {
      return { canEdit: true };
    }

    if (!operatorId) {
      return { canEdit: false };
    }

    if (visibilityInfo) {
      return {
        canEdit:
          !canManageAll &&
          visibilityInfo.editableCustomerIds.includes(String(customer.id)),
      };
    }

    const viewer = await this.viewerRepository.findOne({
      where: {
        customerId: String(customer.id),
        userId: In(this.getOperatorKeys(operatorId, operatorName)),
        isDelete: null as any,
        status: CustomerViewerStatus.enabled as any,
      } as any,
      select: [
        "id",
        "canEdit",
        "grantType",
        "startTime",
        "endTime",
        "status",
      ] as any,
    });
    const canEdit = !!viewer && this.isViewerEditable(viewer);
    return { canEdit };
  }

  private async ensureViewer(
    customerId: string,
    userId: string,
    sourceType: CustomerViewerSourceType,
    operatorId?: string,
    grantType?: CustomerViewerGrantType,
    startTime?: Date,
    endTime?: Date,
    canEdit?: string,
    grantReason?: string,
  ): Promise<CustomerViewer | undefined> {
    if (!customerId || !userId) return undefined;
    const exists = await this.viewerRepository.findOne({
      where: {
        customerId: String(customerId),
        userId: String(userId),
        sourceType,
        isDelete: null as any,
      } as any,
      select: ["id"] as any,
    });
    if (exists?.id) {
      await this.viewerRepository.update(
        { id: exists.id } as any,
        {
          grantType: grantType || CustomerViewerGrantType.permanent,
          startTime,
          endTime,
          canEdit: canEdit === "1" ? "1" : "0",
          grantReason,
          grantUserId: this.getNullableUserId(operatorId),
          revokeUserId: null,
          revokeTime: null,
          revokeReason: null,
          status: CustomerViewerStatus.enabled,
          updateUser: operatorId || "system",
        } as any,
      );
      return new CustomerViewer({
        id: exists.id,
        customerId: String(customerId),
        userId: String(userId),
        sourceType,
        grantType: grantType || CustomerViewerGrantType.permanent,
        startTime,
        endTime,
        canEdit: canEdit === "1" ? "1" : "0",
        grantReason,
        grantUserId: this.getNullableUserId(operatorId),
        status: CustomerViewerStatus.enabled,
      });
    }
    return this.viewerRepository.save(
      new CustomerViewer({
        customerId: String(customerId),
        userId: String(userId),
        sourceType,
        grantType: grantType || CustomerViewerGrantType.permanent,
        startTime,
        endTime,
        canEdit: canEdit === "1" ? "1" : "0",
        grantReason,
        grantUserId: this.getNullableUserId(operatorId),
        createUser: operatorId || "system",
        updateUser: operatorId || "system",
      }),
    );
  }

  private createViewerBatchNo(actionType: string) {
    return `customer-viewer-${actionType}-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}`;
  }

  private async saveViewerRecords(records: CustomerViewerRecord[]) {
    if (!records.length || !this.viewerRecordRepository) return;
    await this.viewerRecordRepository.save(records);
  }

  private getUserRepository(): Repository<User> {
    return this.repository.manager.getRepository(User);
  }

  async allocatedViewerList(
    customerId: string,
    query: { pageNum?: number; pageSize?: number },
    operator: { id?: string; name?: string; permissions?: string[] } = {},
  ) {
    await this.assertCustomerReadable(
      customerId,
      operator.id,
      operator.name,
      operator.permissions || [],
    );
    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const [viewers, total] = await (this.viewerRepository as any).findAndCount({
      where: {
        customerId,
        sourceType: CustomerViewerSourceType.manual,
        status: CustomerViewerStatus.enabled,
        isDelete: null as any,
      } as any,
      order: { createTime: "DESC" } as any,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });
    const userIds = viewers.map((viewer) => String(viewer.userId));
    const users = userIds.length
      ? await this.getUserRepository().find({
          where: { id: In(userIds), isDelete: null as any } as any,
          relations: ["dept"],
        })
      : [];
    const userMap = new Map(users.map((user) => [String(user.id), user]));
    const list = viewers.map((viewer) => {
      const user = userMap.get(String(viewer.userId)) as any;
      return {
        ...(user || {}),
        id: viewer.userId,
        viewerId: viewer.id,
        customerId: viewer.customerId,
        grantType: viewer.grantType,
        startTime: viewer.startTime,
        endTime: viewer.endTime,
        canEdit: viewer.canEdit,
        grantReason: viewer.grantReason,
        grantUserId: viewer.grantUserId,
        grantTime: viewer.createTime,
        status: viewer.status,
        deptName: user?.dept?.name || "",
      };
    });
    return { list, total };
  }

  async unallocatedViewerList(
    customerId: string,
    query: { pageNum?: number; pageSize?: number; userName?: string },
    operator: { id?: string; name?: string; permissions?: string[] } = {},
  ) {
    await this.assertCustomerWritable(
      customerId,
      operator.id,
      operator.name,
      operator.permissions || [],
    );
    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const viewers = await this.viewerRepository.find({
      where: {
        customerId,
        sourceType: CustomerViewerSourceType.manual,
        status: CustomerViewerStatus.enabled,
        isDelete: null as any,
      } as any,
      select: ["userId"] as any,
    });
    const allocatedUserIds = viewers.map((viewer) => String(viewer.userId));
    const entity = this.getUserRepository().createQueryBuilder("user");
    entity.where("user.isDelete IS NULL");
    entity.leftJoinAndSelect("user.dept", "dept");
    if (allocatedUserIds.length) {
      entity.andWhere("user.id NOT IN (:...allocatedUserIds)", {
        allocatedUserIds,
      });
    }
    if (query.userName) {
      entity.andWhere("user.name LIKE :userName", {
        userName: `%${query.userName}%`,
      });
    }
    const total = await entity.getCount();
    const list = await entity
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getMany();
    return { list, total };
  }

  async viewerRecords(
    customerId: string,
    query: { pageNum?: number; pageSize?: number },
    operator: { id?: string; name?: string; permissions?: string[] } = {},
  ) {
    await this.assertCustomerReadable(
      customerId,
      operator.id,
      operator.name,
      operator.permissions || [],
    );
    if (!this.viewerRecordRepository) {
      return { list: [], total: 0 };
    }
    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const [records] = await this.viewerRecordRepository.findAndCount({
      where: { customerId, isDelete: null as any } as any,
      order: { operateTime: "DESC" as any, createTime: "DESC" as any },
    });
    const batchMap = new Map<string, any>();
    for (const record of records as any[]) {
      const batchNo = record.batchNo || record.id;
      const batch =
        batchMap.get(batchNo) ||
        ({
          batchNo,
          actionType: record.actionType,
          operatorId: record.operatorId,
          operatorName: record.operatorName,
          operateTime: record.operateTime,
          grantType: record.grantType,
          startTime: record.startTime,
          endTime: record.endTime,
          canEdit: record.canEdit,
          grantReason: record.grantReason,
          revokeReason: record.revokeReason,
          items: [],
        } as any);
      batch.items.push(record);
      batch.userCount = batch.items.length;
      batchMap.set(batchNo, batch);
    }
    const allList = Array.from(batchMap.values());
    const list = allList.slice((pageNum - 1) * pageSize, pageNum * pageSize);
    return { list, total: allList.length };
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
    options?: {
      grantType?: CustomerViewerGrantType;
      startTime?: Date;
      endTime?: Date;
      canEdit?: string;
      grantReason?: string;
    },
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
        options?.grantType,
        options?.startTime,
        options?.endTime,
        options?.canEdit,
        options?.grantReason,
      );
    }
    return { success: true, userIds: normalizedUserIds };
  }

  async selectCustomerViewers(
    customerId: string,
    dto: {
      userIds?: string[];
      grantType?: CustomerViewerGrantType;
      startTime?: Date;
      endTime?: Date;
      canEdit?: string;
      grantReason?: string;
    },
    operator: {
      id?: string;
      name?: string;
      permissions?: string[];
    } = {},
  ) {
    await this.assertCustomerWritable(
      customerId,
      operator.id,
      operator.name,
      operator.permissions || [],
    );
    const normalizedUserIds = Array.from(
      new Set(
        (dto.userIds || []).map((item) => String(item || "")).filter(Boolean),
      ),
    );
    const batchNo = this.createViewerBatchNo("grant");
    const records: CustomerViewerRecord[] = [];
    for (const userId of normalizedUserIds) {
      const viewer = await this.ensureViewer(
        customerId,
        userId,
        CustomerViewerSourceType.manual,
        operator.id,
        dto.grantType,
        dto.startTime,
        dto.endTime,
        dto.canEdit,
        dto.grantReason,
      );
      records.push(
        new CustomerViewerRecord({
          customerId,
          batchNo,
          actionType: CustomerViewerRecordActionType.grant,
          viewerId: viewer?.id,
          userId,
          grantType: dto.grantType || CustomerViewerGrantType.permanent,
          startTime: dto.startTime,
          endTime: dto.endTime,
          canEdit: dto.canEdit === "1" ? "1" : "0",
          grantReason: dto.grantReason,
          operatorId: this.getNullableUserId(operator.id),
          operatorName: operator.name,
          operateTime: new Date(),
          status: CustomerViewerStatus.enabled,
          createUser: operator.id || "system",
          updateUser: operator.id || "system",
        }),
      );
    }
    await this.saveViewerRecords(records);
    return { success: true, batchNo, userIds: normalizedUserIds };
  }

  async revokeCustomerViewAccess(
    customerId: string,
    userId: string,
    operatorId?: string,
    operatorName?: string,
    permissions: string[] = [],
    options?: { reason?: string },
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
      {
        status: CustomerViewerStatus.disabled,
        revokeUserId: this.getNullableUserId(operatorId),
        revokeTime: new Date(),
        revokeReason: options?.reason,
        updateUser: operatorId || "system",
      } as any,
    );
    return { success: true, reason: options?.reason };
  }

  async cancelCustomerViewer(
    customerId: string,
    dto: { userId: string; reason?: string },
    operator: { id?: string; name?: string; permissions?: string[] } = {},
  ) {
    return this.cancelCustomerViewers(
      customerId,
      { userIds: [dto.userId], reason: dto.reason },
      operator,
    );
  }

  async cancelCustomerViewers(
    customerId: string,
    dto: { userIds?: string[]; reason?: string },
    operator: { id?: string; name?: string; permissions?: string[] } = {},
  ) {
    await this.assertCustomerWritable(
      customerId,
      operator.id,
      operator.name,
      operator.permissions || [],
    );
    const userIds = Array.from(
      new Set(
        (dto.userIds || []).map((item) => String(item || "")).filter(Boolean),
      ),
    );
    if (!userIds.length) return { success: true, count: 0 };
    const viewers = await this.viewerRepository.find({
      where: {
        customerId,
        userId: In(userIds),
        sourceType: CustomerViewerSourceType.manual,
        isDelete: null as any,
      } as any,
    });
    const result = await this.viewerRepository.update(
      {
        customerId,
        userId: In(userIds),
        sourceType: CustomerViewerSourceType.manual,
        isDelete: null as any,
      } as any,
      {
        status: CustomerViewerStatus.disabled,
        revokeUserId: this.getNullableUserId(operator.id),
        revokeTime: new Date(),
        revokeReason: dto.reason,
        updateUser: operator.id || "system",
      } as any,
    );
    const batchNo = this.createViewerBatchNo(
      userIds.length > 1 ? "revokeAll" : "revoke",
    );
    await this.saveViewerRecords(
      viewers.map(
        (viewer) =>
          new CustomerViewerRecord({
            customerId,
            batchNo,
            actionType: CustomerViewerRecordActionType.revoke,
            viewerId: viewer.id,
            userId: viewer.userId,
            grantType: viewer.grantType,
            startTime: viewer.startTime,
            endTime: viewer.endTime,
            canEdit: viewer.canEdit,
            revokeReason: dto.reason,
            operatorId: this.getNullableUserId(operator.id),
            operatorName: operator.name,
            operateTime: new Date(),
            status: CustomerViewerStatus.disabled,
            createUser: operator.id || "system",
            updateUser: operator.id || "system",
          }),
      ),
    );
    return { success: true, count: result.affected || viewers.length };
  }

  async updateViewerStatus(
    customerId: string,
    viewerIds: string[],
    status: CustomerViewerStatus,
    operatorId?: string,
  ) {
    if (!viewerIds.length) return { success: true, count: 0 };
    const result = await this.viewerRepository.update(
      {
        id: In(viewerIds),
        customerId,
        sourceType: CustomerViewerSourceType.manual,
        isDelete: null as any,
      } as any,
      { status, updateUser: operatorId } as any,
    );
    return { success: true, count: result.affected || 0 };
  }

  async getExpiringViewers(daysAhead: number = 7) {
    const now = new Date();
    const futureDate = new Date(
      now.getTime() + daysAhead * 24 * 60 * 60 * 1000,
    );
    return this.viewerRepository.find({
      where: {
        status: CustomerViewerStatus.enabled,
        grantType: CustomerViewerGrantType.temporary,
        endTime: Between(now, futureDate),
        isDelete: null as any,
      } as any,
    });
  }

  async expireViewers(viewerIds: string[]) {
    if (!viewerIds.length) return { success: true, count: 0 };
    const result = await this.viewerRepository.update(
      {
        id: In(viewerIds),
        status: CustomerViewerStatus.enabled,
        isDelete: null as any,
      } as any,
      { status: CustomerViewerStatus.disabled, updateUser: "system" } as any,
    );
    return { success: true, count: result.affected || 0 };
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

  private getNullableUserId(userId?: string) {
    if (!userId || userId === "system") return null;
    return userId;
  }

  private isViewerActive(viewer: CustomerViewer): boolean {
    if (viewer.status !== CustomerViewerStatus.enabled) return false;
    if (viewer.grantType === CustomerViewerGrantType.permanent) return true;
    const now = new Date();
    if (viewer.startTime && new Date(viewer.startTime) > now) return false;
    if (viewer.endTime && new Date(viewer.endTime) < now) return false;
    return true;
  }
}
