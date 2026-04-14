import { Injectable } from '@nestjs/common'
import { CreateDeptDto } from './dto/create-dept.dto'
import { UpdateDeptDto } from './dto/update-dept.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, TreeRepository } from 'typeorm'
import { Dept } from './entities/dept.entity'
import { DataSource } from 'typeorm'
import { validate } from 'class-validator'
import { BaseService } from 'src/common/BaseService'
import { HttpException } from '@nestjs/common'

@Injectable()
export class DeptService extends BaseService<Dept, CreateDeptDto> {
  constructor(
    @InjectRepository(Dept)
    readonly repository: TreeRepository<Dept>,
  ) {
    super(Dept, repository)
  }

  async save(data) {
    if (data.parentId && data.parentId != '0') {
      data.parent = Object.assign(new Dept(), { id: data.parentId })
    } else {
      data.parentId = null
    }
    return await super.save(data)
  }

  // 获取部门树
  async getTrees(query): Promise<Dept | Dept[]> {
    return await (query?.id
      ? query?.id == 0
        ? this.repository.findRoots() // 获取所有根节点
        : (await this.repository.findDescendantsTree(new Dept(query), { depth: 2 })).children // 获取指定id节点的子节点
      : this.repository.findTrees()) // 获取所有节点树
  }

  async getChildren(query): Promise<Dept[]> {
    return this.repository.findDescendants(new Dept(query))
  }

  async dataValidate(data: { id; updateUser; permissions?: string[] }) {
    if (!data.id) return true
    const row = await this.getOne({ id: data.id }, false)
    if (!row) return true

    const isRootDept = !row.parentId || row.parentId === '0'
    if (isRootDept && !this.hasPermission(data.permissions || [], 'system/dept/manageProtected')) {
      throw new HttpException('接口无权限', 403)
    }
    return true
  }

  private hasPermission(permissions: string[], key: string) {
    return permissions?.includes('*') || permissions?.includes(key)
  }

  // async update(updateDto: Dept) {
  //   let { id, parentId, name } = updateDto
  //   let data = Object.assign(new Dept(), { id, parentId, name })
  //   if (data.parentId !== '0') {
  //     data.parent = Object.assign(new Dept(), { id: data.parentId })
  //   } else {
  //     delete data.parentId
  //   }
  //   return this.repository.update(data.id, data)
  // }
}
