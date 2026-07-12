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
  return Alova.Get<BusinessLine[]>('/config/business-lines', { params }).then((res: any) => (res.list || res || []));
}

export function getBusinessLineList(params?: { platform_id?: number; status?: number; page?: number; pageSize?: number }) {
  return Alova.Get<BusinessLine[]>('/config/business-lines', { params }).then((res: any) => {
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

export function getBusinessLine(id: number) {
  return Alova.Get<BusinessLine>(`/config/business-lines/${id}`);
}

export function createBusinessLine(data: CreateBusinessLineRequest) {
  return Alova.Post<BusinessLine>('/config/business-lines', data);
}

export function updateBusinessLine(id: number, data: UpdateBusinessLineRequest) {
  return Alova.Put<BusinessLine>(`/config/business-lines/${id}`, data);
}

export function deleteBusinessLine(id: number) {
  return Alova.Delete(`/config/business-lines/${id}`);
}