import { Alova } from '@/utils/http/alova/index';

// ─── 类型定义 ────────────────────────────────────────

export interface OverviewStats {
  total_contents: number;
  total_contacts: number;
  contacted: number;
  converted: number;
  ai_passed: number;
  messaged: number;
  conversion_rate: number;
  contact_rate: number;
  running_tasks: number;
}

export interface OverviewParams {
  business_line_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface ContactByPlatform {
  platform_code: string;
  platform_name: string;
  total: number;
  contacted: number;
  converted: number;
  messaged: number;
}

export interface ContactByBusinessLine {
  business_line_id: number;
  business_line_code: string;
  business_line_name: string;
  platform_name: string;
  total: number;
  contacted: number;
  converted: number;
}

export interface ContactsStatsResult {
  by_platform: ContactByPlatform[];
  by_business_line: ContactByBusinessLine[];
}

export interface ContentByPlatform {
  platform_code: string;
  platform_name: string;
  total: number;
  ai_analyzed: number;
}

export interface ContentByType {
  content_type: string;
  total: number;
}

export interface ContentsStatsResult {
  by_platform: ContentByPlatform[];
  by_type: ContentByType[];
}

export interface PipelineStage {
  name: string;
  value: number;
  rate: number;
}

export interface PipelineResult {
  stages: PipelineStage[];
}

export interface TrendItem {
  date: string;
  contents: number;
  contacts: number;
  messages: number;
}

export interface TrendResult {
  granularity: string;
  start_date: string;
  end_date: string;
  data: TrendItem[];
}

export interface TrendParams {
  business_line_id?: number;
  start_date?: string;
  end_date?: string;
  granularity?: 'day' | 'week' | 'month';
}

export interface RecentTask {
  id: number;
  task_type: string;
  business_line_name: string;
  status: string;
  total_items: number;
  success_items: number;
  failed_items: number;
  created_at: string;
}

export interface TopKeyword {
  keyword: string;
  business_line_name: string;
  priority: number;
  matched_contents: number;
}

// ─── API 函数 ────────────────────────────────────────
// 注意：Alova responded 已提取 result，返回值直接就是 result

export function getOverviewStats(params?: OverviewParams) {
  return Alova.Get<OverviewStats>('/stats/overview', { params });
}

export function getContactsStats(params?: OverviewParams) {
  return Alova.Get<ContactsStatsResult>('/stats/contacts', { params });
}

export function getContentsStats(params?: OverviewParams) {
  return Alova.Get<ContentsStatsResult>('/stats/contents', { params });
}

export function getPipelineStats(params?: OverviewParams) {
  return Alova.Get<PipelineResult>('/stats/pipeline', { params });
}

export function getTrendData(params?: TrendParams) {
  return Alova.Get<TrendResult>('/stats/trend', { params });
}

export function getRecentTasks(params?: { limit?: number }) {
  return Alova.Get<RecentTask[]>('/stats/tasks/recent', { params });
}

export function getTopKeywords(params?: { limit?: number }) {
  return Alova.Get<TopKeyword[]>('/stats/keywords/top', { params });
}

// 保留旧接口兼容
export function getContactsByPlatform() {
  return Alova.Get<ContactByPlatform[]>('/stats/contacts/by-platform');
}

export function getContactsByBusinessLine() {
  return Alova.Get<ContactByBusinessLine[]>('/stats/contacts/by-business-line');
}

export function getContentsByPlatform() {
  return Alova.Get<ContentByPlatform[]>('/stats/contents/by-platform');
}
