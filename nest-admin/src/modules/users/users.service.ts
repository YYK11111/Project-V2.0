import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import {
  FindManyOptions,
  In,
  Like,
  Repository,
  UpdateResult,
  Brackets,
} from "typeorm";
import { ResponseListDto, QueryListDto } from "src/common/dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Dept } from "../depts/entities/dept.entity";
import { DataPermissionType, Role } from "../roles/entity";
import { BaseService } from "src/common/BaseService";
import { DeptService } from "../depts/depts.service";
import { HttpException } from "@nestjs/common";
import { config } from "config";
import { SysFileService } from "../sys/file/service";
import { BusinessType, FileStatus } from "../sys/file/entity";
import {
  hashPassword,
  isPasswordHashed,
  verifyPassword,
} from "src/common/utils/password";
import { SystenConfigsService } from "../configs/service";
import { BoolNum } from "src/common/type/base";

@Injectable()
export class UsersService extends BaseService<User, CreateUserDto> {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private deptService: DeptService,
    private sysFileService: SysFileService,
    private configService: SystenConfigsService,
  ) {
    super(User, usersRepository);
  }

  // add Or Update
  async save(createDto: CreateUserDto) {
    const oldUser = createDto.id
      ? await this.getOne({ id: createDto.id }, false)
      : null;
    const operatorPermissions = (createDto as any)._operatorPermissions || [];
    const canManageAdmin = this.hasPermission(
      operatorPermissions,
      "system/users/manageAdmin",
    );

    if (!createDto.id && !createDto.password) {
      createDto.password = await this.configService.getDefaultUserPassword();
      if (!createDto.password) {
        throw new Error("请先在系统配置中设置默认用户密码");
      }
    }

    if (createDto.password && !isPasswordHashed(createDto.password)) {
      createDto.password = await hashPassword(createDto.password);
      createDto.passwordVersion = 2;
    }

    if (createDto.roleIds?.length && !canManageAdmin) {
      const adminRole = await this.usersRepository.manager
        .getRepository(Role)
        .findOne({ where: { permissionKey: config.adminKey } });
      if (
        adminRole &&
        createDto.roleIds.map(String).includes(String(adminRole.id))
      ) {
        throw new HttpException("接口无权限", 403);
      }
    }

    if (createDto.avatar) {
      createDto.avatar = this.normalizeStoredPath(createDto.avatar);
    }

    // let data = new User()
    // createDto.dept = Object.assign(new Dept(), { id: createDto.deptId })
    delete createDto.dept;
    createDto.roles = createDto.roleIds?.map((id) =>
      Object.assign(new Role(), { id }),
    );
    const savedUser = await super.save(createDto);

    if (savedUser.avatar && savedUser.avatar !== oldUser?.avatar) {
      if (oldUser?.avatar) {
        await this.sysFileService.softDeleteByPath(
          this.normalizeStoredPath(oldUser.avatar),
        );
      }
      const avatarFile = await this.sysFileService.findByPath(
        this.normalizeStoredPath(savedUser.avatar),
      );
      if (avatarFile) {
        await this.sysFileService.associateFiles({
          businessType: BusinessType.Avatar,
          businessId: savedUser.id,
          fileIds: [avatarFile.id],
        });
      }
    }

    return savedUser;
  }

  async getOne(query, isError = true): Promise<User | null> {
    const {
      _operatorId,
      _operatorDeptId,
      _operatorPermissions,
      _operatorRoles,
      ...where
    } = query as any;
    let res = await super.getOne(
      { where, relations: ["dept", "roles"] },
      false,
    );
    if (!res) {
      if (isError) {
        throw new Error("用户不存在");
      }
      return null;
    }
    if (_operatorId) {
      const canSee = await this.isUserVisibleToCurrentUser(res, {
        id: _operatorId,
        deptId: _operatorDeptId,
        permissions: _operatorPermissions,
        roles: _operatorRoles,
      });
      if (!canSee) {
        if (isError) {
          throw new Error("用户不存在");
        }
        return null;
      }
    }
    return res;
  }

  // 列表
  async list(
    query: QueryListDto & {
      _operatorId?: string;
      _operatorDeptId?: string;
      _operatorPermissions?: string[];
      _operatorRoles?: Array<{
        permissionKey?: string;
        dataPermissionType?: string;
        isActive?: string | number;
      }>;
    },
  ): Promise<ResponseListDto<User>> {
    let {
      deptId,
      name,
      nickname,
      email,
      roleId,
      includeNoDept,
      pageNum,
      pageSize,
      _operatorId,
      _operatorDeptId,
      _operatorPermissions,
      _operatorRoles,
    } = query;

    // 将字符串 'true'/'false' 转换为布尔值
    const includeNoDeptBool =
      includeNoDept === true || includeNoDept === "true";

    // 使用 QueryBuilder 处理复杂条件
    let qb = this.usersRepository
      .createQueryBuilder("User")
      .leftJoinAndSelect("User.dept", "dept")
      .leftJoinAndSelect("User.roles", "roles")
      .where("User.isDelete IS NULL");

    // Handle deptId filter
    if (deptId && deptId != 0) {
      let deptIds = (await this.deptService.getChildren({ id: deptId }))?.map(
        (item) => item.id,
      );
      if (deptIds && deptIds.length > 0) {
        if (includeNoDeptBool) {
          // 包含无部门人员：deptId IN (...) OR deptId IS NULL
          qb.andWhere(`(User.deptId IN (:...deptIds) OR User.deptId IS NULL)`, {
            deptIds,
          });
        } else {
          qb.andWhere("User.deptId IN (:...deptIds)", { deptIds });
        }
      }
    } else if (!includeNoDeptBool) {
      // 当没有选择部门且不包含无部门人员时，只返回有部门的人员
      qb.andWhere("User.deptId IS NOT NULL");
    }

    // Handle roleId filter
    if (roleId) {
      qb.andWhere("roles.id = :roleId", { roleId });
    }

    // Handle name filter
    if (name) {
      qb.andWhere("User.name LIKE :name", { name: `%${name}%` });
    }

    // Handle nickname filter
    if (nickname) {
      qb.andWhere("User.nickname LIKE :nickname", {
        nickname: `%${nickname}%`,
      });
    }

    // Handle email filter
    if (email) {
      qb.andWhere("User.email LIKE :email", { email: `%${email}%` });
    }

    await this.applyUserDataScope(qb, {
      id: _operatorId,
      deptId: _operatorDeptId,
      permissions: _operatorPermissions,
      roles: _operatorRoles,
    });

    // Pagination
    const skip = (pageNum - 1) * pageSize;
    qb.skip(skip).take(pageSize);
    qb.orderBy("User.createTime", "DESC");

    const [data, total] = await qb.getManyAndCount();
    data.forEach((element) => delete element.password);
    return { total, data, _flag: true };
  }

  async getOptions(
    query: QueryListDto & {
      keyword?: string;
      includeAll?: string | boolean;
      _operatorId?: string;
      _operatorDeptId?: string;
      _operatorPermissions?: string[];
      _operatorRoles?: Array<{
        permissionKey?: string;
        dataPermissionType?: string;
        isActive?: string | number;
      }>;
    },
  ) {
    const pageNum = Number(query?.pageNum || 1);
    const pageSize = Math.min(Number(query?.pageSize || 50), 100);
    const keyword = query?.keyword || query?.name || query?.nickname;
    const qb = this.usersRepository
      .createQueryBuilder("User")
      .leftJoinAndSelect("User.dept", "dept")
      .where("User.isDelete IS NULL")
      .andWhere("User.isActive = :isActive", { isActive: BoolNum.Yes });

    if (query?.deptId && query.deptId != "0") {
      const deptIds = (await this.deptService.getChildren({ id: query.deptId }))
        ?.map((item) => item.id)
        .filter(Boolean);
      if (deptIds?.length) {
        qb.andWhere("User.deptId IN (:...deptIds)", { deptIds });
      }
    }

    if (keyword) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where("User.name LIKE :keyword", { keyword: `%${keyword}%` })
            .orWhere("User.nickname LIKE :keyword", {
              keyword: `%${keyword}%`,
            });
        }),
      );
    }

    const includeAll =
      query?.includeAll === true || String(query?.includeAll || "") === "1";
    if (!includeAll) {
      await this.applyUserDataScope(qb, {
        id: query._operatorId,
        deptId: query._operatorDeptId,
        permissions: query._operatorPermissions,
        roles: query._operatorRoles,
      });
    }

    const data = await qb
      .orderBy("User.nickname", "ASC")
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      nickname: item.nickname,
      avatar: item.avatar,
      deptId: item.deptId,
      dept: item.dept
        ? {
            id: item.dept.id,
            name: item.dept.name,
            parentId: item.dept.parentId,
          }
        : null,
    }));
  }

  async resetPassword(updateDto: UpdateUserDto): Promise<UpdateResult> {
    let { id, passwordNew, passwordNewConfirm, permissions } = updateDto;
    if (!this.hasPermission(permissions || [], "system/users/resetPassword")) {
      throw new HttpException("接口无权限", 403);
    }
    if (passwordNew !== passwordNewConfirm) {
      throw new Error("两次输入的密码不一致");
    }
    return this.updateUserPassword(id, passwordNew);
  }

  async updatePassword(updateDto: UpdateUserDto): Promise<UpdateResult> {
    let { id, passwordOld, passwordNew, passwordNewConfirm } = updateDto;
    if (passwordNew !== passwordNewConfirm) {
      throw new Error("两次输入的密码不一致");
    }
    let user = await this.getOne({ id });
    const isMatch = await verifyPassword(passwordOld, user.password);
    if (!isMatch) {
      throw new Error("旧密码不正确 ");
    }
    return this.updateUserPassword(id, passwordNew);
  }

  async dataValidate(data: { id; updateUser; permissions?: string[] }) {
    if (!data.id) return true;
    const row = await this.getOne({ id: data.id }, false);
    if (!row) return true;

    const targetIsAdmin = row.roles?.some(
      (role) => role.permissionKey === config.adminKey,
    );
    const updatingSelf = String(row.id) === String(data.updateUser);
    if (
      targetIsAdmin &&
      !updatingSelf &&
      !this.hasPermission(data.permissions || [], "system/users/manageAdmin")
    ) {
      throw new HttpException("接口无权限", 403);
    }
    return true;
  }

  private hasPermission(permissions: string[], key: string) {
    return permissions?.includes("*") || permissions?.includes(key);
  }

  private getCurrentUserDataPermissionType(currentUser?: Record<string, any>) {
    if (!currentUser?.id) {
      return DataPermissionType.self;
    }
    if (this.hasPermission(currentUser.permissions || [], "*")) {
      return DataPermissionType.all;
    }
    const activeRoles = (currentUser.roles || []).filter((role) =>
      ["1", 1, true].includes(role?.isActive as any),
    );
    if (activeRoles.some((role) => role?.permissionKey === config.adminKey)) {
      return DataPermissionType.all;
    }
    const permissionWeight = {
      [DataPermissionType.self]: 1,
      [DataPermissionType.dept]: 2,
      [DataPermissionType.deptAndChildren]: 3,
      [DataPermissionType.all]: 4,
    };

    return activeRoles.reduce((bestType, role) => {
      const roleType = role?.dataPermissionType || DataPermissionType.self;
      return permissionWeight[roleType] > permissionWeight[bestType]
        ? roleType
        : bestType;
    }, DataPermissionType.self);
  }

  private getCurrentUserDeptId(currentUser?: Record<string, any>) {
    return String(
      currentUser?.deptId ||
        currentUser?.dept?.id ||
        currentUser?.dept?.deptId ||
        "",
    );
  }

  private async getVisibleDeptIds(currentUserDeptId: string) {
    if (!currentUserDeptId) return [];
    const deptTree = await this.deptService.getChildren({
      id: currentUserDeptId,
    });
    return Array.from(
      new Set(
        (deptTree || []).map((item) => String(item.id || "")).filter(Boolean),
      ),
    );
  }

  private async applyUserDataScope(qb: any, currentUser?: Record<string, any>) {
    const currentUserId = String(currentUser?.id || "");
    if (!currentUserId) return qb;

    const dataPermissionType =
      this.getCurrentUserDataPermissionType(currentUser);
    if (dataPermissionType === DataPermissionType.all) {
      return qb;
    }

    if (dataPermissionType === DataPermissionType.self) {
      qb.andWhere("User.id = :currentUserId", { currentUserId });
      return qb;
    }

    const currentUserDeptId = this.getCurrentUserDeptId(currentUser);
    if (!currentUserDeptId) {
      qb.andWhere("User.id = :currentUserId", { currentUserId });
      return qb;
    }

    if (dataPermissionType === DataPermissionType.dept) {
      qb.andWhere("User.deptId = :currentUserDeptId", {
        currentUserDeptId,
      });
      return qb;
    }

    const deptIds = await this.getVisibleDeptIds(currentUserDeptId);
    if (!deptIds.length) {
      qb.andWhere("User.id = :currentUserId", { currentUserId });
      return qb;
    }

    qb.andWhere("(User.deptId IN (:...deptIds) OR User.id = :currentUserId)", {
      deptIds,
      currentUserId,
    });
    return qb;
  }

  private async isUserVisibleToCurrentUser(
    targetUser: User,
    currentUser?: Record<string, any>,
  ) {
    if (!currentUser?.id) return true;
    const dataPermissionType =
      this.getCurrentUserDataPermissionType(currentUser);
    if (dataPermissionType === DataPermissionType.all) return true;
    if (String(targetUser?.id || "") === String(currentUser.id)) return true;

    if (dataPermissionType === DataPermissionType.self) {
      return false;
    }

    const currentUserDeptId = this.getCurrentUserDeptId(currentUser);
    if (!currentUserDeptId) {
      return false;
    }

    if (dataPermissionType === DataPermissionType.dept) {
      return String(targetUser?.deptId || "") === currentUserDeptId;
    }

    const deptIds = await this.getVisibleDeptIds(currentUserDeptId);
    return deptIds.includes(String(targetUser?.deptId || ""));
  }

  private async updateUserPassword(id: string, password: string) {
    let data = Object.assign(new User(), {
      id,
      password: await hashPassword(password),
      passwordVersion: 2,
    });
    return super.update(data);
  }

  private normalizeStoredPath(path?: string) {
    return path?.replace(/^\/(upload|static)\//, "");
  }
}
