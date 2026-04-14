import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project, ProjectStatus } from 'src/modulesBusi/projects/entity'
import { Task } from 'src/modulesBusi/tasks/entity'
import { Ticket } from 'src/modulesBusi/tickets/entity'
import { ProjectChange, ChangeStatus } from 'src/modulesBusi/changes/entity'
import { Customer } from 'src/modulesBusi/crm/customers/entity'
import { WorkflowService } from 'src/modulesBusi/workflow/service'

@Injectable()
export class WorkflowIntegrationService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(ProjectChange)
    private readonly changeRepository: Repository<ProjectChange>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly workflowService: WorkflowService,
  ) {}

  async startProjectApproval(projectId: string, initiatorId: string): Promise<string> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } })
    if (!project) {
      throw new BadRequestException('项目不存在')
    }

    if (project.status !== ProjectStatus.draft) {
      throw new BadRequestException('只有草稿状态的项目才能提交立项审批')
    }

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: 'project',
        businessScene: 'initiation',
        businessKey: `project_${projectId}`,
        variables: {
          starterId: initiatorId,
          businessType: 'project',
          workflowScene: 'projectApproval',
        },
      },
      initiatorId,
    )

    project.workflowInstanceId = instance.id
    project.status = ProjectStatus.approvalPending
    project.approvalStatus = '1'
    project.currentNodeName = '立项审批中'
    await this.projectRepository.save(project)

    return instance.id
  }

  async startProjectCloseApproval(projectId: string, initiatorId: string): Promise<string> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } })
    if (!project) {
      throw new BadRequestException('项目不存在')
    }

    if (project.status !== ProjectStatus.executing) {
      throw new BadRequestException('只有执行中的项目才能提交结项审批')
    }

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: 'project',
        businessScene: 'closure',
        businessKey: `project_close_${projectId}`,
        variables: {
          starterId: initiatorId,
          businessType: 'project',
          workflowScene: 'projectCloseApproval',
          projectId,
        },
      },
      initiatorId,
    )

    project.workflowInstanceId = instance.id
    project.status = ProjectStatus.closeApprovalPending
    project.approvalStatus = '1'
    project.currentNodeName = '结项审批中'
    await this.projectRepository.save(project)

    return instance.id
  }

  async handleWorkflowCallback(instanceId: string, status: string, variables: any): Promise<void> {
    const businessKey = variables.businessKey

    if (businessKey?.startsWith('project_') && !businessKey.includes('close')) {
      const projectId = businessKey.replace('project_', '')
      if (status === 'completed') {
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.executing as any,
          approvalStatus: '2',
          currentNodeName: '立项审批已通过',
        })
      } else {
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.draft as any,
          approvalStatus: '3',
          currentNodeName: '立项审批已拒绝',
        })
      }
    } else if (businessKey?.startsWith('project_close_')) {
      const projectId = businessKey.replace('project_close_', '')
      if (status === 'completed') {
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.completed as any,
          approvalStatus: '2',
          currentNodeName: '结项审批已通过',
        })
      } else {
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.executing as any,
          approvalStatus: '3',
          currentNodeName: '结项审批已拒绝',
        })
      }
    } else if (businessKey?.startsWith('task_')) {
      const taskId = businessKey.replace('task_', '')
      await this.taskRepository.update(taskId, {
        approvalStatus: status === 'completed' ? '2' : '3',
        currentNodeName: status === 'completed' ? '任务审批已通过' : '任务审批已拒绝',
      } as any)
    } else if (businessKey?.startsWith('ticket_')) {
      const ticketId = businessKey.replace('ticket_', '')
      await this.ticketRepository.update(ticketId, {
        approvalStatus: status === 'completed' ? '2' : '3',
        currentNodeName: status === 'completed' ? '工单审批已通过' : '工单审批已拒绝',
      } as any)
    } else if (businessKey?.startsWith('change_')) {
      const changeId = businessKey.replace('change_', '')
      await this.changeRepository.update(changeId, {
        status: status === 'completed' ? ChangeStatus.approved : ChangeStatus.rejected,
        approvalStatus: status === 'completed' ? '2' : '3',
        currentNodeName: status === 'completed' ? '变更审批已通过' : '变更审批已拒绝',
      } as any)
    } else if (businessKey?.startsWith('customer_')) {
      const customerId = businessKey.replace('customer_', '')
      await this.customerRepository.update(customerId, {
        approvalStatus: status === 'completed' ? '2' : '3',
        currentNodeName: status === 'completed' ? '客户审批已通过' : '客户审批已拒绝',
      } as any)
    }
  }

  async startTaskApproval(taskId: string, initiatorId: string): Promise<string> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } })
    if (!task) throw new BadRequestException('任务不存在')

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: 'task',
        businessScene: 'approval',
        businessKey: `task_${taskId}`,
        variables: { starterId: initiatorId, businessType: 'task' },
      },
      initiatorId,
    )

    await this.taskRepository.update(taskId, {
      workflowInstanceId: instance.id,
      approvalStatus: '1',
      currentNodeName: '任务审批中',
    } as any)
    return instance.id
  }

  async startTicketApproval(ticketId: string, initiatorId: string): Promise<string> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } })
    if (!ticket) throw new BadRequestException('工单不存在')

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: 'ticket',
        businessScene: 'approval',
        businessKey: `ticket_${ticketId}`,
        variables: { starterId: initiatorId, businessType: 'ticket' },
      },
      initiatorId,
    )

    await this.ticketRepository.update(ticketId, {
      workflowInstanceId: instance.id,
      approvalStatus: '1',
      currentNodeName: '工单审批中',
    } as any)
    return instance.id
  }

  async startChangeApproval(changeId: string, initiatorId: string): Promise<string> {
    const change = await this.changeRepository.findOne({ where: { id: changeId } })
    if (!change) throw new BadRequestException('变更不存在')

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: 'change',
        businessScene: 'approval',
        businessKey: `change_${changeId}`,
        variables: { starterId: initiatorId, businessType: 'change' },
      },
      initiatorId,
    )

    await this.changeRepository.update(changeId, {
      status: ChangeStatus.pending,
      workflowInstanceId: instance.id,
      approvalStatus: '1',
      currentNodeName: '变更审批中',
    } as any)
    return instance.id
  }

  async startCustomerApproval(customerId: string, initiatorId: string): Promise<string> {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } })
    if (!customer) throw new BadRequestException('客户不存在')

    const instance = await this.workflowService.startBusinessWorkflow(
      {
        businessType: 'customer',
        businessScene: 'approval',
        businessKey: `customer_${customerId}`,
        variables: { starterId: initiatorId, businessType: 'customer' },
      },
      initiatorId,
    )

    await this.customerRepository.update(customerId, {
      workflowInstanceId: instance.id,
      approvalStatus: '1',
      currentNodeName: '客户审批中',
    } as any)
    return instance.id
  }
}
