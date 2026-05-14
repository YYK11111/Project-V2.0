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

@Injectable()
export class GoLiveRecordsService extends BaseService<
  GoLiveRecord,
  GoLiveRecordDto
> {
  private readonly statusTransitions = {
    [GoLiveRecordStatus.draft]: [
      GoLiveRecordStatus.pendingApproval,
      GoLiveRecordStatus.cancelled,
    ],
    [GoLiveRecordStatus.pendingApproval]: [
      GoLiveRecordStatus.approved,
      GoLiveRecordStatus.cancelled,
    ],
    [GoLiveRecordStatus.approved]: [
      GoLiveRecordStatus.executing,
      GoLiveRecordStatus.cancelled,
    ],
    [GoLiveRecordStatus.executing]: [
      GoLiveRecordStatus.succeeded,
      GoLiveRecordStatus.rolledBack,
    ],
    [GoLiveRecordStatus.succeeded]: [],
    [GoLiveRecordStatus.rolledBack]: [],
    [GoLiveRecordStatus.cancelled]: [],
  };

  constructor(
    @InjectRepository(GoLiveRecord) repository: Repository<GoLiveRecord>,
    private readonly projectExecutionPermissionService: ProjectExecutionPermissionService,
  ) {
    super(GoLiveRecord, repository);
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

  private async assertStatusTransition(dto: SaveDto<GoLiveRecordDto>) {
    if (!dto.id || !Object.prototype.hasOwnProperty.call(dto, "status")) {
      return;
    }
    const nextStatus = dto.status as GoLiveRecordStatus;
    const record = await this.repository.findOne({
      where: { id: String(dto.id), isDelete: null as any } as any,
      select: ["id", "status"] as any,
    });
    if (!record) throw new Error("数据不存在");
    if (record.status === nextStatus) return;
    const allowedStatuses = this.statusTransitions[record.status] || [];
    if (!allowedStatuses.includes(nextStatus)) {
      throw new BadRequestException(
        `上线单当前状态不允许变更为${goLiveRecordStatusMap[nextStatus] || nextStatus}`,
      );
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
    if (visibleProjectIds && !visibleProjectIds.length) {
      return { data: [], total: 0, _flag: true } as any;
    }
    const explicitProjectId = String(projectId || "");
    if (
      explicitProjectId &&
      visibleProjectIds &&
      !visibleProjectIds.includes(explicitProjectId)
    ) {
      return { data: [], total: 0, _flag: true } as any;
    }
    const projectIdFilter =
      explicitProjectId ||
      (visibleProjectIds ? In(visibleProjectIds) : undefined);
    const queryOrm: FindManyOptions = {
      where: {
        title: this.sqlLike(title),
        projectId: projectIdFilter,
        status,
      },
      relations: ["project", "owner"],
      order: { createTime: "DESC" },
    };
    return this.listBy(queryOrm, query);
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
      if (record.projectId) {
        await this.projectExecutionPermissionService.assertReadableProject(
          record.projectId,
          String(_operatorId),
          Array.isArray(_operatorPermissions) ? _operatorPermissions : [],
          "business/go-live-records/manageAll",
        );
      }
    }
    return record;
  }

  async save(dto: SaveDto<GoLiveRecordDto>) {
    await this.assertRecordProjectPermissionForDto(dto);
    return super.save(dto);
  }

  async add(dto: SaveDto<GoLiveRecordDto>) {
    await this.assertRecordProjectPermissionForDto(dto);
    return super.add(dto);
  }

  async update(dto: SaveDto<GoLiveRecordDto>) {
    await this.assertRecordProjectPermissionForDto(dto);
    await this.assertStatusTransition(dto);
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
