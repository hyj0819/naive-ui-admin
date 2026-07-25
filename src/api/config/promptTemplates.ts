import { Alova } from '@/utils/http/alova/index';

export interface PromptTemplate {
  id: number;
  business_line_id: number;
  business_line_name: string;
  template_code: string;
  name: string;
  template_content: string;
  variables: string;
  version: number;
  status: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptTemplateRequest {
  business_line_id: number;
  template_code?: string;
  name: string;
  template_content: string;
  variables?: string;
  version?: number;
  status?: number;
}

export interface UpdatePromptTemplateRequest {
  business_line_id?: number;
  template_code?: string;
  name?: string;
  template_content?: string;
  variables?: string;
  version?: number;
  status?: number;
  is_active?: number;
}

export function getPromptTemplateList(params?: { business_line_id?: number; status?: number; page?: number; pageSize?: number }) {
  return Alova.Get<PromptTemplate[]>('/config/prompt-templates', { params }).then((res: any) => {
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

export function getPromptTemplate(id: number) {
  return Alova.Get<PromptTemplate>(`/config/prompt-templates/${id}`);
}

export function createPromptTemplate(data: CreatePromptTemplateRequest) {
  return Alova.Post<PromptTemplate>('/config/prompt-templates', data);
}

export function updatePromptTemplate(id: number, data: UpdatePromptTemplateRequest) {
  return Alova.Put<PromptTemplate>(`/config/prompt-templates/${id}`, data);
}

export function deletePromptTemplate(id: number) {
  return Alova.Delete(`/config/prompt-templates/${id}`);
}

export function activatePromptTemplate(id: number) {
  return Alova.Post(`/config/prompt-templates/${id}/activate`);
}