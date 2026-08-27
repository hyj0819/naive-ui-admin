<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="角色管理">
        管理系统角色，设置角色的菜单访问权限
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <BasicTable
        :columns="columns"
        :request="loadDataTable"
        :row-key="(row: Role) => row.id"
        ref="actionRef"
        :actionColumn="actionColumn"
        :pagination="false"
      >
        <template #tableTitle>
          <n-button type="primary" @click="openCreateModal">
            <template #icon>
              <n-icon><PlusOutlined /></n-icon>
            </template>
            新增角色
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <!-- 新建/编辑角色弹窗 -->
    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle" style="width: 520px;">
      <n-form :model="formData" :label-width="80" label-placement="left">
        <n-form-item label="角色名称">
          <n-input v-model:value="formData.role_name" placeholder="例如：操作员" />
        </n-form-item>
        <n-form-item label="角色编码">
          <n-input v-model:value="formData.role_code" placeholder="例如：operator" :disabled="!!editId" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="formData.description" type="textarea" :rows="2" placeholder="角色描述" />
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
            {{ editId ? '保存修改' : '创建角色' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 权限设置弹窗 -->
    <n-modal v-model:show="showPermModal" :show-icon="false" preset="dialog" title="设置菜单权限" style="width: 480px;">
      <div style="padding: 8px 0;">
        <p style="margin-bottom: 12px; color: #666;">
          为角色 <strong>{{ permTargetRole?.role_name }}</strong> 设置可访问的菜单：
        </p>
        <n-tree
          checkable
          :check-strategy="'all'"
          :default-expand-all="true"
          :data="menuTreeData"
          :checked-keys="checkedMenuKeys"
          @update:checked-keys="onMenuCheckChange"
        />
      </div>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showPermModal = false">取消</n-button>
          <n-button type="primary" :loading="permLoading" @click="submitPermissions">保存权限</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h } from 'vue';
import { useMessage, useDialog, NTag } from 'naive-ui';
import type { TreeOption } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getRoleMenus,
  setRoleMenus,
  type Role,
} from '@/api/users';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();

// ==================== 菜单树定义 ====================

const menuTreeData: TreeOption[] = [
  { key: 'dashboard', label: '仪表盘' },
  {
    key: 'tasks',
    label: '任务中心',
    children: [
      { key: 'task_list', label: '任务列表' },
      { key: 'task_create', label: '创建任务' },
    ],
  },
  {
    key: 'data',
    label: '数据中心',
    children: [
      { key: 'data_contacts', label: '触达用户' },
      { key: 'data_contents', label: '内容数据' },
    ],
  },
  {
    key: 'config',
    label: '配置中心',
    children: [
      { key: 'config_platforms', label: '应用管理' },
      { key: 'config_ai_models', label: '模型配置' },
    ],
  },
  {
    key: 'project',
    label: '项目中心',
    children: [
      { key: 'project_business_lines', label: '项目管理' },
      { key: 'project_keywords', label: '关键词管理' },
      { key: 'project_prompt_templates', label: '提示词管理' },
    ],
  },
  {
    key: 'stats',
    label: '统计分析',
    children: [
      { key: 'stats_overview', label: '数据概览' },
      { key: 'stats_pipeline', label: '转化漏斗' },
      { key: 'stats_trend', label: '趋势分析' },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    children: [
      { key: 'system_accounts', label: '账号配置' },
      { key: 'system_users', label: '用户管理' },
      { key: 'system_roles', label: '角色管理' },
      { key: 'system_operation_logs', label: '操作日志' },
    ],
  },
];

// ==================== 列表 ====================

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '角色名称', key: 'role_name', width: 140 },
  { title: '角色编码', key: 'role_code', width: 140 },
  { title: '描述', key: 'description', width: 240, render: (row: Role) => row.description || '-' },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row: Role) {
      return h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () => row.status === 1 ? '启用' : '禁用');
    },
  },
  {
    title: '内置',
    key: 'builtin',
    width: 70,
    render(row: Role) {
      const isBuiltin = ['admin', 'operator', 'viewer'].includes(row.role_code);
      return h(NTag, { type: isBuiltin ? 'warning' : 'default', size: 'small' }, () => isBuiltin ? '是' : '否');
    },
  },
];

const actionColumn = {
  width: 180,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(row: Role) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '编辑',
          onClick: () => openEditModal(row),
          type: 'info', // Info 色
        },
        {
          label: '权限',
          onClick: () => openPermModal(row),
          type: 'primary', // Primary 色
        },
      ],
      dropDownActions: [
        {
          label: '删除',
          type: 'error',
          disabled: ['admin', 'operator', 'viewer'].includes(row.role_code),
          onClick: () => handleDelete(row),
        },
      ],
    });
  },
};

async function loadDataTable(params: any) {
  const res = await getRoleList({ page: params.pageIndex, page_size: params.pageSize });
  return {
    list: res?.data || [],
    pageCount: Math.ceil((res?.total || 0) / params.pageSize),
    itemCount: res?.total || 0,
  };
}

function reloadTable() {
  actionRef.value?.reload();
}

// ==================== 新建/编辑 ====================

const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增角色');
const editId = ref<number | null>(null);

const formData = reactive({
  role_name: '',
  role_code: '',
  description: '',
  statusBool: true,
});

function openCreateModal() {
  editId.value = null;
  modalTitle.value = '新增角色';
  formData.role_name = '';
  formData.role_code = '';
  formData.description = '';
  formData.statusBool = true;
  showModal.value = true;
}

function openEditModal(row: Role) {
  editId.value = row.id;
  modalTitle.value = '编辑角色';
  formData.role_name = row.role_name;
  formData.role_code = row.role_code;
  formData.description = row.description || '';
  formData.statusBool = row.status === 1;
  showModal.value = true;
}

async function submitForm() {
  if (!formData.role_name || !formData.role_code) {
    message.warning('请填写角色名称和编码');
    return;
  }
  formLoading.value = true;
  try {
    if (editId.value) {
      await updateRole(editId.value, {
        role_name: formData.role_name,
        description: formData.description,
        status: formData.statusBool ? 1 : 0,
      });
      message.success('更新成功');
    } else {
      await createRole({
        role_name: formData.role_name,
        role_code: formData.role_code,
        description: formData.description,
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

// ==================== 删除 ====================

function handleDelete(row: Role) {
  if (['admin', 'operator', 'viewer'].includes(row.role_code)) {
    message.warning('内置角色不可删除');
    return;
  }
  dialog.warning({
    title: '确认删除',
    content: `确定要删除角色「${row.role_name}」吗？`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteRole(row.id);
        message.success('删除成功');
        reloadTable();
      } catch (e: any) {
        message.error(e?.message || '删除失败');
      }
    },
  });
}

// ==================== 权限设置 ====================

const showPermModal = ref(false);
const permLoading = ref(false);
const permTargetRole = ref<Role | null>(null);
const checkedMenuKeys = ref<string[]>([]);

async function openPermModal(row: Role) {
  permTargetRole.value = row;
  // 加载该角色已有的菜单权限
  try {
    const res = await getRoleMenus(row.id);
    checkedMenuKeys.value = Array.isArray(res) ? res : [];
  } catch {
    checkedMenuKeys.value = [];
  }
  showPermModal.value = true;
}

function onMenuCheckChange(keys: string[]) {
  checkedMenuKeys.value = keys;
}

async function submitPermissions() {
  if (!permTargetRole.value) return;
  permLoading.value = true;
  try {
    await setRoleMenus(permTargetRole.value.id, checkedMenuKeys.value);
    message.success('权限设置成功');
    showPermModal.value = false;
  } catch (e: any) {
    message.error(e?.message || '设置失败');
  } finally {
    permLoading.value = false;
  }
}
</script>
