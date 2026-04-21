import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { Contract } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { ContractDto } from "./dto";
import { Customer } from "../customers/entity";
import { User } from "src/modules/users/entities/user.entity";
import { SalesOpportunity } from "../opportunities/entity";
import { Project } from "../../projects/entity";

@Injectable()
export class ContractsService extends BaseService<Contract, ContractDto> {
  constructor(
    @InjectRepository(Contract) repository: Repository<Contract>,
    @InjectRepository(SalesOpportunity)
    private readonly opportunityRepository: Repository<SalesOpportunity>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {
    super(Contract, repository);
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Contract>> {
    const { name, customerId, status, ownerId } = query;

    let whereConditions: any = {};

    if (name) {
      whereConditions.name = this.sqlLike(name);
    }
    if (customerId) {
      whereConditions.customerId = customerId;
    }
    if (status) {
      whereConditions.status = status;
    }
    if (ownerId) {
      whereConditions.ownerId = ownerId;
    }

    const queryOrm: FindManyOptions = {
      where: whereConditions,
      relations: ["customer", "owner"],
    };

    return this.listBy(queryOrm, query);
  }

  async getContractStats(ownerId?: string) {
    const where = ownerId ? { ownerId } : {};
    const [total, executing, expired, terminated, archived] = await Promise.all(
      [
        this.repository.count({ where }),
        this.repository.count({ where: { ...where, status: "1" } }),
        this.repository.count({ where: { ...where, status: "2" } }),
        this.repository.count({ where: { ...where, status: "3" } }),
        this.repository.count({ where: { ...where, status: "4" } }),
      ],
    );
    return { total, executing, expired, terminated, archived };
  }

  private mapCustomerSummary(customer?: Customer | null) {
    if (!customer) return null;
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
    };
  }

  private mapUserSummary(user?: User | null) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }

  private mapProjectSummary(project?: Project | null) {
    if (!project) return null;
    return {
      id: project.id,
      code: project.code,
      name: project.name,
    };
  }

  private mapContractSummary(contract?: Contract | null) {
    if (!contract) return null;
    return {
      id: contract.id,
      code: contract.code,
      name: contract.name,
    };
  }

  private mapOpportunitySummary(opportunity?: SalesOpportunity | null) {
    if (!opportunity) return null;
    return {
      id: opportunity.id,
      code: opportunity.code,
      name: opportunity.name,
    };
  }

  async createProjectDraft(contractId: string) {
    const contract = await this.repository.findOne({
      where: { id: contractId } as any,
      relations: ["customer"],
    });
    if (!contract) {
      throw new BadRequestException("来源合同不存在或已失效");
    }
    if (!contract.customerId) {
      throw new BadRequestException("来源合同缺少客户信息，无法创建项目");
    }
    if (contract.projectId) {
      throw new ConflictException({
        message: "当前合同已关联项目，不能重复创建项目",
        code: "CONTRACT_PROJECT_EXISTS",
        projectId: contract.projectId,
      });
    }

    const opportunity = contract.opportunityId
      ? await this.opportunityRepository.findOne({
          where: { id: contract.opportunityId } as any,
        })
      : null;

    return {
      name: contract.name,
      customerId: contract.customerId,
      contractId: contract.id,
      opportunityId: contract.opportunityId || null,
      startDate: contract.startDate || "",
      endDate: contract.endDate || "",
      planStartDate: contract.startDate || "",
      planEndDate: contract.endDate || "",
      projectSource: "contract",
      contract: this.mapContractSummary(contract),
      opportunity: this.mapOpportunitySummary(opportunity),
    };
  }

  async getOne(query, isError = true): Promise<any | null> {
    const contract = await super.getOne(
      {
        where: query,
        relations: ["customer", "owner"],
      },
      isError,
    );
    if (!contract) return contract;

    const project = contract.projectId
      ? await this.projectRepository.findOne({
          where: { id: contract.projectId } as any,
        })
      : null;
    const opportunity = contract.opportunityId
      ? await this.opportunityRepository.findOne({
          where: { id: contract.opportunityId } as any,
        })
      : null;

    return {
      ...contract,
      customer: this.mapCustomerSummary(contract.customer),
      owner: this.mapUserSummary(contract.owner),
      project: this.mapProjectSummary(project),
      opportunity: this.mapOpportunitySummary(opportunity),
    };
  }
}
