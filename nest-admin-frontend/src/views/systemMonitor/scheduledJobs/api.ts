import request from '@/utils/request'

const { get, post } = request

const serve = window.sysConfig.serves.system + '/scheduled-jobs'

function normalizeListData<T>(res: { data?: T[] | { data?: T[] } } | T[]): T[] {
  if (Array.isArray(res)) return res
  const list = res?.data
  if (Array.isArray(list)) return list
  return Array.isArray(list?.data) ? list.data : []
}

function normalizeDetailData<T extends Record<string, unknown>>(
  res: { data?: T | { data?: T } } | T,
): T {
  if (!res || Array.isArray(res)) return {} as T
  const data = 'data' in res ? res.data : undefined
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const nestedData = 'data' in data ? data.data : undefined
    return (nestedData && typeof nestedData === 'object' ? nestedData : data) as T
  }
  return res as T
}

export interface ScheduledJobItem {
  jobKey: string
  jobName: string
  jobType: string
  module: string
  description: string
  scheduleExpression: string
  supportsManualRun: boolean
  sourceMode: string
  owner: string
  enabled: string
  lastOperatorId?: string
  lastOperatorName?: string
  lastRunTime?: string
  lastStatus?: string
}

export interface ScheduledJobLogItem {
  id?: string | number
  jobKey: string
  jobName: string
  jobType: string
  module: string
  triggerMode: string
  startTime?: string
  endTime?: string
  durationMs?: number
  status?: string
  summary?: string
  processedCount?: number
  successCount?: number
  failedCount?: number
  errorMessage?: string
}

export interface ScheduledJobLogDetail extends ScheduledJobLogItem {
  errorStack?: string
  payload?: Record<string, unknown> | string | null
  operatorId?: string
  operatorName?: string
}

export interface ScheduledJobLogQuery {
  jobKey?: string
  module?: string
  status?: string
}

export const getScheduledJobs = (): Promise<ScheduledJobItem[]> => get(`${serve}/list`).then(normalizeListData)

export const getScheduledJobLogs = (params: ScheduledJobLogQuery = {}): Promise<ScheduledJobLogItem[]> =>
  get(`${serve}/logs`, params).then(normalizeListData)

export const getScheduledJobLogDetail = (id: string): Promise<ScheduledJobLogDetail> =>
  get(`${serve}/logs/${id}`).then(normalizeDetailData)

export const runScheduledJob = (jobKey: string): Promise<unknown> => post(`${serve}/run/${jobKey}`)

export const enableScheduledJob = (jobKey: string): Promise<unknown> => post(`${serve}/enable/${jobKey}`)

export const disableScheduledJob = (jobKey: string): Promise<unknown> => post(`${serve}/disable/${jobKey}`)
