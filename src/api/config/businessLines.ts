import { Alova } from '@/utils/http/alova/index';

export interface BusinessLine {
  id: number;
  platform_id: number;
  platform_name: string;
  code: string;
  name: string;
  status: number;
  config: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessLineRequest {
  platform_id: number;
  code: string;
  name: string;
  status?: number;
  config?: string;
}

export interface UpdateBusinessLineRequest {
  platform_id?: number;
  code?: string;
  name?: string;
  status?: number;
  config?: string;
}

export function getBusinessLineListRaw(params?: { platform_id?: number; status?: number }) {
  return Alova.Get<{ code: number; message: string; result: BusinessLine[] }>('/config/business-lines', { params }).then(res => res.result || []);
}

export function getBusinessLineList(params?: { platform_id?: number; status?: number }) {
  return Alova.Get<{ code: number; message: string; result: BusinessLine[] }>('/config/business-lines', { params }).then(res => {
    return {
      list: res.result || [],
      pageCount: 1,
      itemCount: (res.result || []).length,
    };
  });
}

export function getBusinessLine(id: number) {
  return Alova.Get<BusinessLine>(`/config/business-lines/${id}`);
}

export function createBusinessLine(data: CreateBusinessLineRequest) {
  return Alova.Post<BusinessLine>('/config/business-lines', { data });
}

export function updateBusinessLine(id: number, data: UpdateBusinessLineRequest) {
  return Alova.Put<BusinessLine>(`/config/business-lines/${id}`, { data });
}

export function deleteBusinessLine(id: number) {
  return Alova.Delete(`/config/business-lines/${id}`);
}