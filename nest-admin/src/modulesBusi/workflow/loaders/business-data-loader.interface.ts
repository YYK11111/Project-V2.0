import { FieldDefinition } from '../entity/workflow-business-config.entity';

export interface BusinessData {
  id: string;
  type: string;
  data: Record<string, any>;
}

export interface BusinessDataLoader {
  load(businessKey: string): Promise<BusinessData>;
  getFields(): FieldDefinition[];
}

export type { FieldDefinition };
