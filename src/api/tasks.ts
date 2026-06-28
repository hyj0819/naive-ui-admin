import { Alova } from '@/utils/http/alova/index';

export interface TaskExecution {
  id: number;
  task_type: string;
  business_line_id: number;
  business_line_name: string;
  status: string;
  total_items: number;
  success_items: number;
  failed_items: number;
  start_time: string;
  end_time: string;
  error_message: string;
  execution_log: string;
  created_at: string;
}

export interface CreateTaskRequest {
  task_type: string;
  business_line_id: number;
  status?: string;
  total_items?: number;
  success_items?: number;
  failed_items?: number;
}

export function getTaskList(params?: {
  task_type?: string;
  business_line_id?: number;
  status?: string;
}) {
  return Alova.Get<{ code: number; message: string; result: TaskExecution[] }>('/tasks', { params }).then(res => {
    return {
      list: res.result || [],
      pageCount: 1,
      itemCount: (res.result || []).length,
    };
  });
}

export function getTask(id: number) {
  return Alova.Get<TaskExecution>(`/tasks/${id}`);
}

export function createTask(data: CreateTaskRequest) {
  return Alova.Post<TaskExecution>('/tasks', { data });
}

export function updateTask(id: number, data: Partial<TaskExecution>) {
  return Alova.Put<TaskExecution>(`/tasks/${id}`, { data });
}

export function deleteTask(id: number) {
  return Alova.Delete(`/tasks/${id}`);
}

export function startTask(id: number) {
  return Alova.Post(`/tasks/${id}/start`);
}

export function completeTask(id: number, params: { success_items: number; failed_items: number; error_message?: string }) {
  return Alova.Post(`/tasks/${id}/complete`, { params });
}