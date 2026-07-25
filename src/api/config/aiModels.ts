import { Alova } from '@/utils/http/alova/index';

export interface AIModel {
  id: number;
  provider: string;
  api_key_masked: string;
  api_url: string;
  is_active: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAIModelRequest {
  provider: string;
  api_key: string;
  api_url: string;
}

export interface UpdateAIModelRequest {
  provider?: string;
  api_key?: string;
  api_url?: string;
  is_active?: number;
  status?: number;
}

export function getAiModelList(params?: { provider?: string; status?: number; page?: number; pageSize?: number }) {
  return Alova.Get<AIModel[]>('/config/ai-models', { params }).then((res: any) => {
    const data = res.result || res.list || res || [];
    const list = Array.isArray(data) ? data : [];
    const total = res.total ?? list.length;
    const pageSize = params?.pageSize ?? 10;
    return {
      list,
      pageCount: Math.ceil(total / pageSize),
      itemCount: total,
    };
  });
}

export function getAiModel(id: number) {
  return Alova.Get<AIModel>(`/config/ai-models/${id}`);
}

export function createAiModel(data: CreateAIModelRequest) {
  return Alova.Post<AIModel>('/config/ai-models', data);
}

export function updateAiModel(id: number, data: UpdateAIModelRequest) {
  return Alova.Put<AIModel>(`/config/ai-models/${id}`, data);
}

export function deleteAiModel(id: number) {
  return Alova.Delete(`/config/ai-models/${id}`);
}

export function activateAiModel(id: number) {
  return Alova.Post(`/config/ai-models/${id}/activate`);
}

export function deactivateAiModel(id: number) {
  return Alova.Post(`/config/ai-models/${id}/deactivate`);
}

export function testAiModel(id: number) {
  return Alova.Post(`/config/ai-models/${id}/test`);
}