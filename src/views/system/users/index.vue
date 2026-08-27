<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="用户管理">
        管理系统登录用户，包括创建用户、分配角色、启用/禁用等操作
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <BasicTable
        :columns="columns"
        :request="loadDataTable"
        :row-key="(row: User) => row.id"
        ref="actionRef"
        :actionColumn="actionColumn"
        :pagination="pagination"
      >
        <template #tableTitle>
          <n-button type="primary" @click="openCreateModal">
            <template #icon>
              <n-icon><PlusOutlined /></n-icon>
            </template>
            新增用户
          </n-button>
        </template>
        <template #filter>
          <n-space>
            <n-input v-model:value="filterParams.keyword" placeholder="用户名/姓名搜索" clearable style="width: 200px;" />
            <n-select
              v-model:value="filterParams.status"
              :options="statusOptions"
              placeholder="状态筛选"
              clearable
              style="width: 140px;"
            />
            <n-button type="primary" @click="reloadTable">搜索</n-button>
            <n-button @click="resetFilter">重置</n-button>
          </n-space>
        </template>
      </BasicTable>
    </n-card>

    <!-- 新建/编辑用户弹窗 -->
    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle" style="width: 520px;">
      <n-form :model="formData" :label-width="80" label-placement="left">
        <n-form-item label="用户名">
          <n-input v-model:value="formData.username" placeholder="请输入用户名" :disabled="!!editId" />
        </n-form-item>
        <n-form-item label="密码" v-if="!editId">
          <n-input v-model:value="formData.password" type="password" show-password-on="click" placeholder="请输入密码" />
        </n-form-item>
        <n-form-item label="姓名">
          <n-input v-model:value="formData.real_name" placeholder="请输入姓名" />
        </n-form-item>
        <n-form-item label="邮箱">
          <n-input v-model:value="formData.email" placeholder="请输入邮箱" />
        </n-form-item>
        <n-form-item label="状态">
          <n-switch v-model:value="formData.statusBool">
            <template #checked>启用</template>
            <template #unchecked>禁用</template>
          </n-switch>
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="formLoading" @click="submitForm">
            {{ editId ? '保存修改' : '创建用户' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 重置密码弹窗 -->
    <n-modal v-model:show="showResetPwModal" :show-icon="false" preset="dialog" title="重置密码" style="width: 420px;">
      <n-form :model="resetPwForm" :label-width="80" label-placement="left">
        <n-form-item label="新密码">
          <n-input v-model:value="resetPwForm.new_password" type="password" show-password-on="click" placeholder="请输入新密码" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showResetPwModal = false">取消</n-button>
          <n-button type="primary" :loading="resetPwLoading" @click="submitResetPassword">确认重置</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 分配角色弹窗 -->
    <n-modal v-model:show="showRoleModal" :show-icon="false" preset="dialog" title="分配角色" style="width: 420px;">
      <div style="padding: 8px 0;">
        <p style="margin-bottom: 12px; color: #666;">为用户 <strong>{{ roleTargetUser?.username }}</strong> 分配角色：</p>
        <n-checkbox-group v-model:value="selectedRoleIds">
          <n-space vertical>
            <n-checkbox
              v-for="role in allRoles"
              :key="role.id"
              :value="role.id"
              :label="role.role_name"
            />
          </n-space>
        </n-checkbox-group>
        <n-empty v-if="allRoles.length === 0" description="暂无角色，请先创建角色" style="margin-top: 16px;" />
      </div>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showRoleModal = false">取消</n-button>
          <n-button type="primary" :loading="roleLoading" @click="submitAssignRoles">确认分配</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, nextTick } from 'vue';
import { useMessage, useDialog, NButton, NSpace, NTag, NSwitch } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import {
  getUserList,
  createUser,
  updateUser,
  resetUserPassword,
  updateUserStatus,
  deleteUser,
  assignUserRoles,
  getAllRoles,
  type User,
  type Role,
} from '@/api/users';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();

// ==================== 列表 ====================

const filterParams = reactive({
  keyword: '',
  status: null as number | null,
});

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

const pagination = reactive({
  page: 1,
  pageSize: 20,
});

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '用户名', key: 'username', width: 120 },
  { title: '姓名', key: 'real_name', width: 120, render: (row: User) => row.real_name || '-' },
  { title: '邮箱', key: 'email', width: 180, render: (row: User) => row.email || '-' },
  {
    title: '角色',
    key: 'roles',
    width: 160,
    render(row: User) {
      if (!row.roles || row.roles.length === 0) return '-';
      return h(NSpace, null, () =>
        (row.roles || []).map((r: Role) => h(NTag, { type: 'info', size: 'small', key: r.id }, () => r.role_name))
      );
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row: User) {
      return h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () => row.status === 1 ? '启用' : '禁用');
    },
  },
  {
    title: '最后登录',
    key: 'last_login_at',
    width: 160,
    render: (row: User) => row.last_login_at || '-',
  },
];

const actionColumn = {
  width: 240,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(row: User) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '编辑',
          onClick: () => openEditModal(row),
          type: 'info', // Info 色
        },
        {
          label: '角色',
          onClick: () => openRoleModal(row),
          type: 'primary', // Primary 色
        },
        {
          label: '重置密码',
          onClick: () => openResetPwModal(row),
          type: 'warning', // Warning 色
        },
        {
          label: row.status === 1 ? '禁用' : '启用',
          onClick: () => handleToggleStatus(row),
          type: row.status === 1 ? 'warning' : 'success', // 禁用用 Warning，启用用 Success
        },
      ],
      dropDownActions: [
        {
          label: '删除',
          type: 'error',
          onClick: () => handleDelete(row),
        },
      ],
    });
  },
};

async function loadDataTable(params: any) {
  const res = await getUserList({
    page: params.pageIndex,
    page_size: params.pageSize,
    keyword: filterParams.keyword || undefined,
    status: filterParams.status ?? undefined,
  });
  return {
    list: res?.data || [],
    pageCount: Math.ceil((res?.total || 0) / params.pageSize),
    itemCount: res?.total || 0,
  };
}

function reloadTable() {
  actionRef.value?.reload();
}

function resetFilter() {
  filterParams.keyword = '';
  filterParams.status = null;
  reloadTable();
}

// ==================== 新建/编辑 ====================

const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增用户');
const editId = ref<number | null>(null);

const formData = reactive({
  username: '',
  password: '',
  real_name: '',
  email: '',
  statusBool: true,
});

function openCreateModal() {
  editId.value = null;
  modalTitle.value = '新增用户';
  formData.username = '';
  formData.password = '';
  formData.real_name = '';
  formData.email = '';
  formData.statusBool = true;
  showModal.value = true;
}

function openEditModal(row: User) {
  editId.value = row.id;
  modalTitle.value = '编辑用户';
  formData.username = row.username;
  formData.password = '';
  formData.real_name = row.real_name || '';
  formData.email = row.email || '';
  formData.statusBool = row.status === 1;
  showModal.value = true;
}

async function submitForm() {
  if (!editId.value && !formData.username) {
    message.warning('请输入用户名');
    return;
  }
  if (!editId.value && !formData.password) {
    message.warning('请输入密码');
    return;
  }
  formLoading.value = true;
  try {
    if (editId.value) {
      await updateUser(editId.value, {
        real_name: formData.real_name,
        email: formData.email,
        status: formData.statusBool ? 1 : 0,
      });
      message.success('更新成功');
    } else {
      await createUser({
        username: formData.username,
        password: formData.password,
        real_name: formData.real_name,
        email: formData.email,
      });
      message.success('创建成功');
    }
    showModal.value = false;
    reloadTable();
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  } finally {
    formLoading.value = false;
  }
}

// ==================== 重置密码 ====================

const showResetPwModal = ref(false);
const resetPwLoading = ref(false);
const resetPwTargetId = ref<number | null>(null);
const resetPwForm = reactive({ new_password: '' });

function openResetPwModal(row: User) {
  resetPwTargetId.value = row.id;
  resetPwForm.new_password = '';
  showResetPwModal.value = true;
}

async function submitResetPassword() {
  if (!resetPwForm.new_password) {
    message.warning('请输入新密码');
    return;
  }
  resetPwLoading.value = true;
  try {
    await resetUserPassword(resetPwTargetId.value!, { new_password: resetPwForm.new_password });
    message.success('密码重置成功');
    showResetPwModal.value = false;
  } catch (e: any) {
    message.error(e?.message || '重置失败');
  } finally {
    resetPwLoading.value = false;
  }
}

// ==================== 启用/禁用 ====================

async function handleToggleStatus(row: User) {
  const newStatus = row.status === 1 ? 0 : 1;
  const actionText = newStatus === 1 ? '启用' : '禁用';
  dialog.warning({
    title: '确认操作',
    content: `确定要${actionText}用户「${row.username}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await updateUserStatus(row.id, newStatus);
        message.success(`${actionText}成功`);
        reloadTable();
      } catch (e: any) {
        message.error(e?.message || `${actionText}失败`);
      }
    },
  });
}

// ==================== 删除 ====================

function handleDelete(row: User) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户「${row.username}」吗？此操作不可恢复。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteUser(row.id);
        message.success('删除成功');
        reloadTable();
      } catch (e: any) {
        message.error(e?.message || '删除失败');
      }
    },
  });
}

// ==================== 分配角色 ====================

const showRoleModal = ref(false);
const roleLoading = ref(false);
const roleTargetUser = ref<User | null>(null);
const allRoles = ref<Role[]>([]);
const selectedRoleIds = ref<number[]>([]);

async function openRoleModal(row: User) {
  roleTargetUser.value = row;
  selectedRoleIds.value = (row.roles || []).map((r: Role) => r.id);
  // 加载所有角色
  try {
    const res = await getAllRoles();
    allRoles.value = res || [];
  } catch {
    allRoles.value = [];
  }
  showRoleModal.value = true;
}

async function submitAssignRoles() {
  if (!roleTargetUser.value) return;
  roleLoading.value = true;
  try {
    await assignUserRoles(roleTargetUser.value.id, selectedRoleIds.value);
    message.success('角色分配成功');
    showRoleModal.value = false;
    reloadTable();
  } catch (e: any) {
    message.error(e?.message || '分配失败');
  } finally {
    roleLoading.value = false;
  }
}
</script>
