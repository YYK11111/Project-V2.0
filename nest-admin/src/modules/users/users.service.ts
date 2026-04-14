import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User } from './entities/user.entity'
import { FindManyOptions, In, Like, Repository, UpdateResult, Brackets } from 'typeorm'
import { ResponseListDto, QueryListDto } from 'src/common/dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Dept } from '../depts/entities/dept.entity'
import { Role } from '../roles/entity'
import { decrypt, encrypt } from 'src/common/utils/encrypt'
import { BaseService } from 'src/common/BaseService'
import { DeptService } from '../depts/depts.service'
import { HttpException } from '@nestjs/common'
import { config } from 'config'
import { SysFileService } from '../sys/file/service'
import { BusinessType, FileStatus } from '../sys/file/entity'

@Injectable()
export class UsersService extends BaseService<User, CreateUserDto> {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private deptService: DeptService,
    private sysFileService: SysFileService,
  ) {
    super(User, usersRepository)
  }

  // add Or Update
  async save(createDto: CreateUserDto) {
    const oldUser = createDto.id ? await this.getOne({ id: createDto.id }, false) : null
    const operatorPermissions = (createDto as any)._operatorPermissions || []
    const canManageAdmin = this.hasPermission(operatorPermissions, 'system/users/manageAdmin')

    if (createDto.roleIds?.length && !canManageAdmin) {
      const adminRole = await this.usersRepository.manager.getRepository(Role).findOne({ where: { permissionKey: config.adminKey } })
      if (adminRole && createDto.roleIds.map(String).includes(String(adminRole.id))) {
        throw new HttpException('接口无权限', 403)
      }
    }

    if (createDto.avatar) {
      createDto.avatar = this.normalizeStoredPath(createDto.avatar)
    }

    // let data = new User()
    // createDto.dept = Object.assign(new Dept(), { id: createDto.deptId })
    delete createDto.dept
    createDto.roles = createDto.roleIds?.map((id) => Object.assign(new Role(), { id }))
    const savedUser = await super.save(createDto)

    if (savedUser.avatar && savedUser.avatar !== oldUser?.avatar) {
      if (oldUser?.avatar) {
        await this.sysFileService.softDeleteByPath(this.normalizeStoredPath(oldUser.avatar))
      }
      const avatarFile = await this.sysFileService.findByPath(this.normalizeStoredPath(savedUser.avatar))
      if (avatarFile) {
        await this.sysFileService.associateFiles({
          businessType: BusinessType.Avatar,
          businessId: savedUser.id,
          fileIds: [avatarFile.id],
        })
      }
    }

    return savedUser
  }

  async getOne(query, isError = true): Promise<User | null> {
    let res = await super.getOne({ where: query, relations: ['dept', 'roles'] }, false)
    if (!res) {
      if (isError) {
        throw new Error('用户不存在')
      }
      return null
    }
    return res
  }

// 列表
  async list(query: QueryListDto): Promise<ResponseListDto<User>> {
    let { deptId, name, nickname, email, roleId, includeNoDept, pageNum, pageSize } = query

    // 将字符串 'true'/'false' 转换为布尔值
    const includeNoDeptBool = includeNoDept === true || includeNoDept === 'true'

    // 使用 QueryBuilder 处理复杂条件
    let qb = this.usersRepository.createQueryBuilder('User')
      .leftJoinAndSelect('User.dept', 'dept')
      .leftJoinAndSelect('User.roles', 'roles')
      .where('User.isDelete IS NULL')

    // Handle deptId filter
    if (deptId && deptId != 0) {
      let deptIds = (await this.deptService.getChildren({ id: deptId }))?.map((item) => item.id)
      if (deptIds && deptIds.length > 0) {
        if (includeNoDeptBool) {
          // 包含无部门人员：deptId IN (...) OR deptId IS NULL
          qb.andWhere(`(User.deptId IN (:...deptIds) OR User.deptId IS NULL)`, { deptIds })
        } else {
          qb.andWhere('User.deptId IN (:...deptIds)', { deptIds })
        }
      }
    } else if (!includeNoDeptBool) {
      // 当没有选择部门且不包含无部门人员时，只返回有部门的人员
      qb.andWhere('User.deptId IS NOT NULL')
    }

    // Handle roleId filter
    if (roleId) {
      qb.andWhere('roles.id = :roleId', { roleId })
    }

    // Handle name filter
    if (name) {
      qb.andWhere('User.name LIKE :name', { name: `%${name}%` })
    }

    // Handle nickname filter
    if (nickname) {
      qb.andWhere('User.nickname LIKE :nickname', { nickname: `%${nickname}%` })
    }

    // Handle email filter
    if (email) {
      qb.andWhere('User.email LIKE :email', { email: `%${email}%` })
    }

    // Pagination
    const skip = (pageNum - 1) * pageSize
    qb.skip(skip).take(pageSize)
    qb.orderBy('User.createTime', 'DESC')

    const [data, total] = await qb.getManyAndCount()
    data.forEach((element) => delete element.password)
    return { total, data, _flag: true }
  }

  async resetPassword(updateDto: UpdateUserDto): Promise<UpdateResult> {
    let { id, passwordOld, passwordNew, passwordNewConfirm } = updateDto
    if (passwordNew !== passwordNewConfirm) {
      throw new Error('两次输入的密码不一致')
    } else {
      let user = await this.getOne({ id })
      let _passwordOld = await decrypt(user.password)
      if (_passwordOld !== passwordOld) {
        throw new Error('旧密码不正确 ')
      }
      let data = Object.assign(new User(), { id, password: await encrypt(passwordNew) })
      return super.update(data)
    }
  }

  async dataValidate(data: { id; updateUser; permissions?: string[] }) {
    if (!data.id) return true
    const row = await this.getOne({ id: data.id }, false)
    if (!row) return true

    const targetIsAdmin = row.roles?.some((role) => role.permissionKey === config.adminKey)
    if (targetIsAdmin && !this.hasPermission(data.permissions || [], 'system/users/manageAdmin')) {
      throw new HttpException('接口无权限', 403)
    }
    return true
  }

  private hasPermission(permissions: string[], key: string) {
    return permissions?.includes('*') || permissions?.includes(key)
  }

  private normalizeStoredPath(path?: string) {
    return path?.replace(/^\/(upload|static)\//, '')
  }
}
