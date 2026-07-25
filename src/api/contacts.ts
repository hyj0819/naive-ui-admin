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

export interface ContactInteraction {
  id: number;
  contact_id: number;
  interaction_type: string;
  task_execution_id: number;
  detail: string;
  created_at: string;
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
  username?: string;
  profile_url?: string;
  is_author?: number;
  contact_status?: string;
  contact_attempts?: number;
  last_contact_at?: string;
  notes?: string;
  metadata?: string;
}

export interface ContactListParams {
  page?: number;
  pageSize?: number;
  platform_id?: number;
  business_line_id?: number;
  contact_status?: string;
  keyword?: string;
}

export function getContactList(params?: ContactListParams) {
  return Alova.Get<any>('/contacts', { params }).then(res => {
    return {
      list: res?.list || [],
      pageCount: res?.pageCount || 0,
      itemCount: res?.itemCount || 0,
    };
  });
}

export function getContact(id: number) {
  return Alova.Get<Contact>(`/contacts/${id}`);
}

export function createContact(data: CreateContactRequest) {
  return Alova.Post<Contact>('/contacts', data);
}

export function updateContact(id: number, data: UpdateContactRequest) {
  return Alova.Put<Contact>(`/contacts/${id}`, data);
}

export function deleteContact(id: number) {
  return Alova.Delete(`/contacts/${id}`);
}

export function batchUpdateContacts(ids: number[], contact_status: string) {
  return Alova.Post('/contacts/batch-update', { ids, contact_status });
}

export function getContactInteractions(contactId: number) {
  return Alova.Get<ContactInteraction[]>(`/contacts/${contactId}/interactions`);
}

export function createContactInteraction(contactId: number, data: { interaction_type: string; task_execution_id?: number; detail?: string }) {
  return Alova.Post<ContactInteraction>(`/contacts/${contactId}/interactions`, data);
}

export function getContactExportUrl(params?: { platform_id?: number; business_line_id?: number; contact_status?: string; keyword?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.platform_id) searchParams.append('platform_id', String(params.platform_id));
  if (params?.business_line_id) searchParams.append('business_line_id', String(params.business_line_id));
  if (params?.contact_status) searchParams.append('contact_status', params.contact_status);
  if (params?.keyword) searchParams.append('keyword', params.keyword);
  const query = searchParams.toString();
  return `http://localhost:8000/api/contacts/export${query ? '?' + query : ''}`;
}
