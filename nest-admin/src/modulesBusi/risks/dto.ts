import { QueryListDto } from 'src/common/dto'

export type CreateRiskDto = {
  name: string
  projectId?: string
  category?: string
  level?: string
  status?: string
  description?: string
  mitigation?: string
  impactEstimate?: number
  riskOwnerId?: string
  identifiedDate?: string
  dueDate?: string
  resolvedDate?: string
  sort?: number
} & QueryListDto

export type QueryRiskDto = {
  projectId?: string
  status?: string
  level?: string
  category?: string
} & QueryListDto