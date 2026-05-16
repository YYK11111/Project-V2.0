import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  In,
  IsNull,
  Like,
  Repository,
  TreeRepository,
} from "typeorm";
import { Project, ProjectStatus } from "./entity";
import { QueryListDto, ResponseListDto } from "src/common/dto";
import { BaseService } from "src/common/BaseService";
import { ProjectDto } from "./dto";
import { Task, TaskStatus } from "../tasks/entity";
import { Ticket, TicketStatus } from "../tickets/entity";
import { SysFileService } from "src/modules/sys/file/service";
import { FileStatus, SysFile } from "src/modules/sys/file/entity";
import { SaveDto } from "src/common/dto";
import { ProjectMember, ProjectMemberRole } from "../project-members/entity";
import { Milestone, MilestoneStatus } from "../milestones/entity";
import { Risk, RiskLevel, RiskStatus } from "../risks/entity";
import { ProjectChange, ChangeImpact, ChangeStatus } from "../changes/entity";
import { Sprint, SprintStatus } from "../sprints/entity";
import { Article, Status as ArticleStatus } from "../articles/entity";
import { ArticleCatalog } from "../articleCatalogs/entity";
import { KnowledgeType, VisibilityType } from "../articles/constants";
import { Contract } from "../crm/contracts/entity";
import { SalesOpportunity } from "../crm/opportunities/entity";
import { GoLiveRecord, GoLiveRecordStatus } from "../go-live-records/entity";
import {
  AcceptanceRecord,
  AcceptanceRecordResult,
} from "../acceptance-records/entity";
import {
  HandoverRecord,
  HandoverRecordStatus,
} from "../handover-records/entity";
import { MessagesService } from "src/modules/messages/service";
import { SystenConfigsService } from "src/modules/configs/service";
import { UsersService } from "src/modules/users/users.service";
import { ProjectCockpitSnapshot } from "./entities/project-cockpit-snapshot.entity";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChangeImpactConfirmHistory } from "../changes/entities/change-impact-confirm-history.entity";
import { ProjectFieldPermissionService } from "./project-field-permission.service";
import { SystemScheduledJobsService } from "src/modules/systemScheduledJobs/service";
import { hasModuleFullAccess } from "src/common/utils/business-list-permission";
import { BusinessApprovalContextService } from "../approval-contexts/service";

@Injectable()
export class ProjectsService extends BaseService<Project, ProjectDto> {
  constructor(
    @InjectRepository(Project) repository: Repository<Project>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
    @InjectRepository(ProjectMember)
    private projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Milestone)
    private milestoneRepository: Repository<Milestone>,
    @InjectRepository(Risk) private riskRepository: Repository<Risk>,
    @InjectRepository(ProjectChange)
    private changeRepository: Repository<ProjectChange>,
    @InjectRepository(Sprint) private sprintRepository: Repository<Sprint>,
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    @InjectRepository(ArticleCatalog)
    private articleCatalogRepository: TreeRepository<ArticleCatalog>,
    @InjectRepository(ProjectCockpitSnapshot)
    private snapshotRepository: Repository<ProjectCockpitSnapshot>,
    @InjectRepository(ChangeImpactConfirmHistory)
    private changeConfirmHistoryRepository: Repository<ChangeImpactConfirmHistory>,
    @InjectRepository(GoLiveRecord)
    private goLiveRecordRepository: Repository<GoLiveRecord>,
    @InjectRepository(AcceptanceRecord)
    private acceptanceRecordRepository: Repository<AcceptanceRecord>,
    @InjectRepository(HandoverRecord)
    private handoverRecordRepository: Repository<HandoverRecord>,
    private readonly messagesService: MessagesService,
    private readonly systemConfigsService: SystenConfigsService,
    private readonly projectFieldPermissionService: ProjectFieldPermissionService,
    private readonly usersService: UsersService,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(SalesOpportunity)
    private opportunityRepository: Repository<SalesOpportunity>,
    private readonly sysFileService: SysFileService,
    private readonly dataSource: DataSource,
    private readonly systemScheduledJobsService: SystemScheduledJobsService,
    private readonly businessApprovalContextService?: BusinessApprovalContextService,
  ) {
    super(Project, repository);
  }

  private readonly projectKnowledgeRootName = "项目知识";
  private readonly projectKnowledgeChildNames = [
    "项目概况",
    "需求与方案",
    "实施交付",
    "运维支持",
    "项目复盘",
  ];
  private readonly projectReviewCatalogName = "项目复盘";

  private canViewAllProjects(permissions: string[] = []) {
    return hasModuleFullAccess(permissions, "business/projects/list");
  }

  private canManageAllProjects(permissions: string[] = []) {
    return hasModuleFullAccess(permissions, "business/projects/update");
  }

  private buildProjectVisibleScopeParams(options: {
    operatorId?: string;
    operatorName?: string;
    workflowVisibleProjectIds?: string[];
  }) {
    const operatorId = String(options.operatorId || "");
    const operatorName = String(options.operatorName || "");
    const workflowVisibleProjectIds = (options.workflowVisibleProjectIds || [])
      .map((id) => String(id || ""))
      .filter(Boolean);
    const baseConditions = [
      "project.leaderId = :operatorId",
      "project.creatorId = :operatorId",
      "project.createUser = :operatorName",
      "projectMember.id IS NOT NULL",
    ];
    const creatorOnlyConditions = [
      "project.status NOT IN (:...creatorOnlyStatuses)",
      "project.creatorId = :operatorId",
      "project.createUser = :operatorName",
    ];
    const scopeParams: Record<string, any> = {
      operatorId,
      operatorName,
    };
    const creatorOnlyParams: Record<string, any> = {
      creatorOnlyStatuses: [ProjectStatus.draft, ProjectStatus.approvalPending],
      operatorId,
      operatorName,
    };

    if (workflowVisibleProjectIds.length) {
      baseConditions.push("project.id IN (:...workflowVisibleProjectIds)");
      creatorOnlyConditions.push(
        "project.id IN (:...workflowVisibleProjectIds)",
      );
      scopeParams.workflowVisibleProjectIds = workflowVisibleProjectIds;
      creatorOnlyParams.workflowVisibleProjectIds = workflowVisibleProjectIds;
    }

    return {
      baseCondition: `(${baseConditions.join(" OR ")})`,
      baseParams: scopeParams,
      creatorOnlyCondition: `(${creatorOnlyConditions.join(" OR ")})`,
      creatorOnlyParams,
      workflowVisibleProjectIds,
    };
  }

  private canViewCreatorOnlyProject(
    project: Pick<Project, "status" | "creatorId" | "createUser">,
    userId?: string,
    userName?: string,
    hasWorkflowAccess = false,
  ) {
    if (!this.isCreatorOnlyProject(project)) return true;
    return (
      this.isProjectCreator(project, userId, userName) || hasWorkflowAccess
    );
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

  private getFileRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(SysFile)
      : this.sysFileService["repository"];
  }

  private normalizeProjectPayload(
    dto: SaveDto<ProjectDto> & {
      attachments?: string[];
      members?: any[];
      milestones?: any[];
    },
  ) {
    if (typeof dto.attachments === "string" && !dto.attachments) {
      dto.attachments = [] as any;
    }
    if (dto.attachments != null && !Array.isArray(dto.attachments)) {
      dto.attachments = [dto.attachments].filter(Boolean) as any;
    }
    dto.members = Array.isArray(dto.members) ? dto.members : [];
    dto.milestones = Array.isArray(dto.milestones) ? dto.milestones : [];
    const status = String(dto.status || "");
    if (
      !status ||
      status === ProjectStatus.draft ||
      status === ProjectStatus.approvalPending
    ) {
      dto.phase = "init" as any;
    } else if (
      status === ProjectStatus.executing ||
      status === ProjectStatus.paused
    ) {
      dto.phase = "delivery" as any;
    } else if (status === ProjectStatus.closeApprovalPending) {
      dto.phase = "acceptance" as any;
    } else if (
      status === ProjectStatus.completed ||
      status === ProjectStatus.cancelled
    ) {
      dto.phase = "closure" as any;
    }
    return dto;
  }

  private getProtectedProjectFields() {
    const groupFieldMap = this.projectFieldPermissionService.getGroupFieldMap();
    return Array.from(
      new Set(
        Object.entries(groupFieldMap)
          .filter(([groupCode]) => groupCode !== "projectKnowledge")
          .flatMap(([, fields]) => fields),
      ),
    );
  }

  private diffProtectedFields(
    original: Project,
    nextPayload: Record<string, any>,
  ) {
    const protectedFields = this.getProtectedProjectFields();
    return protectedFields.filter((field) => {
      if (!(field in nextPayload)) return false;
      return (
        JSON.stringify(original?.[field]) !==
        JSON.stringify(nextPayload?.[field])
      );
    });
  }

  private resolveChangedGroupCodes(changedFields: string[]) {
    const groupFieldMap = this.projectFieldPermissionService.getGroupFieldMap();
    return Object.entries(groupFieldMap)
      .filter(([, fields]) =>
        fields.some((field) => changedFields.includes(field)),
      )
      .map(([groupCode]) => groupCode);
  }

  private isProjectLifecycleLocked(project?: Project | null) {
    if (!project) return false;
    return String(project.status || "") !== ProjectStatus.draft;
  }

  private assertProjectLifecycleEditable(
    originalProject: Project,
    changedFields: string[],
  ) {
    if (!this.isProjectLifecycleLocked(originalProject)) return;
    if (!changedFields.length) return;
    throw new ForbiddenException(
      "项目立项后不允许直接编辑，请通过项目变更发起调整",
    );
  }

  private async assertProjectFieldEditPermission(
    projectId: string,
    operatorId: string,
    changedFields: string[],
  ) {
    if (!changedFields.length) return;
    const permissionContext = await this.assertProjectPermission(
      projectId,
      operatorId,
      "edit",
    );
    const project = await this.getOne({ id: projectId });
    const permissionResult =
      await this.projectFieldPermissionService.getProjectFieldPermissions({
        project,
        rawRole: permissionContext.role,
        canVisit: true,
      });
    const deniedFields = changedFields.filter(
      (field) => permissionResult.fields[field] !== "editable",
    );
    if (!deniedFields.length) return;
    const deniedGroups = this.resolveChangedGroupCodes(deniedFields);
    throw new ForbiddenException({
      message: `当前角色无权编辑字段组：${deniedGroups.join(", ")}`,
      details: {
        fields: deniedFields,
      },
    });
  }

  private async assertProjectCollectionPermission(
    projectId: string,
    operatorId: string,
    groupCode: string,
    fieldName: string,
  ) {
    const permissionContext = await this.assertProjectPermission(
      projectId,
      operatorId,
      "edit",
    );
    const project = await this.getOne({ id: projectId });
    const permissionResult =
      await this.projectFieldPermissionService.getProjectFieldPermissions({
        project,
        rawRole: permissionContext.role,
        canVisit: true,
      });
    if (permissionResult.groups[groupCode] === "editable") return;
    throw new ForbiddenException({
      message: `当前角色无权编辑字段组：${groupCode}`,
      details: {
        fields: [fieldName],
      },
    });
  }

  private async getFileIdsByPaths(
    paths: (string | { url: string })[],
    manager?: EntityManager,
  ): Promise<string[]> {
    if (!paths || paths.length === 0) return [];
    const stringPaths = paths
      .map((p) => (typeof p === "string" ? p : p.url))
      .filter(Boolean);
    if (stringPaths.length === 0) return [];
    const files = await this.getFileRepository(manager).find({
      where: { storedPath: In(stringPaths) },
      select: ["id"],
    });
    return files.map((f) => f.id);
  }

  private async associateFilesInTransaction(
    manager: EntityManager,
    businessId: string,
    attachments: string[] | undefined,
  ) {
    if (attachments === undefined || !businessId) return;
    const fileIds = await this.getFileIdsByPaths(attachments, manager);
    await manager
      .getRepository(SysFile)
      .update({ businessType: "project", businessId } as any, {
        businessType: null as any,
        businessId: null as any,
        status: FileStatus.Pending as any,
      });
    if (fileIds.length === 0) return;
    await manager.getRepository(SysFile).update({ id: In(fileIds) } as any, {
      businessType: "project",
      businessId,
      status: FileStatus.Associated as any,
    });
  }

  private async saveProjectGraph(
    dto: SaveDto<ProjectDto> & {
      attachments?: string[];
      members?: any[];
      milestones?: any[];
      _operatorId?: string;
      _operatorPermissions?: string[];
    },
    mode: "save" | "add" | "update",
  ) {
    this.normalizeProjectPayload(dto);
    const operatorId = String(dto._operatorId || "");
    const operatorPermissions = Array.isArray(dto._operatorPermissions)
      ? dto._operatorPermissions
      : [];
    const attachments = dto.attachments;
    const members = dto.members || [];
    const milestones = dto.milestones || [];
    delete dto.attachments;
    delete dto.members;
    delete dto.milestones;
    delete dto._operatorPermissions;
    delete dto._operatorId;

    const isExistingProject = Boolean(dto.id);
    const canBypassProjectScope =
      this.canManageAllProjects(operatorPermissions);
    if (isExistingProject && operatorId && !canBypassProjectScope) {
      await this.assertProjectPermission(dto.id, operatorId, "edit");
      const originalProject = await this.getOne({ id: dto.id });
      const changedFields = this.diffProtectedFields(
        originalProject,
        dto as any,
      );
      this.assertProjectLifecycleEditable(originalProject, changedFields);
      await this.assertProjectFieldEditPermission(
        dto.id,
        operatorId,
        changedFields,
      );
      if (members.length) {
        this.assertProjectLifecycleEditable(originalProject, ["members"]);
        await this.assertProjectCollectionPermission(
          dto.id,
          operatorId,
          "projectMember",
          "members",
        );
      }
      if (milestones.length) {
        this.assertProjectLifecycleEditable(originalProject, ["milestones"]);
        await this.assertProjectCollectionPermission(
          dto.id,
          operatorId,
          "projectPlan",
          "milestones",
        );
      }
    }

    if ((mode === "save" || mode === "add") && !dto.code) {
      dto.code = await this.generateProjectCode();
    }

    dto.status ??= ProjectStatus.draft;
    if (!isExistingProject && operatorId) {
      dto.creatorId = operatorId;
    }

    const previousProject = dto.id
      ? await this.repository.findOne({ where: { id: dto.id } as any })
      : null;

    this.normalizeProjectPlanDates(dto);
    this.validateProjectSourceMutation(previousProject, dto);

    return this.dataSource.transaction(async (manager) => {
      const projectRepository = manager.getRepository(Project);
      const projectMemberRepository = manager.getRepository(ProjectMember);
      const milestoneRepository = manager.getRepository(Milestone);
      const baseService = new BaseService<Project, ProjectDto>(
        Project,
        projectRepository,
      );

      let result: Project | Project[];
      if (mode === "add") {
        delete dto.id;
        result = await baseService.add(dto as any);
      } else if (mode === "update") {
        if (!dto.id) throw new Error("数据不存在");
        result = await baseService.update(dto as any);
      } else {
        result = await baseService.save(dto as any);
      }

      const saved = Array.isArray(result) ? result[0] : result;
      if (!saved?.id) return result;

      await this.syncProjectSourceLinks(manager, saved, previousProject);

      await this.syncMembers(saved.id, members, projectMemberRepository);
      await this.syncMilestones(
        saved.id,
        milestones,
        milestoneRepository,
        operatorId,
      );
      await this.associateFilesInTransaction(manager, saved.id, attachments);

      return projectRepository.findOne({
        where: { id: saved.id } as any,
        relations: ["leader", "creator", "customer"],
      });
    });
  }

  private validateProjectSourceMutation(
    previousProject: Project | null,
    dto: SaveDto<ProjectDto>,
  ) {
    if (!previousProject) return;

    if (String(previousProject.status || "") !== ProjectStatus.draft) {
      if (
        String(previousProject.contractId || "") !==
        String(dto.contractId || "")
      ) {
        throw new BadRequestException("项目进入审批后不允许修改来源合同");
      }
      if (
        String(previousProject.opportunityId || "") !==
        String(dto.opportunityId || "")
      ) {
        throw new BadRequestException("项目进入审批后不允许修改来源商机");
      }
    }
  }

  private normalizeProjectPlanDates(dto: Partial<ProjectDto | Project>) {
    const hasStartDate =
      Object.prototype.hasOwnProperty.call(dto, "planStartDate") ||
      Object.prototype.hasOwnProperty.call(dto, "startDate");
    const hasEndDate =
      Object.prototype.hasOwnProperty.call(dto, "planEndDate") ||
      Object.prototype.hasOwnProperty.call(dto, "endDate");

    if (hasStartDate) {
      const normalizedPlanStartDate = dto.planStartDate || dto.startDate || "";
      dto.planStartDate = normalizedPlanStartDate;
      dto.startDate = normalizedPlanStartDate;
    }

    if (hasEndDate) {
      const normalizedPlanEndDate = dto.planEndDate || dto.endDate || "";
      dto.planEndDate = normalizedPlanEndDate;
      dto.endDate = normalizedPlanEndDate;
    }
  }

  private async syncProjectSourceLinks(
    manager: EntityManager,
    savedProject: Project,
    previousProject: Project | null,
  ) {
    const contractRepository = manager.getRepository(Contract);
    const opportunityRepository = manager.getRepository(SalesOpportunity);
    const previousContractId = String(previousProject?.contractId || "");
    const currentContractId = String(savedProject.contractId || "");

    if (previousContractId && previousContractId !== currentContractId) {
      const previousContract = await contractRepository.findOne({
        where: { id: previousContractId } as any,
      });
      if (
        previousContract &&
        String(previousContract.projectId || "") === String(savedProject.id)
      ) {
        await contractRepository.update(previousContract.id, {
          projectId: null as any,
        });
      }
    }

    if (currentContractId) {
      const contract = await contractRepository.findOne({
        where: { id: currentContractId } as any,
      });
      if (!contract) {
        throw new BadRequestException("来源合同不存在或已失效");
      }
      if (
        String(contract.projectId || "") &&
        String(contract.projectId || "") !== String(savedProject.id)
      ) {
        throw new ConflictException({
          message: "当前合同已关联其他项目",
          code: "CONTRACT_PROJECT_CONFLICT",
          projectId: contract.projectId,
        });
      }
      await contractRepository.update(contract.id, {
        projectId: String(savedProject.id),
      });
    }

    if (savedProject.opportunityId) {
      const opportunity = await opportunityRepository.findOne({
        where: { id: savedProject.opportunityId } as any,
      });
      if (!opportunity) {
        throw new BadRequestException("来源商机不存在或已失效");
      }
      if (
        String(opportunity.projectId || "") &&
        String(opportunity.projectId || "") !== String(savedProject.id)
      ) {
        throw new ConflictException({
          message: "当前商机已关联其他项目",
          code: "OPPORTUNITY_PROJECT_CONFLICT",
          projectId: opportunity.projectId,
        });
      }
      await opportunityRepository.update(opportunity.id, {
        projectId: String(savedProject.id),
      });
    }
  }

  private async validateProjectSourceChain(project: Project) {
    if (!project.contractId) return;

    const contract = await this.contractRepository.findOne({
      where: { id: project.contractId } as any,
    });
    if (!contract) {
      throw new BadRequestException("来源合同不存在或已失效");
    }
    if (
      String(project.customerId || "") !== String(contract.customerId || "")
    ) {
      throw new BadRequestException("项目客户与来源合同不一致");
    }
    if (
      String(project.opportunityId || "") !==
      String(contract.opportunityId || "")
    ) {
      throw new BadRequestException("项目商机与来源合同不一致");
    }
    if (
      String(contract.projectId || "") &&
      String(contract.projectId || "") !== String(project.id)
    ) {
      throw new ConflictException({
        message: "来源合同已被其他项目占用",
        code: "CONTRACT_PROJECT_OCCUPIED",
        projectId: contract.projectId,
      });
    }

    if (project.opportunityId) {
      const opportunity = await this.opportunityRepository.findOne({
        where: { id: project.opportunityId } as any,
      });
      if (!opportunity) {
        throw new BadRequestException("来源商机不存在或已失效");
      }
      if (
        String(opportunity.customerId || "") !==
        String(project.customerId || "")
      ) {
        throw new BadRequestException("项目客户与来源商机不一致");
      }
    }
  }

  async ensureProjectApprovalReady(id: string) {
    const project = await this.repository.findOne({ where: { id } as any });
    if (!project) {
      throw new BadRequestException("项目不存在");
    }
    await this.validateProjectSourceChain(project);
    return project;
  }

  async save(
    dto: SaveDto<ProjectDto> & {
      attachments?: string[];
      members?: any[];
      milestones?: any[];
    },
  ) {
    return this.saveProjectGraph(dto, "save");
  }

  async add(
    dto: SaveDto<ProjectDto> & {
      attachments?: string[];
      members?: any[];
      milestones?: any[];
    },
  ) {
    return this.saveProjectGraph(dto, "add");
  }

  async update(
    dto: SaveDto<ProjectDto> & {
      attachments?: string[];
      members?: any[];
      milestones?: any[];
    },
  ) {
    return this.saveProjectGraph(dto, "update");
  }

  private async generateProjectCode(): Promise<string> {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const prefix = `PRJ-${today}-`;

    const latest = await this.repository
      .createQueryBuilder("project")
      .where("project.code LIKE :prefix", { prefix: prefix + "%" })
      .orderBy("project.code", "DESC")
      .getOne();

    let seq = 1;
    if (latest && latest.code) {
      const lastSeq = parseInt(latest.code.replace(prefix, ""), 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}${seq.toString().padStart(4, "0")}`;
  }

  async calculateProjectProgress(projectId: string): Promise<number> {
    const totalTasks = await this.taskRepository.count({
      where: { projectId, isDelete: null as any } as any,
    });
    const completedTasks = await this.taskRepository.count({
      where: {
        projectId,
        status: TaskStatus.completed,
        isDelete: null as any,
      } as any,
    });
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  async recalculateProjectProgress(projectId: string): Promise<number> {
    if (!projectId) return 0;
    const progress = await this.calculateProjectProgress(projectId);
    await this.repository.update(projectId, { progress } as any);
    return progress;
  }

  async recalculateProjectSpentHours(projectId: string): Promise<number> {
    if (!projectId) return 0;
    const tasks = await this.taskRepository.find({
      where: { projectId, isDelete: null as any } as any,
      select: ["id", "actualHours"] as any,
    });
    const spentHours = tasks.reduce(
      (sum, item) => sum + Number(item.actualHours || 0),
      0,
    );
    await this.repository.update(projectId, { spentHours } as any);
    return spentHours;
  }

  async recalculateProjectProgressBatch(projectIds?: string[]) {
    let targetProjectIds = Array.from(
      new Set((projectIds || []).filter(Boolean).map((id) => String(id))),
    );

    if (!targetProjectIds.length) {
      const projects = await this.repository.find({
        where: { isDelete: null as any } as any,
        select: ["id"] as any,
      });
      targetProjectIds = projects
        .map((item) => String(item.id))
        .filter(Boolean);
    }

    const results: Array<{ projectId: string; progress: number }> = [];
    for (const projectId of targetProjectIds) {
      const progress = await this.recalculateProjectProgress(projectId);
      results.push({ projectId, progress });
    }

    return {
      total: results.length,
      results,
    };
  }

  async ensureKnowledgeSpaceWhenProjectExecuting(projectId: string) {
    if (!projectId) return null;
    const project = await this.repository.findOne({
      where: { id: projectId } as any,
    });
    if (!project || project.status !== ProjectStatus.executing) return null;
    if (project.knowledgeCatalogId) {
      return this.articleCatalogRepository.findOne({
        where: { id: project.knowledgeCatalogId } as any,
      });
    }

    const members = await this.projectMemberRepository.find({
      where: { projectId, isActive: "1", isDelete: null as any } as any,
      order: { sort: "ASC", createTime: "ASC" },
    });
    const visibleUserIds = Array.from(
      new Set(members.map((item) => String(item.userId || "")).filter(Boolean)),
    );
    const managerUserIds = Array.from(
      new Set(
        members
          .filter((item) => item.role === ProjectMemberRole.manager)
          .map((item) => String(item.userId || ""))
          .filter(Boolean),
      ),
    );
    if (!managerUserIds.length && project.leaderId) {
      managerUserIds.push(String(project.leaderId));
    }
    if (
      project.leaderId &&
      !visibleUserIds.includes(String(project.leaderId))
    ) {
      visibleUserIds.push(String(project.leaderId));
    }

    const rootCatalog = await this.ensureProjectKnowledgeRootCatalog();
    const mainCatalog = await this.articleCatalogRepository.save(
      new ArticleCatalog({
        name: this.buildProjectKnowledgeCatalogName(project),
        parentId: rootCatalog.id,
        parent: Object.assign(new ArticleCatalog(), { id: rootCatalog.id }),
        managerUserIds,
        defaultVisibilityType: VisibilityType.specified,
        defaultVisibleRoleIds: [],
        defaultVisibleUserIds: visibleUserIds,
        allowBorrow: "1",
        borrowApprovalMode: "catalogManager",
        maxBorrowDays: 7,
        needBorrowReason: "1",
      }),
    );

    for (const [index, name] of this.projectKnowledgeChildNames.entries()) {
      await this.articleCatalogRepository.save(
        new ArticleCatalog({
          name,
          parentId: mainCatalog.id,
          parent: Object.assign(new ArticleCatalog(), { id: mainCatalog.id }),
          managerUserIds,
          defaultVisibilityType: VisibilityType.specified,
          defaultVisibleRoleIds: [],
          defaultVisibleUserIds: visibleUserIds,
          allowBorrow: "1",
          borrowApprovalMode: "catalogManager",
          maxBorrowDays: 7,
          needBorrowReason: "1",
          order: String((index + 1) * 10),
        }),
      );
    }

    await this.repository.update(projectId, {
      knowledgeCatalogId: mainCatalog.id,
    } as any);
    return mainCatalog;
  }

  async validateBaselinePlan(projectId: string) {
    const project = await this.getOne({ id: projectId });
    const milestones = await this.milestoneRepository.find({
      where: { projectId, isDelete: null as any } as any,
      order: { sort: "ASC", createTime: "ASC" },
    });
    const projectPlanStartDate = project.planStartDate || project.startDate;
    const projectPlanEndDate = project.planEndDate || project.endDate;

    if (!projectPlanStartDate || !projectPlanEndDate) {
      throw new Error("发起立项审批前，请先补齐项目起止时间");
    }
    if (
      !project.baselineDeliverables ||
      !String(project.baselineDeliverables).trim()
    ) {
      throw new Error("发起立项审批前，请先补齐主要交付物");
    }
    if (!project.scopeBoundary || !String(project.scopeBoundary).trim()) {
      throw new Error("发起立项审批前，请先补齐范围边界说明");
    }
    if (!milestones.length) {
      throw new Error("发起立项审批前，请至少维护一条关键里程碑");
    }
    const invalidMilestone = milestones.find(
      (item) => !item.name || !String(item.name).trim() || !item.dueDate,
    );
    if (invalidMilestone) {
      throw new Error("发起立项审批前，请补齐所有关键里程碑的名称和计划日期");
    }
    return {
      projectId,
      baselineMilestoneCount: milestones.length,
    };
  }

  async validateClosePlan(projectId: string) {
    const project = await this.getOne({ id: projectId });
    if (!project.closeSummary || !String(project.closeSummary).trim()) {
      throw new Error("发起结项审批前，请先补齐验收说明");
    }
    if (
      !project.closeDeliverables ||
      !String(project.closeDeliverables).trim()
    ) {
      throw new Error("发起结项审批前，请先补齐交付清单");
    }
    if (!project.closeReview || !String(project.closeReview).trim()) {
      throw new Error("发起结项审批前，请先补齐项目复盘");
    }
    const [goLiveCount, acceptanceCount] = await Promise.all([
      this.goLiveRecordRepository.count({
        where: {
          projectId,
          status: GoLiveRecordStatus.succeeded,
          isDelete: null as any,
        } as any,
      }),
      this.acceptanceRecordRepository.count({
        where: {
          projectId,
          result: AcceptanceRecordResult.passed,
          isDelete: null as any,
        } as any,
      }),
    ]);
    if (!goLiveCount) {
      throw new BadRequestException(
        "发起结项审批前，请至少维护一条已成功的上线记录",
      );
    }
    if (!acceptanceCount) {
      throw new BadRequestException(
        "发起结项审批前，请至少维护一条已通过的验收记录",
      );
    }
    return {
      projectId,
      acceptanceDate: project.acceptanceDate || null,
      goLiveCount,
      acceptanceCount,
    };
  }

  async publishCloseReviewToKnowledge(
    projectId: string,
    currentUser: { id?: string; name?: string } = {},
  ) {
    const project = await this.getOne({ id: projectId });
    if (!project) throw new Error("项目不存在");
    if (!project.closeReview || !String(project.closeReview).trim()) {
      throw new Error("请先补齐项目复盘后再沉淀到知识中心");
    }

    await this.ensureKnowledgeSpaceWhenProjectExecuting(projectId);
    const latestProject = await this.getOne({ id: projectId });
    if (!latestProject.knowledgeCatalogId) {
      throw new Error("当前项目尚未生成项目知识空间");
    }

    const reviewCatalog = await this.articleCatalogRepository.findOne({
      where: {
        parentId: latestProject.knowledgeCatalogId,
        name: this.projectReviewCatalogName,
        isDelete: null as any,
      } as any,
    });
    if (!reviewCatalog) {
      throw new Error("当前项目尚未生成“项目复盘”知识分类");
    }

    const title = `${latestProject.name || "项目"}-结项复盘`;
    const existing = await this.articleRepository.findOne({
      where: {
        catalogId: reviewCatalog.id,
        title,
        isDelete: null as any,
      } as any,
      order: { createTime: "DESC" },
    });

    const content = [
      "## 验收说明",
      latestProject.closeSummary || "暂无",
      "",
      "## 交付清单",
      latestProject.closeDeliverables || "暂无",
      "",
      "## 遗留问题",
      latestProject.closeOpenIssues || "暂无",
      "",
      "## 项目复盘",
      latestProject.closeReview || "暂无",
    ].join("\n");

    const operatorId = String(currentUser.id || latestProject.leaderId || "");
    const operatorName = String(currentUser.name || "系统");
    const article = await this.articleRepository.save(
      new Article({
        id: existing?.id,
        title,
        desc: latestProject.closeSummary || latestProject.closeReview || "",
        summary: String(
          latestProject.closeSummary || latestProject.closeReview || "",
        ).slice(0, 200),
        catalogId: reviewCatalog.id,
        catalog: Object.assign(new ArticleCatalog(), { id: reviewCatalog.id }),
        thumb: existing?.thumb || "",
        content,
        contentText: content,
        knowledgeType: KnowledgeType.experience,
        authorId: operatorId || null,
        maintainerId: operatorId || null,
        visibilityType: VisibilityType.specified,
        visibleRoleIds: [],
        visibleUserIds: reviewCatalog.defaultVisibleUserIds || [],
        order: existing?.order || "1",
        status: ArticleStatus.published,
        createUser: operatorName,
        updateUser: operatorName,
      }),
    );

    return {
      articleId: article.id,
      catalogId: reviewCatalog.id,
      title: article.title,
    };
  }

  async getKnowledgeChildCatalog(projectId: string, catalogName: string) {
    await this.ensureKnowledgeSpaceWhenProjectExecuting(projectId);
    const project = await this.getOne({ id: projectId });
    if (!project?.knowledgeCatalogId) return null;
    return this.articleCatalogRepository.findOne({
      where: {
        parentId: project.knowledgeCatalogId,
        name: catalogName,
        isDelete: null as any,
      } as any,
    });
  }

  private async ensureProjectKnowledgeRootCatalog() {
    const existing = await this.articleCatalogRepository.findOne({
      where: {
        name: this.projectKnowledgeRootName,
        parentId: IsNull() as any,
        isDelete: null as any,
      } as any,
      order: { createTime: "ASC" },
    });
    if (existing) return existing;
    return this.articleCatalogRepository.save(
      new ArticleCatalog({
        name: this.projectKnowledgeRootName,
        parentId: null as any,
        managerUserIds: [],
        defaultVisibilityType: VisibilityType.public,
        defaultVisibleRoleIds: [],
        defaultVisibleUserIds: [],
        allowBorrow: "0",
        borrowApprovalMode: "catalogManager",
        maxBorrowDays: 7,
        needBorrowReason: "1",
      }),
    );
  }

  private buildProjectKnowledgeCatalogName(project: Project) {
    const code = String(project.code || "").trim();
    const name = String(project.name || "").trim();
    return code && name
      ? `${code}-${name}`
      : code || name || `项目-${project.id}`;
  }

  private async getKnowledgeSummary(project: Project) {
    const catalogId = String(project?.knowledgeCatalogId || "");
    if (!catalogId) {
      return {
        total: 0,
        faq: 0,
        experience: 0,
        delivery: 0,
        recentUpdatedCount: 0,
        latestArticles: [],
      };
    }

    const catalogs = await this.articleCatalogRepository.findDescendants(
      new ArticleCatalog({ id: catalogId }),
    );
    const catalogIds = catalogs.map((item) => String(item.id)).filter(Boolean);
    if (!catalogIds.length) {
      return {
        total: 0,
        faq: 0,
        experience: 0,
        delivery: 0,
        recentUpdatedCount: 0,
        latestArticles: [],
      };
    }

    const articles = await this.articleRepository.find({
      where: {
        catalogId: In(catalogIds) as any,
        isDelete: null as any,
        status: ArticleStatus.published as any,
      } as any,
      relations: ["catalog", "author", "maintainer", "tags"],
      order: { updateTime: "DESC", createTime: "DESC" },
      take: 100,
    });
    const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: articles.length,
      faq: articles.filter((item) => item.knowledgeType === KnowledgeType.faq)
        .length,
      experience: articles.filter(
        (item) => item.knowledgeType === KnowledgeType.experience,
      ).length,
      delivery: articles.filter(
        (item) => item.knowledgeType === KnowledgeType.delivery,
      ).length,
      recentUpdatedCount: articles.filter(
        (item) =>
          new Date(item.updateTime || item.createTime || 0).getTime() >=
          recentThreshold,
      ).length,
      latestArticles: articles.slice(0, 5),
    };
  }

  async list(query: QueryListDto): Promise<ResponseListDto<Project>> {
    let {
      name,
      code,
      status,
      priority,
      category,
      phase,
      businessLine,
      industry,
      projectSource,
      departmentId,
      creatorId,
      riskLevel,
      qualityLevel,
      leaderId,
      isArchived,
      projectType,
      _operatorId,
      _operatorName,
      _operatorPermissions,
    } = query as QueryListDto & {
      projectType?: string;
      _operatorId?: string;
      _operatorName?: string;
      _operatorPermissions?: string[];
    };

    const canViewAll = Array.isArray(_operatorPermissions)
      ? this.canViewAllProjects(_operatorPermissions)
      : false;
    const canManageAll = Array.isArray(_operatorPermissions)
      ? this.canManageAllProjects(_operatorPermissions)
      : false;
    const workflowVisibleProjectIds = canViewAll
      ? []
      : await this.getApprovalVisibleProjectIdsForUser(_operatorId || "");
    const visibleScope = this.buildProjectVisibleScopeParams({
      operatorId: _operatorId,
      operatorName: _operatorName,
      workflowVisibleProjectIds,
    });

    const queryBuilder = this.repository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.leader", "leader")
      .leftJoinAndSelect("project.creator", "creator")
      .leftJoin(
        ProjectMember,
        "projectMember",
        "projectMember.projectId = project.id AND projectMember.userId = :operatorId AND projectMember.isDelete IS NULL AND projectMember.isActive = '1'",
        { operatorId: _operatorId || "" },
      )
      .where("project.isDelete IS NULL");

    if (name)
      queryBuilder.andWhere("project.name LIKE :name", { name: `%${name}%` });
    if (code)
      queryBuilder.andWhere("project.code LIKE :code", { code: `%${code}%` });
    if (status) queryBuilder.andWhere("project.status = :status", { status });
    if (priority)
      queryBuilder.andWhere("project.priority = :priority", { priority });
    if (category)
      queryBuilder.andWhere("project.category LIKE :category", {
        category: `%${category}%`,
      });
    if (phase) queryBuilder.andWhere("project.phase = :phase", { phase });
    if (businessLine)
      queryBuilder.andWhere("project.businessLine LIKE :businessLine", {
        businessLine: `%${businessLine}%`,
      });
    if (industry)
      queryBuilder.andWhere("project.industry LIKE :industry", {
        industry: `%${industry}%`,
      });
    if (projectSource)
      queryBuilder.andWhere("project.projectSource LIKE :projectSource", {
        projectSource: `%${projectSource}%`,
      });
    if (departmentId)
      queryBuilder.andWhere("project.departmentId = :departmentId", {
        departmentId,
      });
    if (creatorId)
      queryBuilder.andWhere("project.creatorId = :creatorId", { creatorId });
    if (riskLevel)
      queryBuilder.andWhere("project.riskLevel = :riskLevel", { riskLevel });
    if (qualityLevel)
      queryBuilder.andWhere("project.qualityLevel = :qualityLevel", {
        qualityLevel,
      });
    if (leaderId)
      queryBuilder.andWhere("project.leaderId = :leaderId", { leaderId });
    if (isArchived != null && isArchived !== "")
      queryBuilder.andWhere("project.isArchived = :isArchived", { isArchived });
    if (projectType)
      queryBuilder.andWhere("project.projectType = :projectType", {
        projectType,
      });

    if (!canViewAll) {
      queryBuilder.andWhere(
        visibleScope.baseCondition,
        visibleScope.baseParams,
      );
    }

    queryBuilder.andWhere(
      visibleScope.creatorOnlyCondition,
      visibleScope.creatorOnlyParams,
    );

    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const [list, total] = await queryBuilder
      .orderBy("project.createTime", "DESC")
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    if (_operatorId) {
      const projectIds = list.map((item) => String(item.id)).filter(Boolean);
      const members = projectIds.length
        ? await this.projectMemberRepository.find({
            where: {
              projectId: In(projectIds),
              userId: String(_operatorId),
              isActive: "1",
              isDelete: null as any,
            } as any,
          })
        : [];
      const memberMap = new Map(
        members.map((item) => [String(item.projectId), item]),
      );
      for (const project of list) {
        const member = memberMap.get(String(project.id));
        const isLeader = String(project.leaderId || "") === String(_operatorId);
        const role =
          member?.role || (isLeader ? ProjectMemberRole.manager : null);
        const isManager =
          canManageAll || isLeader || role === ProjectMemberRole.manager;
        const isDeliveryManager = role === ProjectMemberRole.deliveryManager;
        const isCore = String(member?.isCore || "0") === "1";
        const isFunctionalLead = [
          ProjectMemberRole.techLead,
          ProjectMemberRole.implementationLead,
          ProjectMemberRole.testLead,
        ].includes(role as any);
        const isVisitor = role === ProjectMemberRole.visitor;
        const canManagePlan = canManageAll || isManager || isDeliveryManager;
        const canManageDelivery =
          canManageAll || isManager || isDeliveryManager;
        const canManageExecution =
          canManageAll ||
          isManager ||
          isDeliveryManager ||
          isFunctionalLead ||
          isCore;
        const canManageQuality =
          canManageAll || isManager || isDeliveryManager || isFunctionalLead;
        Object.assign(project, {
          permissionContext: {
            role,
            canViewAll,
            canManageAll,
            isManager,
            isDeliveryManager,
            isCore,
            isFunctionalLead,
            isVisitor,
            canView:
              canViewAll ||
              canManageAll ||
              !isVisitor ||
              Boolean(member) ||
              isLeader,
            canEdit: canManageAll || isManager,
            canSubmitApproval: canManageAll || isManager,
            canSubmitClose: canManageAll || isManager,
            canArchive: canManageAll,
            canDelete: canManageAll,
            canManageMembers: canManageAll || isManager,
            canManagePlan,
            canManageExecution,
            canManageTasks: canManageExecution,
            canManageRisks: canManageQuality,
            canManageChanges: canManageQuality,
            canManageDelivery,
            canReadExecution: !isVisitor,
          },
        });
      }
    }

    return {
      list,
      total,
    } as any;
  }

  async getOne(query, isError = true): Promise<any | null> {
    const {
      _operatorId,
      _operatorName,
      _operatorDeptId,
      _operatorPermissions,
      _operatorRoles,
      ...whereQuery
    } = query || {};
    const project = await super.getOne(
      {
        where: { ...whereQuery },
        relations: ["leader", "creator", "customer"],
      },
      isError,
    );
    if (!project) return project;
    if (
      (_operatorId || _operatorName) &&
      !this.canViewCreatorOnlyProject(
        project,
        _operatorId,
        _operatorName,
        await this.businessApprovalContextService?.hasRootBusinessParticipantAccess(
          String(_operatorId || ""),
          "project",
          String(project.id || ""),
        ),
      )
    ) {
      throw new ForbiddenException("项目不存在或当前无访问权限");
    }

    const calculatedProgress = await this.calculateProjectProgress(project.id);
    if (Number(project.progress || 0) !== calculatedProgress) {
      project.progress = calculatedProgress;
      await this.repository.update(project.id, {
        progress: calculatedProgress,
      } as any);
    }

    const members = await this.projectMemberRepository.find({
      where: { projectId: project.id, isActive: "1" },
      relations: ["user"],
      order: { sort: "ASC", createTime: "ASC" },
    });

    const milestones = await this.milestoneRepository.find({
      where: { projectId: project.id },
      relations: ["owner"],
      order: { sort: "ASC", createTime: "ASC" },
    });

    const [contract, opportunity] = await Promise.all([
      project.contractId
        ? this.contractRepository.findOne({
            where: { id: project.contractId } as any,
          })
        : Promise.resolve(null),
      project.opportunityId
        ? this.opportunityRepository.findOne({
            where: { id: project.opportunityId } as any,
          })
        : Promise.resolve(null),
    ]);

    return {
      ...project,
      contract: this.mapContractSummary(contract),
      opportunity: this.mapOpportunitySummary(opportunity),
      members: members.map((member) => ({
        id: member.id,
        projectId: member.projectId,
        userId: member.userId,
        role: member.role,
        isCore: member.isCore,
        joinDate: member.joinDate,
        notificationEnabled: member.notificationEnabled,
        responsibilityScope: member.responsibilityScope || [],
        remark: member.remark,
        sort: member.sort,
        isActive: member.isActive,
        user: member.user
          ? {
              id: member.user.id,
              nickname: member.user.nickname,
              name: member.user.name,
              avatar: member.user.avatar,
            }
          : null,
      })),
      milestones,
    };
  }

  private async syncMembers(
    projectId: string,
    members: any[],
    repository = this.projectMemberRepository,
  ) {
    const existingMembers = await repository.find({ where: { projectId } });
    const today = new Date().toISOString().split("T")[0];
    const incomingIds = new Set(
      members.filter((item) => item.id).map((item) => String(item.id)),
    );

    for (const member of existingMembers) {
      if (!incomingIds.has(String(member.id))) {
        await repository.update(member.id, {
          isActive: "0",
          leaveDate: member.leaveDate || today,
          isDelete: null as any,
        });
      }
    }

    for (const [index, member] of members.entries()) {
      const existingMember = member.id
        ? existingMembers.find((item) => String(item.id) === String(member.id))
        : existingMembers.find(
            (item) =>
              String(item.userId || "") === String(member.userId || "") &&
              String(item.role || "") === String(member.role || ""),
          );
      const payload = {
        projectId,
        userId: member.userId,
        role: member.role,
        isCore: member.isCore || "0",
        remark: member.remark || "",
        sort: Number(member.sort ?? index),
        isActive: "1",
        joinDate: existingMember?.joinDate || today,
        leaveDate: null,
      };

      if (existingMember?.id) {
        await repository.update(existingMember.id, {
          ...payload,
          isDelete: null as any,
        });
      } else {
        await repository.save(new ProjectMember(payload));
      }
    }
  }

  private async syncMilestones(
    projectId: string,
    milestones: any[],
    repository = this.milestoneRepository,
    operatorId?: string,
  ) {
    const existingMilestones = await repository.find({ where: { projectId } });
    const project = await this.repository.findOne({
      where: { id: projectId, isDelete: null as any } as any,
      select: ["id", "leaderId"] as any,
    });
    const fallbackOwnerId = String(project?.leaderId || "") || null;
    const today = new Date().toISOString().split("T")[0];
    const incomingIds = new Set(
      milestones.filter((item) => item.id).map((item) => String(item.id)),
    );

    for (const milestone of existingMilestones) {
      if (!incomingIds.has(String(milestone.id))) {
        await repository.update(milestone.id, { isDelete: "1" as any });
      }
    }

    for (const [index, milestone] of milestones.entries()) {
      const existingMilestone = milestone.id
        ? existingMilestones.find(
            (item) => String(item.id) === String(milestone.id),
          )
        : null;
      const normalizedStatus = milestone.status || MilestoneStatus.pending;
      const completedDate =
        normalizedStatus === MilestoneStatus.completed
          ? existingMilestone?.completedDate || milestone.completedDate || today
          : null;
      const payload = {
        projectId,
        name: milestone.name,
        description: milestone.description || "",
        dueDate: milestone.dueDate || null,
        completedDate,
        status: normalizedStatus,
        deliverables: milestone.deliverables || [],
        ownerId: milestone.ownerId || fallbackOwnerId,
        creatorId: existingMilestone?.creatorId || operatorId || null,
        delayReason: milestone.delayReason || "",
        sort: Number(milestone.sort ?? index),
      };

      if (milestone.id) {
        await repository.update(milestone.id, {
          ...payload,
          isDelete: null as any,
        });
      } else {
        await repository.save(new Milestone(payload));
      }
    }
  }

  /**
   * 归档项目
   */
  async archive(id: string): Promise<any> {
    const project = await this.getOne({ id });
    if (String(project?.status || "") !== ProjectStatus.completed) {
      throw new BadRequestException("项目未结项，不允许归档");
    }
    await this.validateClosePlan(id);
    const handoverCount = await this.handoverRecordRepository.count({
      where: {
        projectId: id,
        status: HandoverRecordStatus.confirmed,
        isDelete: null as any,
      } as any,
    });
    if (!handoverCount) {
      throw new BadRequestException(
        "归档前，请至少维护一条已确认的运维交接记录",
      );
    }
    return this.repository.update(id, { isArchived: "1" });
  }

  async assertProjectNotArchived(projectId: string) {
    if (!projectId) return;
    const project = await this.repository.findOne({
      where: { id: projectId, isDelete: null as any } as any,
      select: ["id", "isArchived", "status"] as any,
    });
    if (!project) return;
    if (String(project.isArchived || "0") === "1") {
      throw new BadRequestException("项目已归档，不允许继续新增或修改执行对象");
    }
  }

  async del(
    ids: string[] | string,
    updateUser?: string,
    permissions: string[] = [],
    operatorName?: string,
    operatorId?: string,
  ) {
    const idList = Array.isArray(ids)
      ? ids.map((item) => String(item))
      : String(ids || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    const canBypassProjectScope = this.canManageAllProjects(permissions);

    const successIds: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    if (!canBypassProjectScope && operatorId) {
      for (const projectId of idList) {
        try {
          await this.assertProjectPermission(projectId, operatorId, "delete");
          successIds.push(projectId);
        } catch (error) {
          failed.push({
            id: projectId,
            reason: error?.message || "当前无删除该项目的权限",
          });
        }
      }
    } else {
      successIds.push(...idList);
    }

    if (!successIds.length) {
      return {
        successCount: 0,
        failedCount: failed.length,
        successIds: [],
        failed,
      } as any;
    }

    await super.del(
      successIds,
      updateUser,
      permissions,
      operatorName,
      operatorId,
    );
    return {
      successCount: successIds.length,
      failedCount: failed.length,
      successIds,
      failed,
    } as any;
  }

  async getProjectPermissionContext(
    projectId: string,
    userId: string,
    permissions: string[] = [],
    userName?: string,
  ) {
    const project = await this.repository.findOne({
      where: { id: projectId, isDelete: null as any } as any,
      relations: ["leader"],
    });
    if (!project) return null;
    const canViewAll = this.canViewAllProjects(permissions);
    const canManageAll = this.canManageAllProjects(permissions);

    const member = await this.projectMemberRepository.findOne({
      where: {
        projectId,
        userId,
        isActive: "1",
        isDelete: null as any,
      } as any,
    });

    const isLeader = String(project.leaderId || "") === String(userId || "");
    const role = member?.role || (isLeader ? ProjectMemberRole.manager : null);
    const isManager =
      canManageAll || isLeader || role === ProjectMemberRole.manager;
    const isDeliveryManager = role === ProjectMemberRole.deliveryManager;
    const isFunctionalLead = [
      ProjectMemberRole.techLead,
      ProjectMemberRole.implementationLead,
      ProjectMemberRole.testLead,
    ].includes(role as any);
    const isVisitor = role === ProjectMemberRole.visitor;
    const isMember = Boolean(member) || isLeader;
    const isCore = String(member?.isCore || "0") === "1";
    const hasApprovalParticipantAccess =
      await this.businessApprovalContextService?.hasRootBusinessParticipantAccess(
        userId,
        "project",
        projectId,
      );
    const hasApprovalAccess = Boolean(hasApprovalParticipantAccess);
    const canViewPrivateProject =
      Boolean(member) ||
      this.canViewCreatorOnlyProject(
        project,
        userId,
        userName,
        hasApprovalAccess,
      );
    const canManageProject =
      canViewPrivateProject && (canManageAll || isManager);
    const canManagePlan =
      canViewPrivateProject && (canManageAll || isManager || isDeliveryManager);
    const canManageDelivery =
      canViewPrivateProject && (canManageAll || isManager || isDeliveryManager);
    const canManageExecution =
      canViewPrivateProject &&
      (canManageAll ||
        isManager ||
        isDeliveryManager ||
        isFunctionalLead ||
        isCore);
    const canManageQuality =
      canViewPrivateProject &&
      (canManageAll || isManager || isDeliveryManager || isFunctionalLead);
    const canReadExecution =
      canViewPrivateProject &&
      !isVisitor &&
      (canViewAll || isMember || isDeliveryManager || hasApprovalAccess);

    return {
      project,
      member,
      role,
      canViewAll,
      canManageAll,
      isManager,
      isDeliveryManager,
      isFunctionalLead,
      isCore,
      isVisitor,
      isMember,
      canView:
        canViewPrivateProject &&
        (canViewAll || isMember || isDeliveryManager || hasApprovalAccess),
      canEdit: canManageProject,
      canSubmitApproval: canManageProject,
      canSubmitClose: canManageProject,
      canArchive: canViewPrivateProject && canManageAll,
      canDelete: canViewPrivateProject && canManageAll,
      canManageMembers: canManageProject,
      canManagePlan,
      canManageExecution,
      canManageTasks: canManageExecution,
      canManageRisks: canManageQuality,
      canManageChanges: canManageQuality,
      canManageDelivery,
      canReadExecution,
    };
  }

  private isCreatorOnlyProject(project: Pick<Project, "status">) {
    return [ProjectStatus.draft, ProjectStatus.approvalPending].includes(
      String(project?.status || "") as ProjectStatus,
    );
  }

  private isProjectCreator(
    project: Pick<Project, "creatorId" | "createUser">,
    userId?: string,
    userName?: string,
  ) {
    return (
      (!!userId && String(project?.creatorId || "") === String(userId)) ||
      (!!userName && String(project?.createUser || "") === String(userName))
    );
  }

  async getVisibleProjectIdsForUser(
    userId: string,
    permissions: string[] = [],
  ): Promise<string[] | null> {
    const canViewAll = this.canViewAllProjects(permissions);
    if (canViewAll) return null;
    if (!userId) return [];

    const workflowProjectIds =
      await this.getApprovalVisibleProjectIdsForUser(userId);
    const visibleScope = this.buildProjectVisibleScopeParams({
      operatorId: userId,
      workflowVisibleProjectIds: workflowProjectIds,
    });
    const projects = await this.repository
      .createQueryBuilder("project")
      .leftJoin(
        ProjectMember,
        "projectMember",
        "projectMember.projectId = project.id AND projectMember.userId = :operatorId AND projectMember.isDelete IS NULL AND projectMember.isActive = '1'",
        { operatorId: userId },
      )
      .where("project.isDelete IS NULL")
      .andWhere(visibleScope.baseCondition, visibleScope.baseParams)
      .andWhere(
        visibleScope.creatorOnlyCondition,
        visibleScope.creatorOnlyParams,
      )
      .select(["project.id"])
      .getMany();

    return Array.from(
      new Set(projects.map((item) => String(item.id || "")).filter(Boolean)),
    );
  }

  private async getApprovalVisibleProjectIdsForUser(userId: string) {
    if (!userId) return [];
    return (
      (await this.businessApprovalContextService?.findVisibleRootBusinessIdsForUser(
        userId,
        "project",
      )) || []
    );
  }

  async assertProjectPermission(
    projectId: string,
    userId: string,
    action:
      | "view"
      | "edit"
      | "submitApproval"
      | "submitClose"
      | "archive"
      | "delete",
    permissions: string[] = [],
    userName?: string,
  ) {
    const context = await this.getProjectPermissionContext(
      projectId,
      userId,
      permissions,
      userName,
    );
    if (!context) {
      throw new ForbiddenException("项目不存在或当前无访问权限");
    }
    const actionMap = {
      view: context.canView,
      edit: context.canEdit,
      submitApproval: context.canSubmitApproval,
      submitClose: context.canSubmitClose,
      archive: context.canArchive,
      delete: context.canDelete,
    };
    if (!actionMap[action]) {
      throw new ForbiddenException("当前无该项目的操作权限");
    }
    return context;
  }

  async assertExecutionObjectPermission(
    projectId: string,
    userId: string,
    permissions: string[] = [],
  ) {
    const context = await this.assertProjectPermission(
      projectId,
      userId,
      "view",
      permissions,
    );
    if (context.isVisitor) {
      throw new ForbiddenException("访客角色不可查看项目内执行对象");
    }
    return context;
  }

  async getProjectViewContext(
    projectId: string,
    options: {
      operatorId?: string;
      operatorName?: string;
      permissions?: string[];
      instanceId?: string;
    } = {},
  ) {
    const permissionContext = await this.assertProjectPermission(
      projectId,
      options.operatorId,
      "view",
      options.permissions || [],
      options.operatorName,
    );
    const project = await this.getOne({ id: projectId });
    const fieldPermissions =
      await this.projectFieldPermissionService.getProjectFieldPermissions({
        project,
        rawRole: permissionContext.role,
        canVisit: true,
      });
    const approvalContexts =
      (await this.businessApprovalContextService?.findProjectApprovalContexts(
        projectId,
      )) || [];
    const currentApprovalContext =
      approvalContexts.find(
        (context) => context.workflowInstanceId === options.instanceId,
      ) ||
      approvalContexts.find((context) => String(context.status) === "1") ||
      approvalContexts[0] ||
      null;

    return {
      project,
      fieldPermissions,
      approvalContexts,
      currentApprovalContext,
      permissionContext,
    };
  }

  /**
   * 获取项目统计
   */
  async getStatistics(id: string): Promise<any> {
    const project = await this.getOne({ id });

    // 统计任务数据
    const totalTasks = await this.taskRepository.count({
      where: { projectId: id },
    });
    const completedTasks = await this.taskRepository.count({
      where: { projectId: id, status: TaskStatus.completed },
    });
    const inProgressTasks = await this.taskRepository.count({
      where: { projectId: id, status: TaskStatus.inProgress },
    });
    const pendingTasks = await this.taskRepository.count({
      where: { projectId: id, status: TaskStatus.pending },
    });

    // 统计工单数据
    const totalTickets = await this.ticketRepository.count({
      where: { projectId: id },
    });
    const resolvedTickets = await this.ticketRepository.count({
      where: { projectId: id, status: TicketStatus.resolved },
    });

    const knowledgeSummary = await this.getKnowledgeSummary(project);

    // 计算进度
    const progress = await this.calculateProjectProgress(id);

    return {
      projectId: project.id,
      projectName: project.name,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        progress: progress,
      },
      tickets: {
        total: totalTickets,
        resolved: resolvedTickets,
        unresolved: totalTickets - resolvedTickets,
      },
      knowledge: knowledgeSummary,
      progress: progress,
    };
  }

  async getDashboard(id: string): Promise<any> {
    const project = await this.getOne({ id });
    const [
      tasks,
      tickets,
      milestones,
      risks,
      changes,
      sprints,
      goLiveRecords,
      acceptanceRecords,
      knowledgeSummary,
      trendSignals,
    ] = await Promise.all([
      this.taskRepository.find({
        where: { projectId: id, isDelete: null as any } as any,
        relations: ["leader"],
        order: { endDate: "ASC", createTime: "DESC" },
      }),
      this.ticketRepository.find({
        where: { projectId: id, isDelete: null as any } as any,
        relations: ["handler"],
        order: { createTime: "DESC" },
      }),
      this.milestoneRepository.find({
        where: { projectId: id, isDelete: null as any } as any,
        order: { dueDate: "ASC", sort: "ASC", createTime: "ASC" },
      }),
      this.riskRepository.find({
        where: { projectId: id, isDelete: null as any } as any,
        relations: ["riskOwner"],
        order: { level: "DESC", dueDate: "ASC", createTime: "DESC" },
      }),
      this.changeRepository.find({
        where: { projectId: id, isDelete: null as any } as any,
        order: { impact: "DESC", createTime: "DESC" },
      }),
      this.sprintRepository.find({
        where: { projectId: id, isDelete: null as any } as any,
        order: { startDate: "DESC", createTime: "DESC" },
      }),
      this.goLiveRecordRepository.find({
        where: { projectId: id, isDelete: null as any } as any,
        order: { createTime: "DESC" },
      }),
      this.acceptanceRecordRepository.find({
        where: { projectId: id, isDelete: null as any } as any,
        order: { createTime: "DESC" },
      }),
      this.getKnowledgeSummary(project),
      this.analyzeProjectTrendSignals(id),
    ]);

    const now = new Date();
    const dueSoonDays = 7;
    const getDayDiff = (dateString?: string) => {
      if (!dateString) return null;
      const targetDate = new Date(dateString);
      if (Number.isNaN(targetDate.getTime())) return null;
      return Math.ceil(
        (targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );
    };
    const isTaskCompleted = (task: Task) =>
      [TaskStatus.completed, TaskStatus.rejected].includes(task.status);
    const isTicketResolved = (ticket: Ticket) =>
      [TicketStatus.resolved, TicketStatus.closed].includes(ticket.status);
    const isRiskClosed = (risk: Risk) =>
      [RiskStatus.resolved, RiskStatus.closed].includes(risk.status);

    const taskSummary = {
      total: tasks.length,
      completed: tasks.filter(isTaskCompleted).length,
      inProgress: tasks.filter((item) => item.status === TaskStatus.inProgress)
        .length,
      pending: tasks.filter((item) => item.status === TaskStatus.pending)
        .length,
      overdue: tasks.filter(
        (item) => !isTaskCompleted(item) && (getDayDiff(item.endDate) ?? 1) < 0,
      ).length,
      dueSoon: tasks.filter((item) => {
        const diff = getDayDiff(item.endDate);
        return (
          !isTaskCompleted(item) &&
          diff !== null &&
          diff >= 0 &&
          diff <= dueSoonDays
        );
      }).length,
      completionRate:
        tasks.length > 0
          ? Math.round(
              (tasks.filter(isTaskCompleted).length / tasks.length) * 100,
            )
          : 0,
    };

    const ticketSummary = {
      total: tickets.length,
      open: tickets.filter((item) => !isTicketResolved(item)).length,
      critical: tickets.filter(
        (item) => item.severity === "1" && !isTicketResolved(item),
      ).length,
    };

    const riskSummary = {
      total: risks.length,
      active: risks.filter((item) => !isRiskClosed(item)).length,
      high: risks.filter(
        (item) =>
          [RiskLevel.high, RiskLevel.critical].includes(item.level) &&
          !isRiskClosed(item),
      ).length,
      overdue: risks.filter(
        (item) => !isRiskClosed(item) && (getDayDiff(item.dueDate) ?? 1) < 0,
      ).length,
    };

    const changeSummary = {
      total: changes.length,
      pendingApproval: changes.filter(
        (item) => item.status === ChangeStatus.pending,
      ).length,
      highImpact: changes.filter((item) => item.impact === ChangeImpact.high)
        .length,
      implemented: changes.filter(
        (item) => item.status === ChangeStatus.implemented,
      ).length,
    };

    const milestoneSummary = {
      total: milestones.length,
      completed: milestones.filter(
        (item) => item.status === MilestoneStatus.completed,
      ).length,
      delayed: milestones.filter(
        (item) => item.status === MilestoneStatus.delayed,
      ).length,
      dueSoon: milestones.filter((item) => {
        const diff = getDayDiff(item.dueDate);
        return (
          item.status !== MilestoneStatus.completed &&
          diff !== null &&
          diff >= 0 &&
          diff <= dueSoonDays
        );
      }).length,
      overdue: milestones.filter(
        (item) =>
          item.status !== MilestoneStatus.completed &&
          (getDayDiff(item.dueDate) ?? 1) < 0,
      ).length,
      completionRate:
        milestones.length > 0
          ? Math.round(
              (milestones.filter(
                (item) => item.status === MilestoneStatus.completed,
              ).length /
                milestones.length) *
                100,
            )
          : 0,
    };

    const projectProgress = taskSummary.completionRate;
    if (project?.id && Number(project.progress || 0) !== projectProgress) {
      project.progress = projectProgress;
      await this.repository.update(project.id, {
        progress: projectProgress,
      } as any);
    }

    const sprintSummary = {
      total: sprints.length,
      active: sprints.filter((item) => item.status === SprintStatus.active)
        .length,
      planning: sprints.filter((item) => item.status === SprintStatus.planning)
        .length,
      current:
        sprints.find((item) => item.status === SprintStatus.active) ||
        sprints.find((item) => item.status === SprintStatus.planning) ||
        null,
    };
    const goLiveSummary = {
      total: goLiveRecords.length,
      successCount: goLiveRecords.filter(
        (item) => item.status === GoLiveRecordStatus.succeeded,
      ).length,
      latestRecord: goLiveRecords[0] || null,
    };
    const acceptanceSummary = {
      total: acceptanceRecords.length,
      passedCount: acceptanceRecords.filter(
        (item) => item.result === AcceptanceRecordResult.passed,
      ).length,
      latestRecord: acceptanceRecords[0] || null,
    };
    const activeChangeImpacts = changes.filter((item) =>
      [ChangeStatus.approved, ChangeStatus.implemented].includes(item.status),
    );
    const changeIds = activeChangeImpacts.map((item) => item.id);
    const confirmHistories = changeIds.length
      ? await this.changeConfirmHistoryRepository.find({
          where: { changeId: In(changeIds), isDelete: null as any } as any,
          order: { createTime: "DESC" },
        })
      : [];
    const getLatestTargetConfirm = (
      changeId: string,
      scope: "milestone" | "sprint" | "task",
      targetId: string,
    ) =>
      confirmHistories.find(
        (item) =>
          String(item.changeId) === String(changeId) &&
          String(item.scope) === scope &&
          String(item.targetId || "") === String(targetId || ""),
      );
    const changeImpactSummary = {
      total: activeChangeImpacts.length,
      pendingConfirm: activeChangeImpacts.filter(
        (item) => String(item.planImpactConfirmed || "0") !== "1",
      ).length,
      scheduleChanged: activeChangeImpacts.filter(
        (item) => Number(item.scheduleImpact || 0) > 0,
      ).length,
      costChanged: activeChangeImpacts.filter(
        (item) => Number(item.costImpact || 0) > 0,
      ).length,
      impactedMilestones: milestones
        .filter((milestone) => {
          if (milestone.status === MilestoneStatus.completed) return false;
          return activeChangeImpacts.some(
            (change) =>
              Number(change.scheduleImpact || 0) > 0 &&
              (getDayDiff(milestone.dueDate) ?? 999) <=
                Number(change.scheduleImpact || 0) + 7,
          );
        })
        .map((milestone) => ({
          id: milestone.id,
          name: milestone.name,
          dueDate: milestone.dueDate,
          confirms: activeChangeImpacts
            .map((change) => ({
              changeId: change.id,
              changeTitle: change.title,
              record: getLatestTargetConfirm(
                change.id,
                "milestone",
                milestone.id,
              ),
            }))
            .filter((item) => item.record),
        })),
      impactedSprints: sprints
        .filter((sprint) => {
          if (
            ![SprintStatus.planning, SprintStatus.active].includes(
              sprint.status,
            )
          )
            return false;
          return activeChangeImpacts.some(
            (change) =>
              Number(change.scheduleImpact || 0) > 0 &&
              (getDayDiff(sprint.endDate) ?? 999) <=
                Number(change.scheduleImpact || 0) + 7,
          );
        })
        .map((sprint) => ({
          id: sprint.id,
          name: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          confirms: activeChangeImpacts
            .map((change) => ({
              changeId: change.id,
              changeTitle: change.title,
              record: getLatestTargetConfirm(change.id, "sprint", sprint.id),
            }))
            .filter((item) => item.record),
        })),
      impactedTasks: tasks
        .filter((task) => {
          if (isTaskCompleted(task)) return false;
          return activeChangeImpacts.some(
            (change) =>
              Number(change.scheduleImpact || 0) > 0 &&
              (getDayDiff(task.endDate) ?? 999) <=
                Number(change.scheduleImpact || 0) + 7,
          );
        })
        .slice(0, 10)
        .map((task) => ({
          id: task.id,
          name: task.name,
          endDate: task.endDate,
          sprintId: task.sprintId,
          milestoneId: task.milestoneId,
          confirms: activeChangeImpacts
            .map((change) => ({
              changeId: change.id,
              changeTitle: change.title,
              record: getLatestTargetConfirm(change.id, "task", task.id),
            }))
            .filter((item) => item.record),
        })),
      actionableChanges: activeChangeImpacts.slice(0, 10).map((item) => ({
        id: item.id,
        title: item.title,
        planImpactConfirmed: item.planImpactConfirmed,
        planImpactConfirmRemark: item.planImpactConfirmRemark,
        scheduleImpact: item.scheduleImpact,
        costImpact: item.costImpact,
        planImpactScopes: {
          milestone: {
            confirmed: String(item.milestoneImpactConfirmed || "0") === "1",
            confirmedAt: item.milestoneImpactConfirmedAt,
            confirmedBy: item.milestoneImpactConfirmedBy,
            remark: item.milestoneImpactConfirmRemark,
          },
          sprint: {
            confirmed: String(item.sprintImpactConfirmed || "0") === "1",
            confirmedAt: item.sprintImpactConfirmedAt,
            confirmedBy: item.sprintImpactConfirmedBy,
            remark: item.sprintImpactConfirmRemark,
          },
          task: {
            confirmed: String(item.taskImpactConfirmed || "0") === "1",
            confirmedAt: item.taskImpactConfirmedAt,
            confirmedBy: item.taskImpactConfirmedBy,
            remark: item.taskImpactConfirmRemark,
          },
        },
      })),
    };

    const totalTasks = Math.max(tasks.length, 1);
    const totalMilestones = Math.max(milestones.length, 1);
    const activeRisks = Math.max(riskSummary.active, 1);
    const totalChanges = Math.max(changeSummary.total, 1);
    const plannedTasks = tasks.filter((item) =>
      String(item.sprintId || "").trim(),
    ).length;
    const overduePlannedTasks = tasks.filter(
      (item) =>
        String(item.sprintId || "").trim() &&
        !isTaskCompleted(item) &&
        (getDayDiff(item.endDate) ?? 1) < 0,
    ).length;
    const unplannedTasks = tasks.length - plannedTasks;
    const delayedMilestones = milestones.filter(
      (item) =>
        item.status === MilestoneStatus.delayed ||
        (item.status !== MilestoneStatus.completed &&
          (getDayDiff(item.dueDate) ?? 1) < 0),
    ).length;
    const delayedSprints = sprints.filter(
      (item) =>
        item.status === SprintStatus.active &&
        (getDayDiff(item.endDate) ?? 1) < 0,
    ).length;

    const progressPenalty = Math.min(
      12,
      Math.round((taskSummary.overdue / totalTasks) * 12),
    );
    const milestonePenalty = Math.min(
      8,
      Math.round((delayedMilestones / totalMilestones) * 8),
    );
    const progressScore = Math.max(0, 25 - progressPenalty - milestonePenalty);

    const highRiskPenalty = Math.min(
      12,
      Math.round((riskSummary.high / activeRisks) * 12),
    );
    const overdueRiskPenalty = Math.min(
      8,
      Math.round((riskSummary.overdue / activeRisks) * 8),
    );
    const riskScore = Math.max(0, 20 - highRiskPenalty - overdueRiskPenalty);

    const pendingChangePenalty = Math.min(
      8,
      Math.round((changeSummary.pendingApproval / totalChanges) * 8),
    );
    const highImpactPenalty = Math.min(
      7,
      Math.round((changeSummary.highImpact / totalChanges) * 7),
    );
    const changeScore = Math.max(
      0,
      15 - pendingChangePenalty - highImpactPenalty,
    );

    const plannedTaskBase = plannedTasks > 0 ? plannedTasks : 1;
    const unplannedPenalty = Math.min(
      8,
      Math.round((unplannedTasks / totalTasks) * 8),
    );
    const overduePlannedPenalty = Math.min(
      7,
      Math.round((overduePlannedTasks / plannedTaskBase) * 7),
    );
    const executionScore = Math.max(
      0,
      15 - unplannedPenalty - overduePlannedPenalty,
    );

    const deliveryScore = Math.round(
      (taskSummary.completionRate / 100) * 8 +
        (milestoneSummary.completionRate / 100) * 7,
    );

    let knowledgeScore = 0;
    if (knowledgeSummary.total > 0) knowledgeScore += 4;
    if (knowledgeSummary.recentUpdatedCount > 0) knowledgeScore += 3;
    if (
      knowledgeSummary.faq > 0 ||
      knowledgeSummary.experience > 0 ||
      knowledgeSummary.delivery > 0
    ) {
      knowledgeScore += 3;
    }

    const healthTotalScore = Math.max(
      0,
      Math.min(
        100,
        progressScore +
          riskScore +
          changeScore +
          executionScore +
          deliveryScore +
          knowledgeScore,
      ),
    );
    const healthLevel =
      healthTotalScore >= 85
        ? "healthy"
        : healthTotalScore >= 70
          ? "stable"
          : healthTotalScore >= 50
            ? "attention"
            : "critical";
    const healthSummary = {
      totalScore: healthTotalScore,
      level: healthLevel,
      levelLabel:
        healthLevel === "healthy"
          ? "健康"
          : healthLevel === "stable"
            ? "基本健康"
            : healthLevel === "attention"
              ? "需关注"
              : "高风险",
      dimensions: {
        progress: { score: progressScore, weight: 25 },
        risk: { score: riskScore, weight: 20 },
        change: { score: changeScore, weight: 15 },
        execution: { score: executionScore, weight: 15 },
        delivery: { score: deliveryScore, weight: 15 },
        knowledge: { score: knowledgeScore, weight: 10 },
      },
      indicators: {
        overdueTasks: taskSummary.overdue,
        delayedMilestones,
        highRisks: riskSummary.high,
        overdueRisks: riskSummary.overdue,
        pendingChanges: changeSummary.pendingApproval,
        highImpactChanges: changeSummary.highImpact,
        unplannedTasks,
        overduePlannedTasks,
        delayedSprints,
        recentKnowledgeUpdates: knowledgeSummary.recentUpdatedCount,
      },
      alerts: [
        taskSummary.overdue > 0
          ? `当前有 ${taskSummary.overdue} 个任务已逾期`
          : null,
        delayedMilestones > 0
          ? `当前有 ${delayedMilestones} 个里程碑延期或超期`
          : null,
        riskSummary.high > 0
          ? `当前有 ${riskSummary.high} 个高风险事项未关闭`
          : null,
        changeSummary.pendingApproval > 0
          ? `当前有 ${changeSummary.pendingApproval} 个变更待审批`
          : null,
        unplannedTasks > 0
          ? `当前有 ${unplannedTasks} 个任务未纳入 Sprint 计划`
          : null,
      ].filter(Boolean),
    };

    const alertItems = [
      taskSummary.overdue > 0
        ? {
            type: "danger",
            title: "任务已逾期",
            value: taskSummary.overdue,
            desc: `当前有 ${taskSummary.overdue} 个任务已逾期，建议优先处理关键任务和高优先级工作项。`,
            tab: "tasks",
            filter: "overdue",
          }
        : null,
      taskSummary.dueSoon > 0
        ? {
            type: "warning",
            title: "临近到期任务",
            value: taskSummary.dueSoon,
            desc: `当前有 ${taskSummary.dueSoon} 个任务将在 ${dueSoonDays} 天内到期，建议提前确认资源和责任人。`,
            tab: "tasks",
            filter: "dueSoon",
          }
        : null,
      delayedMilestones > 0
        ? {
            type: "danger",
            title: "里程碑延期/超期",
            value: delayedMilestones,
            desc: `当前有 ${delayedMilestones} 个里程碑延期或超期，说明计划与执行已经产生偏差。`,
            tab: "plan",
            filter: "delayed",
          }
        : null,
      delayedSprints > 0
        ? {
            type: "warning",
            title: "Sprint 节奏偏慢",
            value: delayedSprints,
            desc: `当前有 ${delayedSprints} 个进行中的 Sprint 已超出计划结束时间，建议及时调整范围或节奏。`,
            tab: "plan",
            filter: "active",
          }
        : null,
      riskSummary.high > 0
        ? {
            type: "danger",
            title: "高风险事项未关闭",
            value: riskSummary.high,
            desc: `当前有 ${riskSummary.high} 个高风险事项未关闭，建议优先安排负责人和应对动作。`,
            tab: "risks",
            filter: "high",
          }
        : null,
      changeSummary.pendingApproval > 0
        ? {
            type: "warning",
            title: "变更待审批",
            value: changeSummary.pendingApproval,
            desc: `当前有 ${changeSummary.pendingApproval} 个变更待审批，可能影响计划、范围或成本安排。`,
            tab: "changes",
            filter: "pending",
          }
        : null,
      unplannedTasks > 0
        ? {
            type: "info",
            title: "任务未纳入执行计划",
            value: unplannedTasks,
            desc: `当前有 ${unplannedTasks} 个任务未归入 Sprint 编排，建议尽快纳入执行计划。`,
            tab: "plan",
            filter: "unplanned",
          }
        : null,
      !project.closeSummary ||
      !project.closeDeliverables ||
      !project.closeReview
        ? {
            type: "info",
            title: "结项资料待完善",
            value: [
              !project.closeSummary,
              !project.closeDeliverables,
              !project.closeReview,
            ].filter(Boolean).length,
            desc: "验收说明、交付清单或项目复盘尚未补齐，后续提交结项审批前需要先完善。",
            tab: "closure",
            filter: "incomplete",
          }
        : null,
      trendSignals.healthDeclining
        ? {
            type: "warning",
            title: "健康度连续下滑",
            value: 3,
            desc: "最近 3 个快照周期项目健康度连续下降，建议优先核对风险、逾期任务和变更积压情况。",
            tab: "overview",
            filter: "healthTrend",
          }
        : null,
      trendSignals.riskRising
        ? {
            type: "danger",
            title: "高风险数量持续上升",
            value: 3,
            desc: "最近 3 个快照周期高风险数量持续上升，建议尽快安排专项跟进和责任人闭环。",
            tab: "risks",
            filter: "riskTrend",
          }
        : null,
      trendSignals.costVarianceWorsening
        ? {
            type: "warning",
            title: "成本偏差持续恶化",
            value: 3,
            desc: "最近 3 个快照周期成本偏差持续扩大，建议尽快核对预算、变更和交付范围。",
            tab: "overview",
            filter: "costTrend",
          }
        : null,
    ].filter(Boolean);

    return {
      project,
      tasks,
      tickets,
      milestones,
      risks,
      changes,
      sprints,
      goLiveRecords,
      acceptanceRecords,
      summary: {
        taskSummary,
        ticketSummary,
        riskSummary,
        changeSummary,
        milestoneSummary,
        sprintSummary,
        goLiveSummary,
        acceptanceSummary,
        knowledgeSummary,
        changeImpactSummary,
        healthSummary,
        budget: Number(project?.budget || 0),
        actualCost: Number(project?.actualCost || 0),
        costVariance:
          Number(project?.actualCost || 0) - Number(project?.budget || 0),
      },
      focus: {
        dueSoonTasks: tasks
          .filter((item) => {
            const diff = getDayDiff(item.endDate);
            return (
              !isTaskCompleted(item) &&
              diff !== null &&
              diff >= 0 &&
              diff <= dueSoonDays
            );
          })
          .slice(0, 5),
        overdueTasks: tasks
          .filter(
            (item) =>
              !isTaskCompleted(item) && (getDayDiff(item.endDate) ?? 1) < 0,
          )
          .slice(0, 5),
        criticalTickets: tickets
          .filter((item) => item.severity === "1" && !isTicketResolved(item))
          .slice(0, 5),
        highRisks: risks
          .filter(
            (item) =>
              [RiskLevel.high, RiskLevel.critical].includes(item.level) &&
              !isRiskClosed(item),
          )
          .slice(0, 5),
        pendingChanges: changes
          .filter((item) => item.status === ChangeStatus.pending)
          .slice(0, 5),
        dueSoonMilestones: milestones
          .filter((item) => {
            const diff = getDayDiff(item.dueDate);
            return (
              item.status !== MilestoneStatus.completed &&
              diff !== null &&
              diff >= 0 &&
              diff <= dueSoonDays
            );
          })
          .slice(0, 5),
        latestKnowledgeArticles: knowledgeSummary.latestArticles || [],
        alerts: alertItems,
      },
    };
  }

  async syncProjectAlertsToMessages(projectId: string, userId: string) {
    const dashboard = await this.getDashboard(projectId);
    const strategy =
      await this.systemConfigsService.getProjectReminderStrategy();
    const project = dashboard?.project;
    const members = Array.isArray(project?.members) ? project.members : [];
    const receiverIds = new Set<string>();

    if (strategy?.roles?.projectManager !== false) {
      members
        .filter(
          (item) => item.role === ProjectMemberRole.manager && item.userId,
        )
        .forEach((item) => receiverIds.add(String(item.userId)));
      if (project?.leaderId) receiverIds.add(String(project.leaderId));
    }

    if (strategy?.roles?.deliveryManager) {
      members
        .filter(
          (item) =>
            item.role === ProjectMemberRole.deliveryManager && item.userId,
        )
        .forEach((item) => receiverIds.add(String(item.userId)));
    }

    if (strategy?.roles?.coreMember) {
      members
        .filter((item) => String(item.isCore || "0") === "1" && item.userId)
        .forEach((item) => receiverIds.add(String(item.userId)));
    }

    if (!receiverIds.size && userId) {
      receiverIds.add(String(userId));
    }

    for (const receiverId of receiverIds) {
      const receiver = await this.usersService.getOne({ id: receiverId });
      const preference = receiver?.projectReminderPreference || {};
      if (preference?.enabled === false) {
        continue;
      }
      const mergedAlerts = (dashboard?.focus?.alerts || []).filter((alert) => {
        const key = `${alert.tab || ""}::${alert.filter || ""}`;
        const ruleMap = {
          "tasks::overdue": preference?.rules?.taskOverdue,
          "tasks::dueSoon": preference?.rules?.taskDueSoon,
          "plan::delayed": preference?.rules?.milestoneDelayed,
          "plan::active": preference?.rules?.sprintDelayed,
          "risks::high": preference?.rules?.highRisk,
          "changes::pending": preference?.rules?.changePending,
          "plan::unplanned": preference?.rules?.unplannedTask,
          "closure::incomplete": preference?.rules?.closureIncomplete,
        };
        return ruleMap[key] !== false;
      });
      await this.messagesService.syncProjectAlerts(
        receiverId,
        projectId,
        project?.name || "项目",
        mergedAlerts,
      );
    }
    return true;
  }

  async getCockpitOverview(query: QueryListDto): Promise<any> {
    const projectListRes = await this.list(query);
    const rawProjects = projectListRes?.list || [];
    const cockpitSampleProjects = rawProjects.slice(0, 20);
    const cockpitSampleMetrics = await Promise.all(
      cockpitSampleProjects.map(async (item) => {
        const dashboard = await this.getDashboard(item.id);
        return {
          ...item,
          healthSummary: dashboard?.summary?.healthSummary,
          knowledgeSummary: dashboard?.summary?.knowledgeSummary,
          focusAlerts: dashboard?.focus?.alerts || [],
        };
      }),
    );
    const healthLevel = String((query as any).healthLevel || "");
    const category = String((query as any).category || "").trim();
    const riskLevel = String((query as any).riskLevel || "").trim();
    const qualityLevel = String((query as any).qualityLevel || "").trim();
    const projects = rawProjects.filter((item) => {
      if (category && !String(item.category || "").includes(category))
        return false;
      if (riskLevel && String(item.riskLevel || "") !== riskLevel) return false;
      if (qualityLevel && String(item.qualityLevel || "") !== qualityLevel)
        return false;
      if (!healthLevel) return true;
      const metric = cockpitSampleMetrics.find(
        (sample) => String(sample.id) === String(item.id),
      );
      return String(metric?.healthSummary?.level || "") === healthLevel;
    });
    const filteredSampleMetrics = cockpitSampleMetrics.filter((item) =>
      projects.some((project) => String(project.id) === String(item.id)),
    );

    const totalProjects = projects.length;
    const activeProjects = projects.filter((item) =>
      ["2", "3", "4"].includes(String(item.status || "")),
    ).length;
    const completedProjects = projects.filter(
      (item) => String(item.status || "") === "6",
    ).length;
    const overdueProjects = projects.filter(
      (item) =>
        item.endDate &&
        new Date(item.endDate).getTime() < Date.now() &&
        String(item.status || "") !== "6",
    ).length;
    const budgetTotal = projects.reduce(
      (sum, item) => sum + Number(item.budget || 0),
      0,
    );
    const actualCostTotal = projects.reduce(
      (sum, item) => sum + Number(item.actualCost || 0),
      0,
    );
    const spentHoursTotal = projects.reduce(
      (sum, item) => sum + Number(item.spentHours || 0),
      0,
    );
    const averageProgress = totalProjects
      ? Math.round(
          projects.reduce((sum, item) => sum + Number(item.progress || 0), 0) /
            totalProjects,
        )
      : 0;
    const averageHealthScore = filteredSampleMetrics.length
      ? Math.round(
          filteredSampleMetrics.reduce(
            (sum, item) => sum + Number(item.healthSummary?.totalScore || 0),
            0,
          ) / filteredSampleMetrics.length,
        )
      : 0;
    const attentionProjects = filteredSampleMetrics.filter(
      (item) => Number(item.healthSummary?.totalScore || 0) < 70,
    ).length;
    const knowledgeActiveProjects = filteredSampleMetrics.filter(
      (item) => Number(item.knowledgeSummary?.recentUpdatedCount || 0) > 0,
    ).length;
    const riskLevelDistribution = [
      {
        name: "低风险",
        value: projects.filter((item) => String(item.riskLevel || "") === "low")
          .length,
      },
      {
        name: "中风险",
        value: projects.filter(
          (item) => String(item.riskLevel || "") === "medium",
        ).length,
      },
      {
        name: "高风险",
        value: projects.filter(
          (item) => String(item.riskLevel || "") === "high",
        ).length,
      },
      {
        name: "严重风险",
        value: projects.filter(
          (item) => String(item.riskLevel || "") === "critical",
        ).length,
      },
    ].filter((item) => item.value > 0);
    const qualityLevelDistribution = [
      {
        name: "低质量",
        value: projects.filter(
          (item) => String(item.qualityLevel || "") === "low",
        ).length,
      },
      {
        name: "中质量",
        value: projects.filter(
          (item) => String(item.qualityLevel || "") === "medium",
        ).length,
      },
      {
        name: "高质量",
        value: projects.filter(
          (item) => String(item.qualityLevel || "") === "high",
        ).length,
      },
      {
        name: "优秀",
        value: projects.filter(
          (item) => String(item.qualityLevel || "") === "excellent",
        ).length,
      },
    ].filter((item) => item.value > 0);
    const now = Date.now();
    const overdueRanking = [...projects]
      .filter(
        (item) =>
          item.endDate &&
          new Date(item.endDate).getTime() < now &&
          String(item.status || "") !== "6",
      )
      .sort(
        (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
      )
      .slice(0, 5);
    const laggingRanking = [...projects]
      .filter((item) => String(item.status || "") !== "6")
      .sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0))
      .slice(0, 5);
    const costRiskRanking = [...projects]
      .filter((item) => Number(item.actualCost || 0) > Number(item.budget || 0))
      .sort(
        (a, b) =>
          Number(b.actualCost || 0) -
          Number(b.budget || 0) -
          (Number(a.actualCost || 0) - Number(a.budget || 0)),
      )
      .slice(0, 5);
    const healthRiskRanking = [...filteredSampleMetrics]
      .sort(
        (a, b) =>
          Number(a.healthSummary?.totalScore || 0) -
          Number(b.healthSummary?.totalScore || 0),
      )
      .slice(0, 5)
      .map((item) => ({
        ...item,
        healthScore: item.healthSummary?.totalScore || 0,
        healthLevel: item.healthSummary?.levelLabel || "基本健康",
      }));
    const knowledgeActiveRanking = [...filteredSampleMetrics]
      .sort(
        (a, b) =>
          Number(b.knowledgeSummary?.recentUpdatedCount || 0) -
          Number(a.knowledgeSummary?.recentUpdatedCount || 0),
      )
      .slice(0, 5)
      .map((item) => ({
        ...item,
        recentKnowledgeUpdates: item.knowledgeSummary?.recentUpdatedCount || 0,
        totalKnowledge: item.knowledgeSummary?.total || 0,
      }));
    const healthDistribution = [
      {
        name: "健康",
        value: filteredSampleMetrics.filter(
          (item) => item.healthSummary?.level === "healthy",
        ).length,
      },
      {
        name: "基本健康",
        value: filteredSampleMetrics.filter(
          (item) => item.healthSummary?.level === "stable",
        ).length,
      },
      {
        name: "需关注",
        value: filteredSampleMetrics.filter(
          (item) => item.healthSummary?.level === "attention",
        ).length,
      },
      {
        name: "高风险",
        value: filteredSampleMetrics.filter(
          (item) => item.healthSummary?.level === "critical",
        ).length,
      },
    ].filter((item) => item.value > 0);
    const progressDistribution = [
      {
        name: "0-30%",
        value: filteredSampleMetrics.filter(
          (item) => Number(item.progress || 0) <= 30,
        ).length,
      },
      {
        name: "31-60%",
        value: filteredSampleMetrics.filter((item) => {
          const progress = Number(item.progress || 0);
          return progress > 30 && progress <= 60;
        }).length,
      },
      {
        name: "61-90%",
        value: filteredSampleMetrics.filter((item) => {
          const progress = Number(item.progress || 0);
          return progress > 60 && progress <= 90;
        }).length,
      },
      {
        name: "91-100%",
        value: filteredSampleMetrics.filter(
          (item) => Number(item.progress || 0) > 90,
        ).length,
      },
    ].filter((item) => item.value > 0);
    const knowledgeDistribution = [
      {
        name: "无更新",
        value: filteredSampleMetrics.filter(
          (item) =>
            Number(item.knowledgeSummary?.recentUpdatedCount || 0) === 0,
        ).length,
      },
      {
        name: "1-2 次",
        value: filteredSampleMetrics.filter((item) => {
          const count = Number(item.knowledgeSummary?.recentUpdatedCount || 0);
          return count > 0 && count <= 2;
        }).length,
      },
      {
        name: "3 次及以上",
        value: filteredSampleMetrics.filter(
          (item) => Number(item.knowledgeSummary?.recentUpdatedCount || 0) >= 3,
        ).length,
      },
    ].filter((item) => item.value > 0);
    const alertDistribution = [
      {
        name: "进度类",
        value: filteredSampleMetrics.reduce(
          (sum, item) =>
            sum +
            item.focusAlerts.filter((alert) =>
              ["tasks", "plan"].includes(String(alert.tab || "")),
            ).length,
          0,
        ),
      },
      {
        name: "风险类",
        value: filteredSampleMetrics.reduce(
          (sum, item) =>
            sum +
            item.focusAlerts.filter((alert) => alert.tab === "risks").length,
          0,
        ),
      },
      {
        name: "变更类",
        value: filteredSampleMetrics.reduce(
          (sum, item) =>
            sum +
            item.focusAlerts.filter((alert) => alert.tab === "changes").length,
          0,
        ),
      },
      {
        name: "结项类",
        value: filteredSampleMetrics.reduce(
          (sum, item) =>
            sum +
            item.focusAlerts.filter((alert) => alert.tab === "closure").length,
          0,
        ),
      },
    ].filter((item) => item.value > 0);

    return {
      projectOptions: projects.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        priority: item.priority,
        progress: item.progress,
        category: item.category,
        riskLevel: item.riskLevel,
        qualityLevel: item.qualityLevel,
        currency: item.currency,
        spentHours: item.spentHours,
        leader: item.leader,
      })),
      filters: {
        healthLevel,
        category,
        riskLevel,
        qualityLevel,
      },
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        overdueProjects,
        budgetTotal,
        actualCostTotal,
        spentHoursTotal,
        costVariance: actualCostTotal - budgetTotal,
        averageProgress,
        averageHealthScore,
        attentionProjects,
        knowledgeActiveProjects,
        distributions: {
          health: healthDistribution,
          progress: progressDistribution,
          knowledge: knowledgeDistribution,
          alert: alertDistribution,
          riskLevel: riskLevelDistribution,
          qualityLevel: qualityLevelDistribution,
        },
      },
      rankings: {
        overdueProjects: overdueRanking,
        laggingProjects: laggingRanking,
        costRiskProjects: costRiskRanking,
        healthRiskProjects: healthRiskRanking,
        knowledgeActiveProjects: knowledgeActiveRanking,
      },
    };
  }

  async getProjectCockpit(projectId: string): Promise<any> {
    const dashboard = await this.getDashboard(projectId);
    const trend = await this.getProjectTrend(projectId, dashboard);
    return {
      ...dashboard,
      trend,
    };
  }

  async getCockpit(query: QueryListDto): Promise<any> {
    const overview = await this.getCockpitOverview(query);
    const selectedProjectId = String(
      query.projectId || overview.projectOptions?.[0]?.id || "",
    );
    const selectedProject = selectedProjectId
      ? await this.getDashboard(selectedProjectId)
      : null;
    const selectedTrend = selectedProjectId
      ? await this.getProjectTrend(selectedProjectId, selectedProject)
      : null;

    return {
      ...overview,
      selectedProjectId,
      selectedProject,
      selectedTrend,
    };
  }

  private async upsertProjectCockpitSnapshot(
    projectId: string,
    dashboard?: any,
  ) {
    const latestDashboard = dashboard || (await this.getDashboard(projectId));
    const today = new Date().toISOString().split("T")[0];
    const currentHealthScore = Number(
      latestDashboard?.summary?.healthSummary?.totalScore || 0,
    );
    const currentRiskCount = Number(
      latestDashboard?.summary?.riskSummary?.high || 0,
    );
    const currentKnowledgeUpdates = Number(
      latestDashboard?.summary?.knowledgeSummary?.recentUpdatedCount || 0,
    );
    const currentCostVariance = Number(
      latestDashboard?.summary?.costVariance || 0,
    );

    const existingToday = await this.snapshotRepository.findOne({
      where: { projectId, snapshotDate: today, isDelete: null as any } as any,
      order: { createTime: "DESC" },
    });

    if (existingToday) {
      await this.snapshotRepository.update(existingToday.id, {
        healthScore: currentHealthScore,
        riskCount: currentRiskCount,
        knowledgeUpdateCount: currentKnowledgeUpdates,
        costVariance: currentCostVariance,
      } as any);
    } else {
      await this.snapshotRepository.save(
        new ProjectCockpitSnapshot({
          projectId,
          snapshotDate: today,
          healthScore: currentHealthScore,
          riskCount: currentRiskCount,
          knowledgeUpdateCount: currentKnowledgeUpdates,
          costVariance: currentCostVariance,
          createUser: "system",
          updateUser: "system",
        }),
      );
    }
    return latestDashboard;
  }

  private async getProjectTrend(projectId: string, dashboard?: any) {
    await this.upsertProjectCockpitSnapshot(projectId, dashboard);

    const snapshots = await this.snapshotRepository.find({
      where: { projectId, isDelete: null as any } as any,
      order: { snapshotDate: "ASC", createTime: "ASC" },
      take: 30,
    });
    const recentSnapshots = snapshots.slice(-7);
    return {
      dates: recentSnapshots.map((item) => item.snapshotDate),
      healthScores: recentSnapshots.map((item) =>
        Number(item.healthScore || 0),
      ),
      riskCounts: recentSnapshots.map((item) => Number(item.riskCount || 0)),
      knowledgeUpdateCounts: recentSnapshots.map((item) =>
        Number(item.knowledgeUpdateCount || 0),
      ),
      costVariances: recentSnapshots.map((item) =>
        Number(item.costVariance || 0),
      ),
    };
  }

  private async analyzeProjectTrendSignals(projectId: string) {
    const strategy =
      await this.systemConfigsService.getProjectReminderStrategy();
    const trendThresholds = strategy?.trendThresholds || {};
    if (trendThresholds.enabled === false) {
      return {
        healthDeclining: false,
        riskRising: false,
        costVarianceWorsening: false,
      };
    }

    const windowSize = Math.max(3, Number(trendThresholds.windowSize || 3));
    const healthDeclineStep = Math.max(
      1,
      Number(trendThresholds.healthDeclineStep || 5),
    );
    const riskIncreaseStep = Math.max(
      1,
      Number(trendThresholds.riskIncreaseStep || 1),
    );
    const costVarianceIncreaseStep = Math.max(
      0,
      Number(trendThresholds.costVarianceIncreaseStep || 1000),
    );

    const snapshots = await this.snapshotRepository.find({
      where: { projectId, isDelete: null as any } as any,
      order: { snapshotDate: "ASC", createTime: "ASC" },
      take: Math.max(7, windowSize),
    });
    const recentSnapshots = snapshots.slice(-windowSize);
    if (recentSnapshots.length < windowSize) {
      return {
        healthDeclining: false,
        riskRising: false,
        costVarianceWorsening: false,
      };
    }

    const isStrictTrend = (
      values: number[],
      direction: "up" | "down",
      step = 0,
    ) => {
      for (let i = 1; i < values.length; i++) {
        const diff = values[i] - values[i - 1];
        if (direction === "down" && !(diff <= -step)) return false;
        if (direction === "up" && !(diff >= step)) return false;
      }
      return true;
    };

    const healthScores = recentSnapshots.map((item) =>
      Number(item.healthScore || 0),
    );
    const riskCounts = recentSnapshots.map((item) =>
      Number(item.riskCount || 0),
    );
    const costVariances = recentSnapshots.map((item) =>
      Number(item.costVariance || 0),
    );

    return {
      healthDeclining: isStrictTrend(healthScores, "down", healthDeclineStep),
      riskRising: isStrictTrend(riskCounts, "up", riskIncreaseStep),
      costVarianceWorsening: isStrictTrend(
        costVariances,
        "up",
        costVarianceIncreaseStep,
      ),
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateDailyCockpitSnapshots() {
    if (
      !(await this.systemScheduledJobsService.isJobEnabled(
        "projects.dailyCockpitSnapshots",
      ))
    ) {
      return;
    }
    await this.systemScheduledJobsService.runJob(
      "projects.dailyCockpitSnapshots",
      "scheduled",
      async () => {
        const result = await this.generateCockpitSnapshots();
        return {
          summary: `生成 ${Number(result?.total || 0)} 个项目快照`,
          processedCount: Number(result?.total || 0),
          successCount: Number(result?.total || 0),
          failedCount: 0,
        };
      },
    );
  }

  async generateCockpitSnapshots(projectIds?: string[]) {
    const where = projectIds?.length
      ? ({ id: In(projectIds), isDelete: null as any } as any)
      : ({ isDelete: null as any } as any);
    const projects = await this.repository.find({
      where,
      select: ["id"],
    });
    for (const project of projects) {
      const dashboard = await this.getDashboard(project.id);
      await this.upsertProjectCockpitSnapshot(project.id, dashboard);
    }
    return {
      total: projects.length,
    };
  }
}
