import { Entity, Column, PrimaryColumn, Index } from 'typeorm'

@Entity('sys_user_role')
@Index(['userId', 'roleId'], { unique: true })
export class SysUserWithRoleEntity {
  @PrimaryColumn({ name: 'userId', type: 'bigint', width: 20 })
  userId: number

  @PrimaryColumn({ name: 'roleId', type: 'bigint', width: 20 })
  roleId: number
}
