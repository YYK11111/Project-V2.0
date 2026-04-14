import { QueryListDto } from 'src/common/dto'

export type CreateMilestoneDto = {
  name: string
  projectId?: string
  description?: string
  dueDate?: string
  completedDate?: string
  status?: string
  taskCount?: number
  completedTaskCount?: number
  deliverables?: string[]
  sort?: number
} & QueryListDto

export type QueryMilestoneDto = {
  projectId?: string
  status?: string
} & QueryListDto