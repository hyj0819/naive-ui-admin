<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="触达用户">
        管理社交媒体上识别到的潜在客户和影响者
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
          <n-button type="primary" @click="addContact">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增用户
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle">
      <n-form :model="formData" :label-width="100" class="mt-4">
        <n-form-item label="所属平台">
          <n-select v-model:value="formData.platform_id" placeholder="请选择平台" :options="platformOptions" />
        </n-form-item>
        <n-form-item label="所属业务线">
          <n-select v-model:value="formData.business_line_id" placeholder="请选择业务线" :options="businessLineOptions" />
        </n-form-item>
        <n-form-item label="平台用户ID">
          <n-input v-model:value="formData.platform_user_id" placeholder="请输入平台用户ID" />
        </n-form-item>
        <n-form-item label="用户名">
          <n-input v-model:value="formData.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="是否作者">
          <n-switch v-model:value="formData.is_author" :checked-value="1" :unchecked-value="0" />
        </n-form-item>
        <n-form-item label="触达状态">
          <n-select v-model:value="formData.contact_status" placeholder="请选择触达状态" :options="contactStatusOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="formData.notes" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="formLoading" @click="submitForm">提交</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import { getContactList, createContact, updateContact, deleteContact, type Contact, type CreateContactRequest, type UpdateContactRequest } from '@/api/contacts';
import { getPlatformList, getPlatformListRaw, type Platform } from '@/api/config/platforms';
import { getBusinessLineList, getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const message = useMessage();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增用户');
const editId = ref<number | null>(null);
const platformList = ref<Platform[]>([]);
const businessLineList = ref<BusinessLine[]>([]);

const platformOptions = computed(() => {
  return platformList.value.map(p => ({ label: p.name, value: p.id }));
});

const businessLineOptions = computed(() => {
  return businessLineList.value.map(bl => ({ label: `${bl.platform_name}-${bl.name}`, value: bl.id }));
});

const contactStatusOptions = [
  { label: '未触达', value: 'pending' },
  { label: '已触达', value: 'contacted' },
  { label: '已回复', value: 'replied' },
  { label: '已转化', value: 'converted' },
];

const columns = [
  {
    title: '所属平台',
    key: 'platform_name',
    width: 120,
  },
  {
    title: '所属业务线',
    key: 'business_line_name',
    width: 150,
  },
  {
    title: '用户名',
    key: 'username',
    width: 150,
  },
  {
    title: '是否作者',
    key: 'is_author',
    width: 100,
    render(row: Contact) {
      return row.is_author ? '是' : '否';
    },
  },
  {
    title: '触达状态',
    key: 'contact_status',
    width: 120,
    render(row: Contact) {
      const statusMap: Record<string, string> = {
        pending: '未触达',
        contacted: '已触达',
        replied: '已回复',
        converted: '已转化',
      };
      return statusMap[row.contact_status] || row.contact_status;
    },
  },
  {
    title: '触达次数',
    key: 'contact_attempts',
    width: 100,
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
  },
];

const actionColumn = reactive({
  width: 200,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: Contact) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '编辑',
          onClick: handleEdit.bind(null, record),
        },
        {
          label: '删除',
          onClick: handleDelete.bind(null, record),
        },
      ],
    });
  },
});

const formData = reactive<CreateContactRequest & UpdateContactRequest>({
  platform_id: 0,
  business_line_id: 0,
  platform_user_id: '',
  username: '',
  is_author: 0,
  contact_status: 'pending',
  notes: '',
});

const loadDataTable = async (res: any) => {
  return await getContactList(res);
};

onMounted(async () => {
  platformList.value = await getPlatformListRaw();
  businessLineList.value = await getBusinessLineListRaw();
});

function addContact() {
  editId.value = null;
  modalTitle.value = '新增用户';
  Object.assign(formData, { platform_id: 0, business_line_id: 0, platform_user_id: '', username: '', is_author: 0, contact_status: 'pending', notes: '' });
  showModal.value = true;
}

function handleEdit(record: Contact) {
  editId.value = record.id;
  modalTitle.value = '编辑用户';
  Object.assign(formData, { platform_id: record.platform_id, business_line_id: record.business_line_id, platform_user_id: record.platform_user_id, username: record.username, is_author: record.is_author, contact_status: record.contact_status, notes: record.notes });
  showModal.value = true;
}

async function submitForm() {
  formLoading.value = true;
  try {
    if (editId.value) {
      await updateContact(editId.value, formData);
      message.success('更新成功');
    } else {
      await createContact(formData as CreateContactRequest);
      message.success('创建成功');
    }
    showModal.value = false;
    actionRef.value.reload();
  } catch (error) {
    message.error('操作失败');
  } finally {
    formLoading.value = false;
  }
}

async function handleDelete(record: Contact) {
  try {
    await deleteContact(record.id);
    message.success('删除成功');
    actionRef.value.reload();
  } catch (error) {
    message.error('删除失败');
  }
}
</script>

<style lang="less" scoped></style>