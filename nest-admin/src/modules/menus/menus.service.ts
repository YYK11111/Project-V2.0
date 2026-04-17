import { BadRequestException, HttpException, Injectable } from '@nestjs/common'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { Menu, MenuType } from './menu.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, In, Like, Repository, TreeRepository } from 'typeorm'
import { BaseService } from 'src/common/BaseService'
import { arrayToTree } from 'src/common/utils/common'
import { QueryListDto, SaveDto } from 'src/common/dto'
import { config } from 'config'

type MenuDiagnosticIssue = {
  id: string
  name: string
  parentId: string
  path: string
  component: string
  type: MenuType
  reason: string
  severity: 'high' | 'medium'
  suggestion: string
}

type MenuDiagnosticSummary = {
  missingComponentMenus: MenuDiagnosticIssue[]
  emptyCatalogs: MenuDiagnosticIssue[]
  duplicateSiblingPaths: Array<{
    parentId: string
    path: string
    type: MenuType
    menuIds: string[]
    menuNames: string[]
    severity: 'high' | 'medium'
    suggestion: string
  }>
  redundantHiddenRoutes: MenuDiagnosticIssue[]
}

@Injectable()
export class MenusService extends BaseService<Menu, CreateMenuDto> {
  private readonly constantHiddenPaths = new Set([
    '/documentManage/form',
    '/projectManage/approval',
    '/content/articleManage/aev',
    '/content/aev',
    '/content/articleManage/myBorrows',
    '/content/articleManage/home',
    '/content/articleManage/index',
    '/content/articleManage/manage',
    '/content/articleManage/search',
    '/content/articleManage/aiRetrieveDebug',
    '/content/articleManage/detail',
    '/content/articleManage/borrowApproval',
  ])

  constructor(
    @InjectRepository(Menu)
    repository: TreeRepository<Menu>,
  ) {
    super(Menu, repository)
  }

  async save(createDto: SaveDto<Menu>) {
    await this.validateMenuConfig(createDto)
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

  async getDiagnostics(): Promise<MenuDiagnosticSummary> {
    const menus = await this.repository.find({
      where: {
        isDelete: null,
      } as any,
      order: {
        order: 'ASC',
        createTime: 'DESC',
      },
    })

    const missingComponentMenus: MenuDiagnosticIssue[] = []
    const redundantHiddenRoutes: MenuDiagnosticIssue[] = []
    const duplicateSiblingPathMap = new Map<string, Menu[]>()

    menus.forEach((menu) => {
      if (menu.type === MenuType.menu && !String(menu.component || '').trim()) {
        missingComponentMenus.push(this.toDiagnosticIssue(menu, '菜单缺少组件配置'))
      }

      if (menu.isHidden === '1' && this.constantHiddenPaths.has(this.normalizePath(menu.path))) {
        redundantHiddenRoutes.push(this.toDiagnosticIssue(menu, '与前端常量隐藏路由重复'))
      }

      if (menu.type !== MenuType.button) {
        const siblingPathKey = `${menu.parentId || '0'}::${this.normalizePath(menu.path)}::${menu.type}`
        const currentList = duplicateSiblingPathMap.get(siblingPathKey) || []
        currentList.push(menu)
        duplicateSiblingPathMap.set(siblingPathKey, currentList)
      }
    })

    const tree = arrayToTree(menus)
    const emptyCatalogs = this.collectEmptyCatalogs(tree)

    const duplicateSiblingPaths = [...duplicateSiblingPathMap.entries()]
      .filter(([, sameMenus]) => sameMenus.length > 1)
      .map(([routeKey, sameMenus]) => {
        const [parentId, path, type] = routeKey.split('::')
        return {
          parentId,
          path,
          type: type as MenuType,
          menuIds: sameMenus.map((menu) => menu.id),
          menuNames: sameMenus.map((menu) => menu.name),
          severity: 'high' as const,
          suggestion: '合并重复菜单，只保留一个有效路由，其余菜单迁移角色绑定后删除',
        }
      })

    return {
      missingComponentMenus,
      emptyCatalogs,
      duplicateSiblingPaths,
      redundantHiddenRoutes,
    }
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

  private normalizePath(path = '') {
    if (!path) return ''
    return path.startsWith('/') ? path : '/' + path
  }

  private toDiagnosticIssue(menu: Menu, reason: string): MenuDiagnosticIssue {
    const diagnosticMeta = this.getDiagnosticMeta(reason)
    return {
      id: menu.id,
      name: menu.name,
      parentId: menu.parentId || '0',
      path: menu.path || '',
      component: menu.component || '',
      type: menu.type,
      reason,
      severity: diagnosticMeta.severity,
      suggestion: diagnosticMeta.suggestion,
    }
  }

  private getDiagnosticMeta(reason: string) {
    if (reason.includes('重复')) {
      return {
        severity: 'high' as const,
        suggestion: '建议删除数据库隐藏菜单，保留前端常量隐藏路由或合并重复菜单',
      }
    }
    if (reason.includes('缺少组件')) {
      return {
        severity: 'high' as const,
        suggestion: '补齐组件路径，或确认该菜单应改为目录/按钮后再保存',
      }
    }
    return {
      severity: 'medium' as const,
      suggestion: '补充可见子菜单或组件；如果该目录无业务价值，建议删除',
    }
  }

  private collectEmptyCatalogs(tree: Menu[]): MenuDiagnosticIssue[] {
    return tree.flatMap((menu) => {
      const children = this.collectEmptyCatalogs(menu.children || [])
      if (menu.type !== MenuType.catalog) {
        return children
      }

      const visibleChildren = (menu.children || []).filter((child) => child.isDelete == null && child.isHidden !== '1')
      const hasComponent = Boolean(String(menu.component || '').trim())
      if (visibleChildren.length === 0 && !hasComponent) {
        return [this.toDiagnosticIssue(menu, '目录无可见子菜单且未配置组件'), ...children]
      }
      return children
    })
  }

  private async validateMenuConfig(data: SaveDto<Menu> & { id?: string; parentId?: string; path?: string; component?: string; type?: MenuType; isHidden?: string }) {
    const normalizedPath = this.normalizePath(data.path)
    const menuType = data.type
    const component = (data.component || '').trim()

    if (menuType === MenuType.menu && !component) {
      throw new BadRequestException('菜单类型必须配置组件路径')
    }

    if (menuType === MenuType.button && (data.path || component)) {
      throw new BadRequestException('按钮类型不允许配置路由地址或组件路径')
    }

    if (data.isHidden === '1' && this.constantHiddenPaths.has(normalizedPath)) {
      throw new BadRequestException('该隐藏路由已由前端常量路由承接，无需重复配置数据库菜单')
    }

    if (!normalizedPath || menuType === MenuType.button) {
      return
    }

    const siblingMenus = await this.repository.find({
      where: {
        parentId: data.parentId || '0',
      } as any,
    })

    const duplicateSibling = siblingMenus.find((item) => {
      if (data.id && item.id === data.id) return false
      return this.normalizePath(item.path) === normalizedPath && item.type === menuType && item.isDelete == null
    })

    if (duplicateSibling) {
      throw new BadRequestException('同级菜单下已存在相同路由地址的菜单')
    }
  }
}
