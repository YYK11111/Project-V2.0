import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('sys_role', {
  comment: '角色信息表',
})
export class SysRoleEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'role_id', comment: '角色ID' })
  public roleId: number

  @Column({ type: 'varchar', name: 'role_name', length: 30, comment: '角色名称' })
  public roleName: string

  @Column({ type: 'int', name: 'role_sort', default: 0, comment: '显示顺序' })
  public roleSort: number

  @Column({ type: 'varchar', name: 'role_key', length: 100, comment: '角色权限字符串' })
  public roleKey: string

  @Column({ type: 'char', name: 'data_scope', length: 1, default: '1', comment: '数据范围' })
  public dataScope: string

  @Column({ type: 'boolean', name: 'menu_check_strictly', default: false, comment: '菜单树选择项是否关联显示' })
  public menuCheckStrictly: boolean

  @Column({ type: 'boolean', name: 'dept_check_strictly', default: false, comment: '部门树选择项是否关联显示' })
  public deptCheckStrictly: boolean

  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '状态' })
  public status: string

  @Column({ type: 'char', name: 'del_flag', length: 1, default: '0', comment: '删除标志' })
  public delFlag: string

  @Column({ type: 'datetime', name: 'create_time', default: () => 'CURRENT_TIMESTAMP', comment: '创建时间' })
  public createTime: Date

  @Column({ type: 'datetime', name: 'update_time', nullable: true, onUpdate: 'CURRENT_TIMESTAMP', comment: '更新时间' })
  public updateTime: Date

  @Column({ type: 'varchar', name: 'remark', length: 500, nullable: true, comment: '备注' })
  public remark: string

  @Column({ type: 'varchar', name: 'create_by', length: 64, default: '', comment: '创建者' })
  public createBy: string

  @Column({ type: 'varchar', name: 'update_by', length: 64, default: '', comment: '更新者' })
  public updateBy: string
}
