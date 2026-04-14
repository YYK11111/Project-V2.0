import { QueryListDto } from 'src/common/dto'

export type CreateSprintDto = {
  name: string
  projectId?: string
  status?: string
  goal?: string
  startDate?: string
  endDate?: string
  totalStoryPoints?: number
  completedStoryPoints?: number
  sort?: number
} & QueryListDto

export type QuerySprintDto = {
  projectId?: string
  status?: string
} & QueryListDto