import { Alova } from '@/utils/http/alova/index';

export interface Contact {
  id: number;
  platform_id: number;
  platform_name: string;
  business_line_id: number;
  business_line_name: string;
  platform_user_id: string;
  username: string;
  profile_url: string;
  is_author: number;
  contact_status: string;
  contact_attempts: number;
  last_contact_at: string;
  notes: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactRequest {
  platform_id: number;
  business_line_id: number;
  platform_user_id: string;
  username?: string;
  profile_url?: string;
  is_author?: number;
  contact_status?: string;
  notes?: string;
  metadata?: string;
}

export interface UpdateContactRequest {
  platform_id?: number;
  business_line_id?: number;
  username?: string;
  profile_url?: string;
  is_author?: number;
  contact_status?: string;
  contact_attempts?: number;
  last_contact_at?: string;
  notes?: string;
  metadata?: string;
}

export function getContactList(params?: {
  platform_id?: number;
  business_line_id?: number;
  contact_status?: string;
}) {
  return Alova.Get<{ code: number; message: string; result: Contact[] }>('/contacts', { params }).then(res => {
    return {
      list: res.result || [],
      pageCount: 1,
      itemCount: (res.result || []).length,
    };
  });
}

export function getContact(id: number) {
  return Alova.Get<Contact>(`/contacts/${id}`);
}

export function createContact(data: CreateContactRequest) {
  return Alova.Post<Contact>('/contacts', { data });
}

export function updateContact(id: number, data: UpdateContactRequest) {
  return Alova.Put<Contact>(`/contacts/${id}`, { data });
}

export function deleteContact(id: number) {
  return Alova.Delete(`/contacts/${id}`);
}