import { HttpException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Role } from './entity'
import { SysUserWithRoleEntity } from '../users/entities/user-role.entity'
import { User } from '../users/entities/user.entity'
import { Menu, MenuType } from '../menus/menu.entity'
import {
  AuthUserCancelAllDto,
  AuthUserCancelDto,
  AuthUserSelectAllDto,
  ListRoleDto,
  SaveRoleDto,
} from './dto'
import { arrayToTree } from 'src/common/utils/common'
import { BoolNum } from 'src/common/type/base'
import { config } from 'config'
import { BaseService } from 'src/common/BaseService'

@Injectable()
export class RolesService extends BaseService<Role, SaveRoleDto> {
  constructor(
    @InjectRepository(Role)
    repository: Repository<Role>,
    @InjectRepository(SysUserWithRoleEntity)
    private readonly sysUserWithRoleEntityRep: Repository<SysUserWithRoleEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {
    super(Role, repository)
  }

  async save(createDto: SaveRoleDto) {
    const operatorPermissions = (createDto as any)._operatorPermissions || []
    const isAdminRole = (createDto as any).permissionKey === config.adminKey
    if (isAdminRole && !this.hasPermission(operatorPermissions, 'system/roles/manageAdminRole')) {
      throw new HttpException('接口无权限', 403)
    }

    createDto.menuIds ??= []
    const data = new Role({
      ...createDto,
      menus: createDto.menuIds.map((id) => Object.assign(new Menu(), { id })),
    })
    return super.save(data as any)
  }

  async list(query: ListRoleDto) {
    const normalizedQuery = {
      ...query,
      name: query.name || undefined,
      permissionKey: query.permissionKey || undefined,
      isActive: query.isActive || undefined,
    }

    const queryOrm: any = {
      where: {
        name: this.sqlLike(normalizedQuery.name),
        permissionKey: this.sqlLike(normalizedQuery.permissionKey),
        isActive: normalizedQuery.isActive,
      },
      relations: {
        users: true,
        menus: true,
      },
      order: {
        order: 'ASC',
        createTime: 'DESC',
      },
    }

    if (normalizedQuery.id) {
      queryOrm.where.id = normalizedQuery.id
    }

    return this.listBy(queryOrm, normalizedQuery)
  }

  async getUserMenus(user: { name?: string; roles?: Array<{ permissionKey?: string; isActive?: string }> }, isTree = false): Promise<Menu[]> {
    if (user?.name === config.adminKey || user?.roles?.some?.((role) => role.permissionKey === config.adminKey)) {
      return this.menuRepository.find({
        where: { isActive: BoolNum.Yes },
        order: { order: 'ASC', createTime: 'DESC' },
      }).then((menus) => (isTree ? arrayToTree(menus) : menus))
    }

    const roleKeys = (user?.roles || [])
      .filter((role) => role?.isActive === BoolNum.Yes)
      .map((role) => role.permissionKey)
      .filter(Boolean)

    if (!roleKeys.length) {
      return []
    }

    const roles = await this.repository
      .createQueryBuilder('Role')
      .leftJoinAndSelect('Role.menus', 'menus', 'menus.isActive = :isActive', { isActive: BoolNum.Yes })
      .where('Role.permissionKey IN (:...roleKeys)', { roleKeys })
      .andWhere('Role.isDelete IS NULL')
      .andWhere('Role.isActive = :roleActive', { roleActive: BoolNum.Yes })
      .orderBy('Role.order', 'ASC')
      .getMany()

    const menuMap = new Map<string, Menu>()
    roles.forEach((role) => {
      role.menus?.forEach((menu) => {
        menuMap.set(menu.id, menu)
      })
    })

    const menus = [...menuMap.values()].sort((a, b) => {
      const leftOrder = Number(a.order || 0)
      const rightOrder = Number(b.order || 0)
      if (leftOrder === rightOrder) {
        return +new Date(b.createTime) - +new Date(a.createTime)
      }
      return leftOrder - rightOrder
    })

    return isTree ? arrayToTree(menus) : menus
  }

  async menuTreeselect() {
    const res = await this.menuRepository.find({
      order: { order: 'ASC', createTime: 'DESC' },
    })
    return arrayToTree(res)
  }

  async roleMenuTreeselect(roleId: string) {
    const res = await this.menuRepository.find({
      order: { order: 'ASC', createTime: 'DESC' },
    })
    const role = await this.repository.findOne({
      where: { id: roleId },
      relations: { menus: true },
    })
    const checkedKeys = role?.menus?.map((item) => item.id) || []
    return { menus: arrayToTree(res), checkedKeys }
  }

  async getOne(query, isError = true) {
    return super.getOne(
      {
        where: typeof query === 'object' && query?.where ? query.where : query,
        relations: { menus: true },
      } as any,
      isError,
    )
  }

  async remove(ids: string[] | string, updateUser?: string) {
    return super.del(ids, updateUser)
  }

  async dataValidate(data: { id; updateUser; permissions?: string[] }) {
    if (!data.id) return true
    const row = await this.getOne({ id: data.id }, false)
    if (!row) return true
    if (row.permissionKey === config.adminKey && !this.hasPermission(data.permissions || [], 'system/roles/manageAdminRole')) {
      throw new HttpException('接口无权限', 403)
    }
    return true
  }

  async allocatedUserList(query: any) {
    const { roleId, pageNum = 1, pageSize = 10, userName } = query

    if (!roleId || isNaN(+roleId)) {
      return { list: [], total: 0 }
    }

    const roleWidthRoleList = await this.sysUserWithRoleEntityRep.find({
      where: { roleId: +roleId },
      select: ['userId'],
    })

    if (roleWidthRoleList.length === 0) {
      return { list: [], total: 0 }
    }

    const userIds = roleWidthRoleList.map((item) => item.userId)
    const entity = this.userRepository.createQueryBuilder('user')
    entity.where('user.id IN (:...userIds)', { userIds })
    entity.andWhere('user.isDelete IS NULL')

    if (userName) {
      entity.andWhere('user.name LIKE :userName', { userName: `%${userName}%` })
    }

    const total = await entity.getCount()
    const list = await entity
      .leftJoinAndSelect('user.roles', 'roles')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getMany()

    return { list, total }
  }

  async unallocatedUserList(query: any) {
    const { roleId, pageNum = 1, pageSize = 10, userName } = query

    if (!roleId || isNaN(+roleId)) {
      return { list: [], total: 0 }
    }

    const roleWidthRoleList = await this.sysUserWithRoleEntityRep.find({
      where: { roleId: +roleId },
      select: ['userId'],
    })

    const allocatedUserIds = roleWidthRoleList.map((item) => item.userId)
    const entity = this.userRepository.createQueryBuilder('user')
    entity.where('user.isDelete IS NULL')

    if (allocatedUserIds.length > 0) {
      entity.andWhere('user.id NOT IN (:...allocatedUserIds)', { allocatedUserIds })
    }

    if (userName) {
      entity.andWhere('user.name LIKE :userName', { userName: `%${userName}%` })
    }

    const total = await entity.getCount()
    const list = await entity.skip((pageNum - 1) * pageSize).take(pageSize).getMany()

    return { list, total }
  }

  async authUserCancel(body: AuthUserCancelDto) {
    await this.ensureManageRolePermission(body.roleId, body.permissions || [])
    await this.sysUserWithRoleEntityRep.delete({
      userId: +body.userId,
      roleId: +body.roleId,
    })
    return { code: 0, message: '取消授权成功' }
  }

  async authUserCancelAll(body: AuthUserCancelAllDto) {
    await this.ensureManageRolePermission(body.roleId, body.permissions || [])
    const userIdArr = body.userIds.split(',').map((id) => +id)
    await this.sysUserWithRoleEntityRep.delete({
      userId: In(userIdArr),
      roleId: +body.roleId,
    })
    return { code: 0, message: '批量取消授权成功' }
  }

  async authUserSelectAll(body: AuthUserSelectAllDto) {
    await this.ensureManageRolePermission(body.roleId, body.permissions || [])
    const entitys = body.userIds.split(',').map((userId) => ({
      userId: +userId,
      roleId: +body.roleId,
    }))
    await this.sysUserWithRoleEntityRep.save(entitys)
    return { code: 0, message: '授权成功' }
  }

  private hasPermission(permissions: string[], key: string) {
    return permissions?.includes('*') || permissions?.includes(key)
  }

  private async ensureManageRolePermission(roleId: string | number, permissions: string[]) {
    const role = await this.repository.findOne({ where: { id: String(roleId) } })
    if (role?.permissionKey === config.adminKey && !this.hasPermission(permissions || [], 'system/roles/manageAdminRole')) {
      throw new HttpException('接口无权限', 403)
    }
  }
}
