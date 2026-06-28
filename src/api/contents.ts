import { Alova } from '@/utils/http/alova/index';

export interface Content {
  id: number;
  platform_id: number;
  platform_name: string;
  business_line_id: number;
  business_line_name: string;
  content_type: string;
  content_id: string;
  content_url: string;
  title: string;
  content_text: string;
  author_id: string;
  author_name: string;
  engagement_stats: string;
  ai_analysis_result: string;
  source_keyword: string;
  scraped_at: string;
}

export interface CreateContentRequest {
  platform_id: number;
  business_line_id: number;
  content_type: string;
  content_id: string;
  content_url: string;
  title?: string;
  content_text?: string;
  author_id?: string;
  author_name?: string;
  engagement_stats?: string;
  ai_analysis_result?: string;
  source_keyword?: string;
}

export function getContentList(params?: {
  platform_id?: number;
  business_line_id?: number;
  content_type?: string;
}) {
  return Alova.Get<{ code: number; message: string; result: Content[] }>('/contents', { params }).then(res => {
    return {
      list: res.result || [],
      pageCount: 1,
      itemCount: (res.result || []).length,
    };
  });
}

export function getContent(id: number) {
  return Alova.Get<Content>(`/contents/${id}`);
}

export function createContent(data: CreateContentRequest) {
  return Alova.Post<Content>('/contents', { data });
}

export function deleteContent(id: number) {
  return Alova.Delete(`/contents/${id}`);
}