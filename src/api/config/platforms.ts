import { Alova } from '@/utils/http/alova/index';

export interface Platform {
  id: number;
  code: string;
  name: string;
  status: number;
  config: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePlatformRequest {
  code?: string;
  name: string;
  status?: number;
  config?: string;
}

export interface UpdatePlatformRequest {
  code?: string;
  name?: string;
  status?: number;
  config?: string;
}

export function getPlatformListRaw(params?: { status?: number }) {
  return Alova.Get<Platform[]>('/config/platforms', { params }).then((res: any) => (res.list || res || []));
}

export function getPlatformList(params?: { status?: number; page?: number; pageSize?: number }) {
  return Alova.Get<Platform[]>('/config/platforms', { params }).then((res: any) => {
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

export function getPlatform(id: number) {
  return Alova.Get<Platform>(`/config/platforms/${id}`);
}

export function createPlatform(data: CreatePlatformRequest) {
  return Alova.Post<Platform>('/config/platforms', data);
}

export function updatePlatform(id: number, data: UpdatePlatformRequest) {
  return Alova.Put<Platform>(`/config/platforms/${id}`, data);
}

export function deletePlatform(id: number) {
  return Alova.Delete(`/config/platforms/${id}`);
}