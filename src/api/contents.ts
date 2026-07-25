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

export interface ContentListParams {
  page?: number;
  pageSize?: number;
  platform_id?: number;
  business_line_id?: number;
  content_type?: string;
  source_keyword?: string;
}

export function getContentList(params?: ContentListParams) {
  return Alova.Get<any>('/contents', { params }).then(res => {
    return {
      list: res?.list || [],
      pageCount: res?.pageCount || 0,
      itemCount: res?.itemCount || 0,
    };
  });
}

export function getContent(id: number) {
  return Alova.Get<Content>(`/contents/${id}`);
}

export function createContent(data: CreateContentRequest) {
  return Alova.Post<Content>('/contents', data);
}

export function deleteContent(id: number) {
  return Alova.Delete(`/contents/${id}`);
}

export function getContentExportUrl(params?: { platform_id?: number; business_line_id?: number; content_type?: string; source_keyword?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.platform_id) searchParams.append('platform_id', String(params.platform_id));
  if (params?.business_line_id) searchParams.append('business_line_id', String(params.business_line_id));
  if (params?.content_type) searchParams.append('content_type', params.content_type);
  if (params?.source_keyword) searchParams.append('source_keyword', params.source_keyword);
  const query = searchParams.toString();
  return `http://localhost:8000/api/contents/export${query ? '?' + query : ''}`;
}
