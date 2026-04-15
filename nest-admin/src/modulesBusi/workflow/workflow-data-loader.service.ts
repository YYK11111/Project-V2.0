import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowBusinessConfig, FieldDefinition, TriggerConfig } from './entity/workflow-business-config.entity';
import {
  BusinessDataLoader,
  BusinessData,
} from './loaders/business-data-loader.interface';
import { ProjectLoader } from './loaders/project.loader';
import { CustomerLoader } from './loaders/customer.loader';
import { TicketLoader } from './loaders/ticket.loader';
import { ChangeLoader } from './loaders/change.loader';
import { TaskLoader } from './loaders/task.loader';

@Injectable()
export class WorkflowDataLoaderService {
  private loaders: Map<string, BusinessDataLoader> = new Map();

  constructor(
    @InjectRepository(WorkflowBusinessConfig)
    private configRepo: Repository<WorkflowBusinessConfig>,
    private projectLoader: ProjectLoader,
    private customerLoader: CustomerLoader,
    private ticketLoader: TicketLoader,
    private taskLoader: TaskLoader,
    private changeLoader: ChangeLoader,
  ) {
    this.registerDefaultLoaders();
  }

  private registerDefaultLoaders(): void {
    this.loaders.set('project', this.projectLoader);
    this.loaders.set('customer', this.customerLoader);
    this.loaders.set('ticket', this.ticketLoader);
    this.loaders.set('task', this.taskLoader);
    this.loaders.set('change', this.changeLoader);
  }

  async loadData(businessType: string, businessKey: string): Promise<BusinessData> {
    const loader = this.loaders.get(businessType);
    if (!loader) {
      throw new Error(`未注册的业务类型: ${businessType}`);
    }
    return loader.load(businessKey);
  }

  getFieldDefinitions(businessType: string): FieldDefinition[] {
    const loader = this.loaders.get(businessType);
    return loader?.getFields() || [];
  }

  resolveFieldValue(data: any, fieldPath: string): any {
    if (!fieldPath) return null;
    const parts = fieldPath.split('.');
    let value = data;
    for (const part of parts) {
      if (value == null) return null;
      value = value[part];
    }
    return value;
  }

  async getTriggerConfig(businessType: string, triggerEvent: string): Promise<TriggerConfig | null> {
    const config = await this.configRepo.findOne({
      where: { businessType, isActive: '1' },
    });
    if (!config) return null;

    const configData = config.getConfig();
    if (!configData) return null;

    const trigger = configData.triggers?.[triggerEvent] || null;
    if (!trigger || trigger.enabled === false) return null;
    return trigger;
  }

  async getBusinessConfig(businessType: string): Promise<WorkflowBusinessConfig | null> {
    return this.configRepo.findOne({
      where: { businessType, isActive: '1' },
    });
  }

  registerLoader(type: string, loader: BusinessDataLoader): void {
    this.loaders.set(type, loader);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.loaders.keys());
  }
}
