import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../crm/customers/entity';
import { BusinessDataLoader } from './business-data-loader.interface';
import { BusinessData, FieldDefinition } from './business-data-loader.interface';

@Injectable()
export class CustomerLoader implements BusinessDataLoader {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = businessKey.replace('customer_', '');

    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['sales'],
    });

    if (!customer) {
      throw new Error(`Customer not found: ${id}`);
    }

    return {
      id: customer.id,
      type: 'customer',
      data: {
        id: customer.id,
        name: customer.name,
        shortName: customer.shortName,
        code: customer.code,
        type: customer.type,
        level: customer.level,
        status: customer.status,
        industry: customer.industry,
        scale: customer.scale,
        address: customer.address,
        contactPerson: customer.contactPerson,
        contactPhone: customer.contactPhone,
        contactEmail: customer.contactEmail,
        customerValue: customer.customerValue,
        description: customer.description,
        salesId: customer.salesId || customer.sales?.id || '',
        sales: customer.sales ? {
          id: customer.sales.id,
          nickname: customer.sales.nickname,
          name: customer.sales.name,
          deptId: customer.sales.deptId,
        } : null,
        deptId: customer.deptId,
      },
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: 'id', label: '客户ID', type: 'string' },
      { name: 'name', label: '客户名称', type: 'string' },
      { name: 'shortName', label: '客户简称', type: 'string' },
      { name: 'code', label: '客户编号', type: 'string' },
      { name: 'type', label: '客户类型', type: 'enum', enumValues: [
        { label: '企业客户', value: '1' },
        { label: '个人客户', value: '2' },
      ]},
      { name: 'level', label: '客户等级', type: 'enum', enumValues: [
        { label: 'VIP', value: '1' },
        { label: '重要', value: '2' },
        { label: '普通', value: '3' },
      ]},
      { name: 'status', label: '客户状态', type: 'enum', enumValues: [
        { label: '潜在', value: '1' },
        { label: '意向', value: '2' },
        { label: '成交', value: '3' },
        { label: '流失', value: '4' },
      ]},
      { name: 'industry', label: '所属行业', type: 'string' },
      { name: 'scale', label: '企业规模', type: 'string' },
      { name: 'address', label: '企业地址', type: 'string' },
      { name: 'contactPerson', label: '联系人', type: 'string' },
      { name: 'contactPhone', label: '联系电话', type: 'string' },
      { name: 'contactEmail', label: '联系邮箱', type: 'string' },
      { name: 'customerValue', label: '客户价值(万元)', type: 'number' },
      { name: 'salesId', label: '销售负责人', type: 'string' },
      { name: 'sales.deptId', label: '销售部门ID', type: 'string' },
      { name: 'deptId', label: '所属部门ID', type: 'string' },
    ];
  }
}
