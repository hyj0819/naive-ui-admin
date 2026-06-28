<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="平台配置">
        管理社交媒体平台配置
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
          <n-button type="primary" @click="addPlatform">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增平台
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle">
      <n-form :model="formData" :label-width="100" class="mt-4">
        <n-form-item label="平台编码">
          <n-input v-model:value="formData.code" placeholder="如: reddit, tiktok, twitter" />
        </n-form-item>
        <n-form-item label="平台名称">
          <n-input v-model:value="formData.name" placeholder="请输入平台名称" />
        </n-form-item>
        <n-form-item label="状态">
          <n-switch v-model:value="formData.status" :checked-value="1" :unchecked-value="0" />
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
import { reactive, ref, h } from 'vue';
import { useMessage } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import { getPlatformList, createPlatform, updatePlatform, deletePlatform, type Platform, type CreatePlatformRequest, type UpdatePlatformRequest } from '@/api/config/platforms';

const message = useMessage();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增平台');
const editId = ref<number | null>(null);

const columns = [
  {
    title: '平台编码',
    key: 'code',
    width: 120,
  },
  {
    title: '平台名称',
    key: 'name',
    width: 150,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: Platform) {
      return row.status ? '启用' : '禁用';
    },
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
  render(record: Platform) {
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

const formData = reactive<CreatePlatformRequest & UpdatePlatformRequest>({
  code: '',
  name: '',
  status: 1,
});

const loadDataTable = async (res: any) => {
  return await getPlatformList(res);
};

function addPlatform() {
  editId.value = null;
  modalTitle.value = '新增平台';
  Object.assign(formData, { code: '', name: '', status: 1 });
  showModal.value = true;
}

function handleEdit(record: Platform) {
  editId.value = record.id;
  modalTitle.value = '编辑平台';
  Object.assign(formData, { code: record.code, name: record.name, status: record.status });
  showModal.value = true;
}

async function submitForm() {
  formLoading.value = true;
  try {
    if (editId.value) {
      await updatePlatform(editId.value, formData);
      message.success('更新成功');
    } else {
      await createPlatform(formData as CreatePlatformRequest);
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

async function handleDelete(record: Platform) {
  try {
    await deletePlatform(record.id);
    message.success('删除成功');
    actionRef.value.reload();
  } catch (error) {
    message.error('删除失败');
  }
}
</script>

<style lang="less" scoped></style>