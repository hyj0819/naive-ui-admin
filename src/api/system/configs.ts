import { Alova } from '@/utils/http/alova/index';

export interface SystemConfig {
  id: number;
  config_group: string;
  config_key: string;
  config_value: string;
  value_type: string;
  label: string;
  description: string;
  sort_order: number;
  updated_at: string;
}

export interface ConfigGroup {
  value: string;
  label: string;
}

/** 获取系统参数列表 */
export function getSystemConfigs(params?: { config_group?: string }) {
  return Alova.Get<SystemConfig[]>('/system/configs', { params });
}

/** 获取参数分组列表 */
export function getConfigGroups() {
  return Alova.Get<ConfigGroup[]>('/system/configs/groups');
}

/** 获取单个系统参数 */
export function getSystemConfig(id: number) {
  return Alova.Get<SystemConfig>(`/system/configs/${id}`);
}

/** 更新单个系统参数 */
export function updateSystemConfig(id: number, data: { config_value: string }) {
  return Alova.Put(`/system/configs/${id}`, data);
}

/** 批量更新系统参数 */
export function batchUpdateSystemConfigs(data: { updates: { id: number; config_value: string }[] }) {
  return Alova.Put('/system/configs/batch', data);
}
