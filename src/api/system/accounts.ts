import { Alova } from '@/utils/http/alova/index';

export interface Account {
  id: number;
  account_name: string;
  platform_id: number;
  platform_name: string;
  browser_id: string;
  status: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountRequest {
  account_name: string;
  platform_id: number;
  browser_id?: string;
  notes?: string;
}

export interface UpdateAccountRequest {
  account_name?: string;
  platform_id?: number;
  browser_id?: string;
  status?: number;
  notes?: string;
}

export function getAccountList(params?: { platform_id?: number; status?: number }) {
  return Alova.Get<Account[]>('/system/accounts', { params }).then(res => {
    return {
      list: res || [],
      pageCount: 1,
      itemCount: (res || []).length,
    };
  });
}

export function getAccount(id: number) {
  return Alova.Get<Account>(`/system/accounts/${id}`);
}

export function createAccount(data: CreateAccountRequest) {
  return Alova.Post<Account>('/system/accounts', data);
}

export function updateAccount(id: number, data: UpdateAccountRequest) {
  return Alova.Put<Account>(`/system/accounts/${id}`, data);
}

export function deleteAccount(id: number) {
  return Alova.Delete(`/system/accounts/${id}`);
}
