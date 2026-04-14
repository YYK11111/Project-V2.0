import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RolesController } from './controller'
import { RolesService } from './service'
import { Menu } from '../menus/menu.entity'
import { User } from '../users/entities/user.entity'
import { SysUserWithRoleEntity } from '../users/entities/user-role.entity'
import { Role } from './entity'

@Module({
  imports: [TypeOrmModule.forFeature([Role, Menu, User, SysUserWithRoleEntity])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
