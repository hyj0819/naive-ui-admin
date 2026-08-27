import { Alova } from '@/utils/http/alova/index';

export interface Keyword {
  id: number;
  business_line_id: number;
  business_line_name: string;
  keyword: string;
  status: number;
  priority: number;
  created_at: string;
}

// 项目维度 - 用于聚合展示
export interface BusinessLineKeywordSummary {
  id: number; // business_line.id
  business_line_id: number;
  business_line_name: string;
  platform_name: string;
  total_count: number; // 关键词总数
  active_count: number; // 启用数量
  keywords?: Keyword[]; // 关键词列表（可选）
}

export interface CreateKeywordRequest {
  business_line_id: number;
  keyword: string;
  priority?: number;
  status?: number;
}

export interface BatchCreateKeywordRequest {
  business_line_id: number;
  keywords: string[];
  priority?: number;
  status?: number;
}

export interface BatchCreateKeywordResult {
  created_count: number;
  created: string[];
  skipped: string[];
}

export interface UpdateKeywordRequest {
  business_line_id?: number;
  keyword?: string;
  priority?: number;
  status?: number;
}

export function getKeywordList(params?: { business_line_id?: number; status?: number; page?: number; pageSize?: number }) {
  return Alova.Get<Keyword[]>('/config/keywords', { params }).then((res: any) => {
    const list = res.list || res || [];
    const total = res.total ?? list.length;
    const pageSize = params?.pageSize ?? 10;
    return {
      list,
      pageCount: Math.ceil(total / pageSize),
      itemCount: total,
    };
  });
}

// 按项目聚合查询关键词（用于新的展示方式）
export function getBusinessLineKeywordsSummary(
  params?: { business_line_id?: number; keyword?: string; page?: number; pageSize?: number }
) {
  return Alova.Get<{ list: BusinessLineKeywordSummary[]; total: number }>(
    '/config/keywords/summary',
    { params }
  ).then((res: any) => {
    const list = res.list || res || [];
    const total = res.total ?? list.length;
    const pageSize = params?.pageSize ?? 10;
    return {
      list,
      pageCount: Math.ceil(total / pageSize),
      itemCount: total,
    };
  });
}

export function getKeyword(id: number) {
  return Alova.Get<Keyword>(`/config/keywords/${id}`);
}

export function createKeyword(data: CreateKeywordRequest) {
  return Alova.Post<Keyword>('/config/keywords', data);
}

export function batchCreateKeywords(data: BatchCreateKeywordRequest) {
  return Alova.Post<BatchCreateKeywordResult>('/config/keywords/batch', data);
}

export function updateKeyword(id: number, data: UpdateKeywordRequest) {
  return Alova.Put<Keyword>(`/config/keywords/${id}`, data);
}

export function deleteKeyword(id: number) {
  return Alova.Delete(`/config/keywords/${id}`);
}