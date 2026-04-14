import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common'
import { RolesService } from './service'
import {
  AuthUserCancelAllDto,
  AuthUserCancelDto,
  AuthUserSelectAllDto,
  ListRoleDto,
  SaveRoleDto,
} from './dto'
import { MenuType } from '../menus/menu.entity'
import { arrayToTree } from 'src/common/utils/common'
import { dataPermissionType, Role } from './entity'
import { BaseController } from 'src/common/BaseController'

@Controller('system/roles')
export class RolesController extends BaseController<Role, RolesService> {
  constructor(readonly service: RolesService) {
    super(service)
  }

  @Get('getLoginUserMenus')
  async getLoginUserMenus(@Req() req: Record<string, any>) {
    const menus = await this.service.getUserMenus(req.user)
    const visibleMenus = menus.filter((item) => item.type !== MenuType.button)
    return arrayToTree(visibleMenus)
  }

  @Get('getDataPermissionType')
  getDataPermissionType() {
    return dataPermissionType
  }

  @Get('menuTreeselect')
  menuTreeselect() {
    return this.service.menuTreeselect()
  }

  @Get('roleMenuTreeselect/:roleId')
  roleMenuTreeselect(@Param('roleId') roleId: string) {
    return this.service.roleMenuTreeselect(roleId)
  }

  @Get('authUser/allocatedList')
  authUserAllocatedList(@Query() query: any) {
    return this.service.allocatedUserList(query)
  }

  @Get('authUser/unallocatedList')
  authUserUnallocatedList(@Query() query: any) {
    return this.service.unallocatedUserList(query)
  }

  @Put('authUser/cancel')
  authUserCancel(@Body() body: AuthUserCancelDto, @Req() req) {
    ;(body as any).permissions = req.user.permissions || []
    return this.service.authUserCancel(body)
  }

  @Put('authUser/cancelAll')
  authUserCancelAll(@Body() body: AuthUserCancelAllDto, @Req() req) {
    ;(body as any).permissions = req.user.permissions || []
    return this.service.authUserCancelAll(body)
  }

  @Put('authUser/selectAll')
  authUserSelectAll(@Body() body: AuthUserSelectAllDto, @Req() req) {
    ;(body as any).permissions = req.user.permissions || []
    return this.service.authUserSelectAll(body)
  }
}
