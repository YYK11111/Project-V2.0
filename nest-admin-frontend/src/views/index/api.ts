import request from '@/utils/request'
import { getMessageList, getUnreadCount } from '@/api/system/message'
import { getUserAreaList, getVisitedNumChart } from '@/views/systemMonitor/loginLog/api'
import { getList as getProjectList } from '@/views/business/projectManage/api'

const { get } = request
const commonApiBase = window.sysConfig.serves.system + '/common'
const indexCountPath = 'getIndex' + 'CountData'

export interface HomeUnreadStats {
  total: number
  todo: number
  cc: number
}

export interface HomeMessageItem {
  id?: string | number
  title?: string
  businessTitle?: string
  createTime?: string
  updateTime?: string
  startTime?: string
}

export interface HomeProjectItem {
  id?: string | number
  projectName?: string
  name?: string
  statusName?: string
  status?: string
  progress?: number | string
  schedule?: number | string
  planProgress?: number | string
  ownerName?: string
  pmName?: string
  leaderName?: string
}

export interface HomeListResponse<T> {
  list: T[]
  total: number
}

export interface AdminIndexCountPayload {
  [key: string]: number | string | undefined
}

export interface AdminChartPoint {
  [key: string]: string | number | undefined
}

interface UnreadCountPayload {
  total?: number | string
  todo?: number | string
  cc?: number | string
}

interface MessageListPayload {
  list?: HomeMessageItem[]
  total?: number | string
}

interface MessageApiResponse {
  data?: UnreadCountPayload | MessageListPayload
}

interface ProjectListPayload {
  list?: HomeProjectItem[]
  total?: number | string
}

function getDataPayload<T>(res: { data?: T } | T): T {
  if (typeof res === 'object' && res !== null && 'data' in res) {
    return (res.data || ({} as T)) as T
  }
  return res as T
}

function toNumber(value: number | string | undefined): number {
  return Number(value || 0)
}

function normalizeUnreadData(res: MessageApiResponse | UnreadCountPayload): HomeUnreadStats {
  const data = getDataPayload<UnreadCountPayload>(res)
  return {
    total: toNumber(data.total),
    todo: toNumber(data.todo),
    cc: toNumber(data.cc),
  }
}

function normalizeMessageList(res: MessageApiResponse | MessageListPayload): HomeListResponse<HomeMessageItem> {
  const data = getDataPayload<MessageListPayload>(res)
  return {
    list: Array.isArray(data.list) ? data.list : [],
    total: toNumber(data.total),
  }
}

function normalizeProjectList(res: ProjectListPayload): HomeListResponse<HomeProjectItem> {
  return {
    list: Array.isArray(res.list) ? res.list : [],
    total: toNumber(res.total),
  }
}

function normalizeIndexCountData(res: { data?: AdminIndexCountPayload } | AdminIndexCountPayload): AdminIndexCountPayload {
  const data = getDataPayload<AdminIndexCountPayload>(res)
  return typeof data === 'object' && data !== null ? data : {}
}

function normalizeChartList(res: { data?: AdminChartPoint[] } | AdminChartPoint[]): AdminChartPoint[] {
  const data = getDataPayload<AdminChartPoint[]>(res)
  return Array.isArray(data) ? data : []
}

export async function getAdminIndexSummary(): Promise<AdminIndexCountPayload> {
  return normalizeIndexCountData(await get(`${commonApiBase}/${indexCountPath}`))
}

export async function getHomeUnreadCount(): Promise<HomeUnreadStats> {
  return normalizeUnreadData(await getUnreadCount())
}

export async function getHomeTodoList(): Promise<HomeListResponse<HomeMessageItem>> {
  return normalizeMessageList(await getMessageList({ pageNum: 1, pageSize: 5, messageType: 'todo', scope: 'current' }))
}

export async function getHomeCcList(): Promise<HomeListResponse<HomeMessageItem>> {
  return normalizeMessageList(await getMessageList({ pageNum: 1, pageSize: 5, messageType: 'cc', scope: 'current' }))
}

export async function getHomeProjectList(): Promise<HomeListResponse<HomeProjectItem>> {
  return normalizeProjectList(await getProjectList({ pageNum: 1, pageSize: 8 }))
}

export async function getAdminVisitedNumChart(): Promise<{ data: AdminChartPoint[] }> {
  return { data: normalizeChartList(await getVisitedNumChart({})) }
}

export async function getAdminUserAreaList(): Promise<{ data: AdminChartPoint[] }> {
  return { data: normalizeChartList(await getUserAreaList({})) }
}
