<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="提示词管理">
        管理AI提示词模板，支持版本管理和激活
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
          <n-button type="primary" @click="addTemplate">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增提示词
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle" :style="{ width: '740px' }">
      <n-form :model="formData" :label-width="100" class="mt-4">
        <n-form-item label="所属业务线">
          <n-select v-model:value="formData.business_line_id" placeholder="请选择业务线" :options="businessLineOptions" />
        </n-form-item>
        <n-form-item label="模板编码">
          <n-input v-model:value="formData.template_code" placeholder="如: customer_filter" />
        </n-form-item>
        <n-form-item label="模板名称">
          <n-input v-model:value="formData.name" placeholder="请输入模板名称" />
        </n-form-item>
        <n-form-item label="模板内容">
          <n-input v-model:value="formData.template_content" type="textarea" :rows="6" placeholder="请输入提示词模板内容，支持变量替换如 {variable}" />
        </n-form-item>
        <n-form-item label="变量列表">
          <n-input v-model:value="formData.variables" placeholder="JSON数组格式，如: ['post_content', 'comment_content']" />
        </n-form-item>
        <n-form-item label="版本">
          <n-input-number v-model:value="formData.version" :min="1" />
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
import { getPromptTemplateList, createPromptTemplate, updatePromptTemplate, deletePromptTemplate, activatePromptTemplate, type PromptTemplate, type CreatePromptTemplateRequest, type UpdatePromptTemplateRequest } from '@/api/config/promptTemplates';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增提示词');
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
    title: '模板编码',
    key: 'template_code',
    width: 120,
  },
  {
    title: '模板名称',
    key: 'name',
    width: 150,
  },
  {
    title: '版本',
    key: 'version',
    width: 80,
  },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render(row: PromptTemplate) {
      return row.is_active ? '已激活' : '未激活';
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
  },
];

const actionColumn = reactive({
  width: 250,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: PromptTemplate) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '激活',
          onClick: handleActivate.bind(null, record),
          ifShow: () => !record.is_active,
        },
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

const formData = reactive<CreatePromptTemplateRequest & UpdatePromptTemplateRequest>({
  business_line_id: null as unknown as number,
  template_code: '',
  name: '',
  template_content: '',
  variables: '',
  version: 1,
  status: 1,
});

const loadDataTable = async (res: any) => {
  return await getPromptTemplateList(res);
};

onMounted(async () => {
  businessLineList.value = await getBusinessLineListRaw();
});

function addTemplate() {
  editId.value = null;
  modalTitle.value = '新增提示词';
  Object.assign(formData, { business_line_id: null, template_code: '', name: '', template_content: '', variables: '', version: 1, status: 1 });
  showModal.value = true;
}

function handleEdit(record: PromptTemplate) {
  editId.value = record.id;
  modalTitle.value = '编辑提示词';
  Object.assign(formData, { business_line_id: record.business_line_id, template_code: record.template_code, name: record.name, template_content: record.template_content, variables: record.variables, version: record.version, status: record.status });
  showModal.value = true;
}

async function submitForm() {
  formLoading.value = true;
  try {
    if (editId.value) {
      await updatePromptTemplate(editId.value, formData);
      message.success('更新成功');
    } else {
      await createPromptTemplate(formData as CreatePromptTemplateRequest);
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

function handleDelete(record: PromptTemplate) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除提示词「${record.name}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deletePromptTemplate(record.id);
        message.success('删除成功');
        await nextTick();
        await actionRef.value?.reload();
      } catch (error) {
        // alova 全局处理器已展示错误信息
      }
    },
  });
}

async function handleActivate(record: PromptTemplate) {
  try {
    await activatePromptTemplate(record.id);
    message.success('激活成功');
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  }
}
</script>

<style lang="less" scoped></style>