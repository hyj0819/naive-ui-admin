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

export interface CreateKeywordRequest {
  business_line_id: number;
  keyword: string;
  priority?: number;
  status?: number;
}

export interface UpdateKeywordRequest {
  business_line_id?: number;
  keyword?: string;
  priority?: number;
  status?: number;
}

export function getKeywordList(params?: { business_line_id?: number; status?: number }) {
  return Alova.Get<{ code: number; message: string; result: Keyword[] }>('/config/keywords', { params }).then(res => {
    return {
      list: res.result || [],
      pageCount: 1,
      itemCount: (res.result || []).length,
    };
  });
}

export function getKeyword(id: number) {
  return Alova.Get<Keyword>(`/config/keywords/${id}`);
}

export function createKeyword(data: CreateKeywordRequest) {
  return Alova.Post<Keyword>('/config/keywords', { data });
}

export function updateKeyword(id: number, data: UpdateKeywordRequest) {
  return Alova.Put<Keyword>(`/config/keywords/${id}`, { data });
}

export function deleteKeyword(id: number) {
  return Alova.Delete(`/config/keywords/${id}`);
}