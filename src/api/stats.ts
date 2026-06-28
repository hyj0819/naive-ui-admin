import { Alova } from '@/utils/http/alova/index';

export interface OverviewStats {
  platforms: { total: number };
  business_lines: { total: number };
  keywords: { total: number };
  contacts: { total: number; contacted: number; pending: number; contact_rate: number };
  contents: { total: number };
  ai_models: { active: number };
  tasks: { running: number; completed: number };
}

export interface ContactByPlatform {
  platform_code: string;
  platform_name: string;
  total: number;
  contacted: number;
  authors: number;
}

export interface ContactByBusinessLine {
  business_line_code: string;
  business_line_name: string;
  total: number;
  contacted: number;
}

export interface ContentByPlatform {
  platform_code: string;
  platform_name: string;
  total: number;
  analyzed: number;
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

export function getOverviewStats() {
  return Alova.Get<{ code: number; message: string; result: OverviewStats }>('/stats/overview').then(res => res.result);
}

export function getContactsByPlatform() {
  return Alova.Get<{ code: number; message: string; result: ContactByPlatform[] }>('/stats/contacts/by-platform').then(res => res.result || []);
}

export function getContactsByBusinessLine() {
  return Alova.Get<{ code: number; message: string; result: ContactByBusinessLine[] }>('/stats/contacts/by-business-line').then(res => res.result || []);
}

export function getContentsByPlatform() {
  return Alova.Get<{ code: number; message: string; result: ContentByPlatform[] }>('/stats/contents/by-platform').then(res => res.result || []);
}

export function getRecentTasks(params?: { limit?: number }) {
  return Alova.Get<{ code: number; message: string; result: RecentTask[] }>('/stats/tasks/recent', { params }).then(res => res.result || []);
}

export function getTopKeywords(params?: { limit?: number }) {
  return Alova.Get<{ code: number; message: string; result: TopKeyword[] }>('/stats/keywords/top', { params }).then(res => res.result || []);
}