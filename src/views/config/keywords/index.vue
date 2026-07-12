<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="关键词管理">
        管理各业务线下的搜索关键词
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
          <n-button type="primary" @click="addKeyword">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增关键词
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle">
      <n-form :model="formData" :label-width="100" class="mt-4">
        <n-form-item label="所属业务线">
          <n-select v-model:value="formData.business_line_id" placeholder="请选择业务线" :options="businessLineOptions" />
        </n-form-item>
        <n-form-item label="关键词">
          <n-input v-model:value="formData.keyword" placeholder="请输入关键词" />
        </n-form-item>
        <n-form-item label="优先级">
          <n-input-number v-model:value="formData.priority" :min="0" :max="100" />
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
import { reactive, ref, h, computed, nextTick, onMounted } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import { getKeywordList, createKeyword, updateKeyword, deleteKeyword, type Keyword, type CreateKeywordRequest, type UpdateKeywordRequest } from '@/api/config/keywords';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增关键词');
const editId = ref<number | null>(null);
const businessLineList = ref<BusinessLine[]>([]);

const businessLineOptions = computed(() => {
  return businessLineList.value.map(bl => ({ label: `${bl.platform_name}-${bl.name}`, value: bl.id }));
});

const columns = [
  {
    title: '所属业务线',
    key: 'business_line_name',
    width: 180,
  },
  {
    title: '关键词',
    key: 'keyword',
    width: 180,
  },
  {
    title: '优先级',
    key: 'priority',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: Keyword) {
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
  render(record: Keyword) {
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

const formData = reactive<CreateKeywordRequest & UpdateKeywordRequest>({
  business_line_id: 0,
  keyword: '',
  priority: 0,
  status: 1,
});

const loadDataTable = async (res: any) => {
  return await getKeywordList(res);
};

onMounted(async () => {
  businessLineList.value = await getBusinessLineListRaw();
});

function addKeyword() {
  editId.value = null;
  modalTitle.value = '新增关键词';
  Object.assign(formData, { business_line_id: 0, keyword: '', priority: 0, status: 1 });
  showModal.value = true;
}

function handleEdit(record: Keyword) {
  editId.value = record.id;
  modalTitle.value = '编辑关键词';
  Object.assign(formData, { business_line_id: record.business_line_id, keyword: record.keyword, priority: record.priority, status: record.status });
  showModal.value = true;
}

async function submitForm() {
  formLoading.value = true;
  try {
    if (editId.value) {
      await updateKeyword(editId.value, formData);
      message.success('更新成功');
    } else {
      await createKeyword(formData as CreateKeywordRequest);
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

function handleDelete(record: Keyword) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除关键词「${record.keyword}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteKeyword(record.id);
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