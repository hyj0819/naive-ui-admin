import { Alova } from '@/utils/http/alova/index';

export interface AIModel {
  id: number;
  provider: string;
  model_name: string;
  api_key_masked: string;
  base_url: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  extra_params: string;
  is_active: number;
  status: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAIModelRequest {
  provider: string;
  model_name: string;
  api_key: string;
  base_url: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  extra_params?: string;
  description?: string;
}

export interface UpdateAIModelRequest {
  provider?: string;
  model_name?: string;
  api_key?: string;
  base_url?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  extra_params?: string;
  is_active?: number;
  status?: number;
  description?: string;
}

export function getAiModelList(params?: { provider?: string; status?: number }) {
  return Alova.Get<{ code: number; message: string; result: AIModel[] }>('/config/ai-models', { params }).then(res => {
    return {
      list: res.result || [],
      pageCount: 1,
      itemCount: (res.result || []).length,
    };
  });
}

export function getAiModel(id: number) {
  return Alova.Get<AIModel>(`/config/ai-models/${id}`);
}

export function createAiModel(data: CreateAIModelRequest) {
  return Alova.Post<AIModel>('/config/ai-models', { data });
}

export function updateAiModel(id: number, data: UpdateAIModelRequest) {
  return Alova.Put<AIModel>(`/config/ai-models/${id}`, { data });
}

export function deleteAiModel(id: number) {
  return Alova.Delete(`/config/ai-models/${id}`);
}

export function activateAiModel(id: number) {
  return Alova.Post(`/config/ai-models/${id}/activate`);
}

export function testAiModel(id: number) {
  return Alova.Post(`/config/ai-models/${id}/test`);
}