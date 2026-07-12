import { Alova } from '@/utils/http/alova/index';

// ==================== 类型定义 ====================

export interface Role {
  id: number;
  role_code: string;
  role_name: string;
  description?: string;
  status: number;
  created_at: string;
  updated_at: string;
  menu_keys?: string[];
}

export interface User {
  id: number;
  username: string;
  real_name: string;
  email: string;
  status: number;
  last_login_at: string;
  created_at: string;
  updated_at: string;
  roles?: Role[];
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: number;
  role_id?: number;
}

export interface UserListResult {
  data: User[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  real_name?: string;
  email?: string;
  role_ids?: number[];
}

export interface UpdateUserRequest {
  real_name?: string;
  email?: string;
  status?: number;
  role_ids?: number[];
}

// ==================== 用户管理 API ====================

/** 获取用户列表 */
export function getUserList(params?: UserListParams) {
  return Alova.Get<UserListResult>('/system/users/', { params });
}

/** 创建用户 */
export function createUser(data: CreateUserRequest) {
  return Alova.Post<{ id: number; username: string }>('/system/users/', data);
}

/** 更新用户信息 */
export function updateUser(id: number, data: UpdateUserRequest) {
  return Alova.Put<{ id: number }>(`/system/users/${id}`, data);
}

/** 重置用户密码 */
export function resetUserPassword(id: number, data: { new_password: string }) {
  return Alova.Post<{ message: string }>(`/system/users/${id}/reset-password`, data);
}

/** 启用/禁用用户 */
export function updateUserStatus(id: number, status: number) {
  return Alova.Put<{ message: string }>(`/system/users/${id}/status?status=${status}`);
}

/** 删除用户 */
export function deleteUser(id: number) {
  return Alova.Delete<{ message: string }>(`/system/users/${id}`);
}

/** 分配用户角色 */
export function assignUserRoles(id: number, role_ids: number[]) {
  return Alova.Post<{ message: string }>(`/system/users/${id}/roles`, { role_ids });
}

// ==================== 角色管理 API ====================

export interface RoleListResult {
  data: Role[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateRoleRequest {
  role_code: string;
  role_name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  role_name?: string;
  description?: string;
  status?: number;
}

/** 获取角色列表 */
export function getRoleList(params?: { page?: number; page_size?: number; keyword?: string; status?: number }) {
  return Alova.Get<RoleListResult>('/system/roles/', { params });
}

/** 获取所有启用的角色（下拉选择用） */
export function getAllRoles() {
  return Alova.Get<Role[]>('/system/roles/all');
}

/** 创建角色 */
export function createRole(data: CreateRoleRequest) {
  return Alova.Post<{ id: number; role_code: string }>('/system/roles/', data);
}

/** 更新角色 */
export function updateRole(id: number, data: UpdateRoleRequest) {
  return Alova.Put<{ id: number }>(`/system/roles/${id}`, data);
}

/** 删除角色 */
export function deleteRole(id: number) {
  return Alova.Delete<{ message: string }>(`/system/roles/${id}`);
}

/** 获取角色的菜单权限 */
export function getRoleMenus(id: number) {
  return Alova.Get<string[]>(`/system/roles/${id}/menus`);
}

/** 设置角色的菜单权限 */
export function setRoleMenus(id: number, menu_keys: string[]) {
  return Alova.Put<{ message: string }>(`/system/roles/${id}/menus`, { menu_keys });
}
