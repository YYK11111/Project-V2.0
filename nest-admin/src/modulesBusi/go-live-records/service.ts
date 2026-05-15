import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, In, Repository } from "typeorm";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { SaveDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { GoLiveRecordDto } from "./dto";
import {
  GoLiveRecord,
  GoLiveRecordStatus,
  goLiveRecordStatusMap,
} from "./entity";
import { ProjectExecutionPermissionService } from "../projects/project-execution-permission.service";
import { appendProjectOperationPermissions } from "src/common/utils/project-operation-permission";

@Injectable()
export class GoLiveRecordsService extends BaseService<
  GoLiveRecord,
  GoLiveRecordDto
> {
  constructor(
    @InjectRepository(GoLiveRecord) repository: Repository<GoLiveRecord>,
    private readonly projectExecutionPermissionService: ProjectExecutionPermissionService,
  ) {
    super(GoLiveRecord, repository);
  }

  private stripUserControlledFields(dto: SaveDto<GoLiveRecordDto>) {
    delete (dto as any).status;
    delete (dto as any).actualGoLiveTime;
  }

  private getCurrentDateTime() {
    const value = new Date();
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  private async assertRecordProjectPermissionById(
    recordId: string,
    operatorId?: string,
    permissions: string[] = [],
  ) {
    if (!operatorId) return null;
    const record = await this.repository.findOne({
      where: { id: recordId, isDelete: null as any } as any,
      select: ["id", "projectId"] as any,
    });
    if (!record) throw new Error("数据不存在");
    if (record.projectId) {
      await this.projectExecutionPermissionService.assertReadableProject(
        record.projectId,
        operatorId,
        permissions,
        "business/go-live-records/manageAll",
      );
    }
    return record;
  }

  private async assertRecordProjectPermissionForDto(
    dto: SaveDto<GoLiveRecordDto>,
  ) {
    const operatorId = String(dto._operatorId || "");
    const operatorPermissions = Array.isArray((dto as any)._operatorPermissions)
      ? (dto as any)._operatorPermissions
      : [];
    if (!operatorId) return;
    let oldProjectId = "";
    if (dto.id) {
      const record = await this.repository.findOne({
        where: { id: String(dto.id), isDelete: null as any } as any,
        select: ["id", "projectId"] as any,
      });
      if (!record) throw new Error("数据不存在");
      oldProjectId = String(record.projectId || "");
      if (oldProjectId) {
        await this.projectExecutionPermissionService.assertWritableProject(
          oldProjectId,
          operatorId,
          operatorPermissions,
          "business/go-live-records/manageAll",
        );
      }
    }
    const nextProjectId = String(dto.projectId || "");
    if (nextProjectId && nextProjectId !== oldProjectId) {
      await this.projectExecutionPermissionService.assertWritableProject(
        nextProjectId,
        operatorId,
        operatorPermissions,
        "business/go-live-records/manageAll",
      );
    }
  }

  private isPersonalReadableRecord(record: GoLiveRecord, operatorId: string) {
    if (!operatorId) return false;
    return String(record.ownerId || "") === String(operatorId);
  }

  private async assertRecordReadPermission(
    record: GoLiveRecord,
    operatorId: string,
    permissions: string[] = [],
  ) {
    if (!operatorId || !record.projectId) return;
    try {
      await this.projectExecutionPermissionService.assertReadableProject(
        record.projectId,
        operatorId,
        permissions,
        "business/go-live-records/manageAll",
      );
    } catch (error) {
      if (this.isPersonalReadableRecord(record, operatorId)) return;
      throw error;
    }
  }

  async list(query: QueryListDto): Promise<ResponseListDto<GoLiveRecord>> {
    const { title, projectId, status, _operatorId, _operatorPermissions } =
      query as any;
    const visibleProjectIds =
      await this.projectExecutionPermissionService.getVisibleProjectIds(
        String(_operatorId || ""),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
        "business/go-live-records/manageAll",
      );
    const shouldUsePersonalRecordScope =
      Boolean(_operatorId) &&
      Array.isArray(visibleProjectIds) &&
      !visibleProjectIds.length;
    if (
      visibleProjectIds &&
      !visibleProjectIds.length &&
      !shouldUsePersonalRecordScope
    ) {
      return { data: [], total: 0, _flag: true } as any;
    }
    const explicitProjectId = String(projectId || "");
    if (
      explicitProjectId &&
      visibleProjectIds &&
      !visibleProjectIds.includes(explicitProjectId) &&
      !shouldUsePersonalRecordScope
    ) {
      return { data: [], total: 0, _flag: true } as any;
    }
    const projectIdFilter =
      explicitProjectId ||
      (visibleProjectIds ? In(visibleProjectIds) : undefined);
    const queryOrm: FindManyOptions = {
      where: {
        title: this.sqlLike(title),
        projectId: shouldUsePersonalRecordScope
          ? explicitProjectId || undefined
          : projectIdFilter,
        status,
        ownerId: shouldUsePersonalRecordScope ? String(_operatorId) : undefined,
      },
      relations: ["project", "owner"],
      order: { createTime: "DESC" },
    };
    const result = await this.listBy(queryOrm, query);
    if (_operatorId) {
      await appendProjectOperationPermissions(
        result,
        this.projectExecutionPermissionService,
        String(_operatorId),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
        "business/go-live-records/manageAll",
      );
    }
    return result;
  }

  getStatuses() {
    return goLiveRecordStatusMap;
  }

  async getOne(query, isError = true): Promise<any | null> {
    const { _operatorId, _operatorPermissions, ...where } = query as any;
    const record = await super.getOne(
      {
        where,
        relations: ["project", "owner"],
      },
      isError,
    );
    if (!record) return record;
    if (_operatorId) {
      await this.assertRecordReadPermission(
        record,
        String(_operatorId),
        Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
      );
    }
    return record;
  }

  async save(dto: SaveDto<GoLiveRecordDto>) {
    this.stripUserControlledFields(dto);
    await this.assertRecordProjectPermissionForDto(dto);
    return super.save(dto);
  }

  async add(dto: SaveDto<GoLiveRecordDto>) {
    this.stripUserControlledFields(dto);
    await this.assertRecordProjectPermissionForDto(dto);
    return super.add(dto);
  }

  async update(dto: SaveDto<GoLiveRecordDto>) {
    this.stripUserControlledFields(dto);
    await this.assertRecordProjectPermissionForDto(dto);
    return super.update(dto);
  }

  private async getRecordForSystemAction(
    id: string,
    expectedStatus: GoLiveRecordStatus,
    operatorId?: string,
    permissions: string[] = [],
  ) {
    const record = await this.repository.findOne({
      where: { id, isDelete: null as any } as any,
      select: ["id", "projectId", "status", "actualGoLiveTime"] as any,
    });
    if (!record) throw new Error("数据不存在");
    if (record.status !== expectedStatus) {
      throw new BadRequestException(
        `上线单当前状态必须为${goLiveRecordStatusMap[expectedStatus]}`,
      );
    }
    if (operatorId && record.projectId) {
      await this.projectExecutionPermissionService.assertWritableProject(
        record.projectId,
        operatorId,
        permissions,
        "business/go-live-records/manageAll",
      );
    }
    return record;
  }

  async startGoLive(
    id: string,
    operatorId?: string,
    permissions: string[] = [],
  ) {
    await this.getRecordForSystemAction(
      id,
      GoLiveRecordStatus.approved,
      operatorId,
      permissions,
    );
    await this.repository.update(id, {
      status: GoLiveRecordStatus.executing,
    } as any);
    return { success: true };
  }

  async confirmSuccess(
    id: string,
    operatorId?: string,
    permissions: string[] = [],
  ) {
    await this.getRecordForSystemAction(
      id,
      GoLiveRecordStatus.executing,
      operatorId,
      permissions,
    );
    await this.repository.update(id, {
      status: GoLiveRecordStatus.succeeded,
      actualGoLiveTime: this.getCurrentDateTime(),
    } as any);
    return { success: true };
  }

  async confirmRollback(
    id: string,
    operatorId?: string,
    permissions: string[] = [],
  ) {
    const record = await this.getRecordForSystemAction(
      id,
      GoLiveRecordStatus.executing,
      operatorId,
      permissions,
    );
    await this.repository.update(id, {
      status: GoLiveRecordStatus.rolledBack,
      actualGoLiveTime: record.actualGoLiveTime || this.getCurrentDateTime(),
    } as any);
    return { success: true };
  }

  async del(
    ids: string[] | string,
    updateUser?: string,
    permissions: string[] = [],
    operatorName?: string,
    operatorId?: string,
  ) {
    const idList = Array.isArray(ids)
      ? ids.map((item) => String(item))
      : String(ids || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    const successIds: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];
    if (operatorId) {
      for (const id of idList) {
        try {
          await this.assertRecordProjectPermissionById(
            id,
            operatorId,
            permissions,
          );
          successIds.push(id);
        } catch (error) {
          failed.push({
            id,
            reason: error?.message || "当前无删除该上线记录的权限",
          });
        }
      }
    } else {
      successIds.push(...idList);
    }
    if (!successIds.length) {
      return {
        successCount: 0,
        failedCount: failed.length,
        successIds: [],
        failed,
      } as any;
    }
    const result = await super.del(
      successIds,
      updateUser,
      permissions,
      operatorName,
      operatorId,
    );
    return {
      ...result,
      successCount: successIds.length,
      failedCount: failed.length,
      successIds,
      failed,
    } as any;
  }
}
