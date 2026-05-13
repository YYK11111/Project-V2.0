import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from "typeorm";
import { Inject, Injectable } from "@nestjs/common";
import { forwardRef } from "@nestjs/common";
import { WorkflowDataLoaderService } from "../../modulesBusi/workflow/workflow-data-loader.service";
import { WorkflowService } from "../../modulesBusi/workflow/service";

@Injectable()
@EventSubscriber()
export class WorkflowTriggerListener implements EntitySubscriberInterface {
  private readonly supportedEntities = new Set([
    "Project",
    "Task",
    "Customer",
    "Ticket",
    "ProjectChange",
    "Change",
    "GoLiveRecord",
    "AcceptanceRecord",
    "HandoverRecord",
  ]);

  constructor(
    @Inject(forwardRef(() => WorkflowDataLoaderService))
    private dataLoader: WorkflowDataLoaderService,
    @Inject(forwardRef(() => WorkflowService))
    private workflowService: WorkflowService,
    private dataSource: DataSource,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Object;
  }

  private mapEntityName(entityName: string): string {
    const map: Record<string, string> = {
      Project: "project",
      Task: "task",
      Customer: "customer",
      Ticket: "ticket",
      ProjectChange: "change",
      Change: "change",
      GoLiveRecord: "goLive",
      AcceptanceRecord: "acceptance",
      HandoverRecord: "handover",
    };
    return map[entityName] || entityName.toLowerCase();
  }

  async afterInsert(event: InsertEvent<any>): Promise<void> {
    const entity = event.entity;
    const entityName = event.metadata.name;
    if (!this.supportedEntities.has(entityName) || !entity?.id) {
      return;
    }
    const businessType = this.mapEntityName(entityName);

    console.log(
      `[WorkflowTrigger] Entity inserted: ${entityName}, ID: ${entity.id}`,
    );

    try {
      const triggerConfig = await this.dataLoader.getTriggerConfig(
        businessType,
        "onCreate",
      );
      if (triggerConfig?.businessScene) {
        const businessKey = `${businessType}_${entity.id}`;
        console.log(`[WorkflowTrigger] Triggering workflow for ${businessKey}`);
        await this.workflowService.startBusinessWorkflow(
          {
            businessType,
            businessScene: triggerConfig.businessScene,
            businessKey,
            variables: { triggerEvent: "onCreate", businessType },
          },
          "system",
        );
      }
    } catch (error) {
      console.error(
        `[WorkflowTrigger] Failed to check trigger config: ${error.message}`,
      );
    }
  }

  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    const entity = event.entity;
    const entityName = event.metadata.name;
    if (!this.supportedEntities.has(entityName) || !entity?.id) {
      return;
    }
    const businessType = this.mapEntityName(entityName);

    console.log(
      `[WorkflowTrigger] Entity updated: ${entityName}, ID: ${entity?.id}`,
    );

    const oldEntity = event.databaseEntity;
    if (oldEntity && entity.status !== oldEntity.status) {
      console.log(
        `[WorkflowTrigger] Status changed from ${oldEntity.status} to ${entity.status}`,
      );

      try {
        const triggerConfig = await this.dataLoader.getTriggerConfig(
          businessType,
          "onStatusChange",
        );
        if (
          triggerConfig?.businessScene &&
          this.matchStatusTrigger(entity, triggerConfig)
        ) {
          const businessKey = `${businessType}_${entity.id}`;
          console.log(
            `[WorkflowTrigger] Status change triggers workflow for ${businessKey}`,
          );
          await this.workflowService.startBusinessWorkflow(
            {
              businessType,
              businessScene: triggerConfig.businessScene,
              businessKey,
              variables: { triggerEvent: "onStatusChange", businessType },
            },
            "system",
          );
        }
      } catch (error) {
        console.error(
          `[WorkflowTrigger] Failed to check status change trigger: ${error.message}`,
        );
      }
    }
  }

  private matchStatusTrigger(entity: any, config: any): boolean {
    if (!config.statusTriggerValues) return false;
    return config.statusTriggerValues
      .map(String)
      .includes(String(entity.status));
  }
}
