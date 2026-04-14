import { QueryListDto } from 'src/common/dto'

export type CreateChangeDto = {
  title: string
  projectId?: string
  type?: string
  impact?: string
  status?: string
  description?: string
  reason?: string
  impactAnalysis?: string
  attachments?: string[]
  costImpact?: number
  scheduleImpact?: number
  requesterId?: string
  approverId?: string
  approvalComment?: string
  approvalDate?: string
  sort?: number
} & QueryListDto

export type QueryChangeDto = {
  projectId?: string
  status?: string
  type?: string
} & QueryListDto