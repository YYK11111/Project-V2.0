import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Dept } from '../../modules/depts/entities/dept.entity';
import { BusinessData } from '../../modulesBusi/workflow/loaders/business-data-loader.interface';

export interface AssigneeConfig {
  type: 'user' | 'department' | 'business_field';
  userId?: string | string[];
  departmentId?: string;
  departmentMode?: 'leader' | 'members';
  fieldPath?: string;
  businessType?: string;
}

@Injectable()
export class WorkflowAssigneeResolverService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Dept)
    private deptRepo: Repository<Dept>,
  ) {}

  async resolve(assigneeConfig: AssigneeConfig, businessData: BusinessData): Promise<string[]> {
    switch (assigneeConfig.type) {
      case 'user':
        if (!assigneeConfig.userId) return [];
        if (Array.isArray(assigneeConfig.userId)) {
          return assigneeConfig.userId;
        }
        return [assigneeConfig.userId];

      case 'department':
        return this.resolveDepartment(assigneeConfig.departmentId, assigneeConfig.departmentMode);

      case 'business_field':
        return this.resolveFromFieldMapping(businessData, assigneeConfig.fieldPath, assigneeConfig.businessType);

      default:
        return [];
    }
  }

  private async resolveFromFieldMapping(businessData: BusinessData, fieldName?: string, businessType?: string): Promise<string[]> {
    if (!fieldName || !businessType) return [];

    const value = this.resolvePath(businessData.data, fieldName);
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter(Boolean).map((item) => String(item));
    }
    return [String(value)];
  }

  clearCache(): void {
    return
  }

  private async findDeptLeaderById(deptId?: string): Promise<string[]> {
    if (!deptId) return [];

    const dept = await this.deptRepo.findOne({
      where: { id: deptId },
      relations: ['leader'],
    });

    return dept?.leader ? [dept.leader.id] : [];
  }

  private async findDeptMembersById(deptId?: string): Promise<string[]> {
    if (!deptId) return [];

    const users = await this.userRepo.find({
      where: { deptId },
      select: ['id'],
    });

    return users.map(u => u.id);
  }

  resolvePath(data: any, path: string): any {
    if (!path || !data) return null;
    return path.split('.').reduce((obj, key) => obj?.[key], data);
  }

  private async resolveDepartment(departmentId?: string, departmentMode: 'leader' | 'members' = 'leader'): Promise<string[]> {
    if (!departmentId) return [];
    if (departmentMode === 'members') {
      return this.findDeptMembersById(departmentId)
    }
    return this.findDeptLeaderById(departmentId)
  }
}
