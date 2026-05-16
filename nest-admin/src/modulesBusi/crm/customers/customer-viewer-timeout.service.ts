import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, In, Repository, LessThanOrEqual } from "typeorm";
import {
  CustomerViewer,
  CustomerViewerStatus,
  CustomerViewerGrantType,
} from "./entities/customer-viewer.entity";
import { Customer } from "./entity";

@Injectable()
export class CustomerViewerTimeoutService {
  constructor(
    @InjectRepository(CustomerViewer)
    private readonly viewerRepository: Repository<CustomerViewer>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleViewerExpiration() {
    const now = new Date();
    const expiredViewers = await this.viewerRepository.find({
      where: {
        status: CustomerViewerStatus.enabled as any,
        grantType: CustomerViewerGrantType.temporary as any,
        endTime: LessThanOrEqual(now) as any,
        isDelete: null as any,
      } as any,
    });

    if (!expiredViewers.length) return;

    const expiredIds = expiredViewers.map((v) => v.id);
    await this.viewerRepository.update(
      { id: In(expiredIds) as any } as any,
      {
        status: CustomerViewerStatus.disabled as any,
        updateUser: "system",
      } as any,
    );
  }

  async getExpiringViewers(daysAhead: number = 7) {
    const now = new Date();
    const futureDate = new Date(
      now.getTime() + daysAhead * 24 * 60 * 60 * 1000,
    );
    return this.viewerRepository.find({
      where: {
        status: CustomerViewerStatus.enabled as any,
        grantType: CustomerViewerGrantType.temporary as any,
        endTime: Between(now, futureDate) as any,
        isDelete: null as any,
      } as any,
      relations: ["customer"],
    });
  }
}
