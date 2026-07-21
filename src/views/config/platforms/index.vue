<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="应用配置">
        管理社交媒体应用配置
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
            新增应用
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle">
      <n-form :model="formData" :label-width="100" class="mt-4">
        <n-form-item label="应用编码">
          <n-input v-model:value="formData.code" placeholder="如: reddit, tiktok, twitter" :disabled="!!editId" />
        </n-form-item>
        <n-form-item label="应用名称">
          <n-input v-model:value="formData.name" placeholder="请输入应用名称" />
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
import { reactive, ref, h, nextTick } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import { getPlatformList, createPlatform, updatePlatform, deletePlatform, type Platform, type CreatePlatformRequest, type UpdatePlatformRequest } from '@/api/config/platforms';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增应用');
const editId = ref<number | null>(null);

const columns = [
  {
    title: '应用编码',
    key: 'code',
    width: 120,
  },
  {
    title: '应用名称',
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
  modalTitle.value = '新增应用';
  Object.assign(formData, { code: '', name: '', status: 1 });
  showModal.value = true;
}

function handleEdit(record: Platform) {
  editId.value = record.id;
  modalTitle.value = '编辑应用';
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
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  } finally {
    formLoading.value = false;
  }
}

function handleDelete(record: Platform) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除应用「${record.name}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deletePlatform(record.id);
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

<style lang="less" scoped></style>