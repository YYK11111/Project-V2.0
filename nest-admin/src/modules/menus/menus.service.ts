import { HttpException, Injectable } from '@nestjs/common'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { Menu } from './menu.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Like, Repository, TreeRepository } from 'typeorm'
import { BaseService } from 'src/common/BaseService'
import { arrayToTree } from 'src/common/utils/common'
import { QueryListDto } from 'src/common/dto'
import { config } from 'config'

@Injectable()
export class MenusService extends BaseService<Menu, CreateMenuDto> {
  constructor(
    @InjectRepository(Menu)
    repository: TreeRepository<Menu>,
  ) {
    super(Menu, repository)
  }

  async save(createDto: CreateMenuDto) {
    let data = new Menu(createDto)
    if (data.parentId && data.parentId != '0') {
      data.parent = Object.assign(new Menu(), { id: data.parentId })
    } else {
      delete data.parentId
    }
    return await super.save(data)
  }

  async list(query: QueryListDto = {}, isTree = true) {
    let { isActive, name, type } = query
    let queryOrm: FindManyOptions = {
      where: { isActive, type, name: this.sqlLike(name) },
    }

    let data = await this.repository.find(queryOrm)

    if (type && data.length > 0) {
      const parentIds = [...new Set(data.map((item) => item.parentId).filter((id) => id && id !== '0'))]
      if (parentIds.length > 0) {
        const parents = await this.repository.find({
          where: { id: In(parentIds) },
        })
        data = [...parents, ...data]
      }
    }

    return isTree ? this.sortMenuTree(arrayToTree(data)) : this.sortMenuList(data)
  }

  async getTrees(query): Promise<Menu[]> {
    const res = await this.repository.find()
    return this.sortMenuTree(arrayToTree(res))
  }

  async treeselect() {
    const res = await this.repository.find({
      order: {
        order: 'ASC',
      },
    })
    const tree = this.sortMenuTree(arrayToTree(res))
    return tree
  }

  private sortMenuList(data: Menu[]) {
    return [...data].sort((left, right) => this.compareMenuOrder(left, right))
  }

  private sortMenuTree(data: Menu[]) {
    return this.sortMenuList(data).map((item) => ({
      ...item,
      children: item.children?.length ? this.sortMenuTree(item.children) : item.children,
    }))
  }

  private compareMenuOrder(left: Menu, right: Menu) {
    const leftOrder = Number(left.order || 0)
    const rightOrder = Number(right.order || 0)
    if (leftOrder === rightOrder) {
      return +new Date(right.createTime) - +new Date(left.createTime)
    }
    return leftOrder - rightOrder
  }

  async dataValidate(data: { id; permissions?: string[] }) {
    if (!data.id) return true
    const row = await this.getOne({ id: data.id }, false)
    if (!row) return true
    const protectedMenu = row.permissionKey === config.adminKey
    if (protectedMenu && !this.hasPermission(data.permissions || [], 'system/menus/manageProtected')) {
      throw new HttpException('接口无权限', 403)
    }
    return true
  }

  private hasPermission(permissions: string[], key: string) {
    return permissions?.includes('*') || permissions?.includes(key)
  }
}
