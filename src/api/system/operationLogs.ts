import { Alova } from '@/utils/http/alova/index';

export interface OperationLog {
  id: number;
  operation_type: string;
  operator: string;
  target_type: string;
  target_id: number;
  operation_detail: string;
  ip_address: string;
  created_at: string;
}

export interface OperationLogListResult {
  items: OperationLog[];
  total: number;
  page: number;
  page_size: number;
}

export interface OperationLogListParams {
  operation_type?: string;
  target_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export function getOperationLogList(params?: OperationLogListParams) {
  return Alova.Get<OperationLogListResult>('/system/operation-logs', { params }).then(res => {
    return {
      list: res.items || [],
      pageCount: Math.ceil(res.total / (params?.page_size || 20)),
      itemCount: res.total,
    };
  });
}

export function exportOperationLogs(params?: Omit<OperationLogListParams, 'page' | 'page_size'>) {
  return Alova.Get<OperationLog[]>('/system/operation-logs/export', { params });
}

export function getLogTypes() {
  return Alova.Get<{ operation_types: string[]; target_types: string[] }>('/system/operation-logs/types');
}
