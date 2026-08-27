<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="账号配置">
        管理指纹浏览器(AdsPower)中的账号配置，用于任务执行时的身份切换
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <BasicTable
        :columns="columns"
        :request="loadDataTable"
        :row-key="(row) => row.id"
        ref="actionRef"
        :actionColumn="actionColumn"
      >
        <template #tableTitle>
          <n-button type="primary" @click="addAccount">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增账号
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle" style="width: 520px;">
      <n-form :model="formData" :label-width="90" label-placement="left">
        <n-form-item label="账号名称">
          <n-input v-model:value="formData.account_name" placeholder="例如：NEAGLE_GOLF" />
        </n-form-item>

        <n-form-item label="所属平台">
          <n-select 
            v-model:value="formData.platform_id" 
            placeholder="请选择平台" 
            :options="platformOptions" 
            filterable
          />
        </n-form-item>

        <n-form-item label="浏览器ID">
          <n-input v-model:value="formData.browser_id" placeholder="指纹浏览器用户ID，例如：k1byab0k" />
        </n-form-item>

        <n-form-item label="备注">
          <n-input v-model:value="formData.notes" type="textarea" :rows="3" placeholder="请输入备注..." />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="formLoading" @click="submitForm">
            <template #icon>
              <n-icon>
                <EditOutlined v-if="editId" />
                <PlusOutlined v-else />
              </n-icon>
            </template>
            {{ editId ? '保存修改' : '创建账号' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, nextTick, onMounted } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined, EditOutlined } from '@vicons/antd';
import { getAccountList, createAccount, updateAccount, deleteAccount, type Account, type CreateAccountRequest } from '@/api/system/accounts';
import { getPlatformListRaw, type Platform } from '@/api/config/platforms';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增账号');
const editId = ref<number | null>(null);
const platformOptions = ref<{ label: string; value: number }[]>([]);

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 60,
  },
  {
    title: '账号名称',
    key: 'account_name',
    width: 160,
  },
  {
    title: '所属平台',
    key: 'platform_name',
    width: 120,
    render(row: Account) {
      return row.platform_name || '-';
    },
  },
  {
    title: '浏览器ID',
    key: 'browser_id',
    width: 140,
    render(row: Account) {
      return row.browser_id || '-';
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row: Account) {
      return h(
        'span',
        {
          style: {
            color: row.status === 1 ? '#18a058' : '#d03050',
            fontWeight: 'bold',
          },
        },
        row.status === 1 ? '启用' : '禁用'
      );
    },
  },
  {
    title: '备注',
    key: 'notes',
    ellipsis: true,
    render(row: Account) {
      return row.notes || '-';
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
  },
];

const actionColumn = reactive({
  width: 180,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: Account) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: record.status === 1 ? '禁用' : '启用',
          onClick: handleToggleStatus.bind(null, record),
          type: record.status === 1 ? 'warning' : 'success', // 禁用用 Warning，启用用 Success
        },
        {
          label: '编辑',
          onClick: handleEdit.bind(null, record),
          type: 'info', // Info 色
        },
        {
          label: '删除',
          onClick: handleDelete.bind(null, record),
          type: 'error', // Error 色
        },
      ],
    });
  },
});

const formData = reactive({
  account_name: '',
  platform_id: undefined as number | undefined,
  browser_id: '',
  notes: '',
});

const loadDataTable = async (res: any) => {
  const result = await getAccountList(res);
  return result;
};

async function loadPlatformOptions() {
  try {
    const platforms = await getPlatformListRaw({ status: 1 });
    platformOptions.value = platforms.map((p: Platform) => ({
      label: p.name,
      value: p.id,
    }));
  } catch (error) {
    console.error('加载平台列表失败', error);
  }
}

onMounted(() => {
  loadPlatformOptions();
});

function addAccount() {
  editId.value = null;
  modalTitle.value = '新增账号';
  Object.assign(formData, {
    account_name: '',
    platform_id: undefined,
    browser_id: '',
    notes: '',
  });
  showModal.value = true;
}

function handleEdit(record: Account) {
  editId.value = record.id;
  modalTitle.value = '编辑账号';
  Object.assign(formData, {
    account_name: record.account_name,
    platform_id: record.platform_id,
    browser_id: record.browser_id || '',
    notes: record.notes || '',
  });
  showModal.value = true;
}

async function submitForm() {
  if (!formData.account_name) {
    message.warning('请输入账号名称');
    return;
  }
  if (!formData.platform_id) {
    message.warning('请选择所属平台');
    return;
  }

  formLoading.value = true;
  try {
    if (editId.value) {
      await updateAccount(editId.value, formData);
      message.success('更新成功');
    } else {
      await createAccount(formData as CreateAccountRequest);
      message.success('创建成功');
    }
    showModal.value = false;
    await nextTick();
    await actionRef.value?.reload();
  } catch (error: any) {
    // alova 全局处理器已展示错误信息
  } finally {
    formLoading.value = false;
  }
}

async function handleToggleStatus(record: Account) {
  const newStatus = record.status === 1 ? 0 : 1;
  const actionText = newStatus === 1 ? '启用' : '禁用';
  try {
    await updateAccount(record.id, { status: newStatus });
    message.success(`${actionText}成功`);
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  }
}

function handleDelete(record: Account) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除账号「${record.account_name}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteAccount(record.id);
        message.success('删除成功');
        await nextTick();
        await actionRef.value?.reload();
      } catch (error) {
        // alova 全局处理器已展示错误信息
      }
    },
  });
}
</script>

<style lang="less" scoped>
</style>
