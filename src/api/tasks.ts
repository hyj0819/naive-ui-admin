import { Alova } from '@/utils/http/alova/index';

// ==================== 类型定义 ====================

export interface TaskExecution {
  id: number;
  task_name: string;
  task_type: string;
  business_line_id: number;
  business_line_name: string;
  platform_name: string;
  status: string;
  task_config: string;
  total_items: number;
  success_items: number;
  failed_items: number;
  pending_items: number;
  progress: number;
  start_time: string;
  end_time: string;
  account_id: number;
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface TaskLog {
  id: number;
  task_id: number;
  log_level: string;
  message: string;
  created_at: string;
}

export interface TaskListParams {
  task_type?: string;
  business_line_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface TaskListResult {
  items: TaskExecution[];
  total: number;
  page: number;
  page_size: number;
}

export interface TaskLogListResult {
  items: TaskLog[];
  total: number;
  page: number;
  page_size: number;
}

// ==================== 创建任务请求体 ====================

export interface CreateScrapeTaskRequest {
  task_name?: string;
  business_line_id: number;
  keywords: string[];
  content_types: string[];
  max_items_per_keyword: number;
  ai_filter_enabled: boolean;
  ai_prompt_template_id?: number;
  exclude_author: boolean;
  account_id?: number;
}

export interface CreateMessageTaskRequest {
  task_name?: string;
  business_line_id: number;
  target_contact_ids: number[];
  message_mode: string;
  prompt_template_id?: number;
  fixed_message?: string;
  max_send_count: number;
  send_interval_min: number;
  send_interval_max: number;
  account_id?: number;
}

export interface CreateReplyTaskRequest {
  task_name?: string;
  business_line_id: number;
  keywords: string[];
  prompt_template_id?: number;
  max_reply_count: number;
  account_id?: number;
}

// ==================== API 函数 ====================

/** 获取任务列表（分页） */
export function getTaskList(params?: TaskListParams) {
  return Alova.Get<TaskListResult>('/tasks', { params }).then(res => {
    return {
      list: res.items || [],
      pageCount: Math.ceil(res.total / (params?.page_size || 20)),
      itemCount: res.total,
    };
  });
}

/** 获取任务详情 */
export function getTask(id: number) {
  return Alova.Get<TaskExecution>(`/tasks/${id}`);
}

/** 创建爬虫任务 */
export function createScrapeTask(data: CreateScrapeTaskRequest) {
  return Alova.Post<TaskExecution>('/tasks/scrape', { data });
}

/** 创建私信任务 */
export function createMessageTask(data: CreateMessageTaskRequest) {
  return Alova.Post<TaskExecution>('/tasks/message', { data });
}

/** 创建评论回复任务 */
export function createReplyTask(data: CreateReplyTaskRequest) {
  return Alova.Post<TaskExecution>('/tasks/reply', { data });
}

/** 停止任务 */
export function stopTask(id: number) {
  return Alova.Post<TaskExecution>(`/tasks/${id}/stop`);
}

/** 重试失败任务 */
export function retryTask(id: number) {
  return Alova.Post<TaskExecution>(`/tasks/${id}/retry`);
}

/** 删除任务 */
export function deleteTask(id: number) {
  return Alova.Delete(`/tasks/${id}`);
}

/** 获取任务执行日志 */
export function getTaskLogs(taskId: number, params?: { page?: number; page_size?: number; log_level?: string }) {
  return Alova.Get<TaskLogListResult>(`/tasks/${taskId}/logs`, { params });
}