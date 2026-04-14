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

    return isTree ? arrayToTree(data) : data
  }

  async getTrees(query): Promise<Menu[]> {
    return this.repository.findTrees()
  }

  async treeselect() {
    const res = await this.repository.find({
      order: {
        order: 'ASC',
      },
    })
    const tree = arrayToTree(res)
    return tree
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
