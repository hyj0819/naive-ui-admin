<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="AI模型管理">
        管理AI模型配置，支持DeepSeek、OpenAI等多种模型
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
          <n-button type="primary" @click="addModel">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增模型
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle">
      <n-form :model="formData" :label-width="100" class="mt-4">
        <n-form-item label="提供商">
          <n-select v-model:value="formData.provider" placeholder="请选择提供商" :options="providerOptions" />
        </n-form-item>
        <n-form-item label="模型名称">
          <n-input v-model:value="formData.model_name" placeholder="请输入模型名称" />
        </n-form-item>
        <n-form-item label="API Key">
          <n-input v-model:value="formData.api_key" type="password" placeholder="请输入API Key" />
        </n-form-item>
        <n-form-item label="基础URL">
          <n-input v-model:value="formData.base_url" placeholder="请输入API基础地址" />
        </n-form-item>
        <n-form-item label="最大Token">
          <n-input-number v-model:value="formData.max_tokens" :min="100" :max="32000" />
        </n-form-item>
        <n-form-item label="温度">
          <n-input-number v-model:value="formData.temperature" :min="0" :max="100" />
        </n-form-item>
        <n-form-item label="Top P">
          <n-input-number v-model:value="formData.top_p" :min="0" :max="100" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="formData.description" type="textarea" :rows="3" />
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
import { getAiModelList, createAiModel, updateAiModel, deleteAiModel, activateAiModel, testAiModel, type AIModel, type CreateAIModelRequest, type UpdateAIModelRequest } from '@/api/config/aiModels';

const message = useMessage();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增模型');
const editId = ref<number | null>(null);

const providerOptions = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Google Gemini', value: 'gemini' },
  { label: 'Ollama', value: 'ollama' },
  { label: '自定义API', value: 'custom' },
];

const columns = [
  {
    title: '提供商',
    key: 'provider',
    width: 120,
    render(row: AIModel) {
      const providerMap: Record<string, string> = {
        deepseek: 'DeepSeek',
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        gemini: 'Google Gemini',
        ollama: 'Ollama',
        custom: '自定义API',
      };
      return providerMap[row.provider] || row.provider;
    },
  },
  {
    title: '模型名称',
    key: 'model_name',
    width: 180,
  },
  {
    title: 'API Key',
    key: 'api_key_masked',
    width: 180,
  },
  {
    title: '基础URL',
    key: 'base_url',
    ellipsis: true,
  },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render(row: AIModel) {
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
  width: 300,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: AIModel) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '激活',
          onClick: handleActivate.bind(null, record),
          ifShow: () => !record.is_active,
        },
        {
          label: '测试连接',
          onClick: handleTest.bind(null, record),
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

const formData = reactive<CreateAIModelRequest & UpdateAIModelRequest>({
  provider: '',
  model_name: '',
  api_key: '',
  base_url: '',
  max_tokens: 2000,
  temperature: 70,
  top_p: 90,
  description: '',
});

const loadDataTable = async (res: any) => {
  return await getAiModelList(res);
};

function addModel() {
  editId.value = null;
  modalTitle.value = '新增模型';
  Object.assign(formData, {
    provider: '',
    model_name: '',
    api_key: '',
    base_url: '',
    max_tokens: 2000,
    temperature: 70,
    top_p: 90,
    description: '',
  });
  showModal.value = true;
}

function handleEdit(record: AIModel) {
  editId.value = record.id;
  modalTitle.value = '编辑模型';
  Object.assign(formData, {
    provider: record.provider,
    model_name: record.model_name,
    api_key: '',
    base_url: record.base_url,
    max_tokens: record.max_tokens,
    temperature: record.temperature,
    top_p: record.top_p,
    description: record.description,
  });
  showModal.value = true;
}

async function submitForm() {
  formLoading.value = true;
  try {
    if (editId.value) {
      await updateAiModel(editId.value, formData);
      message.success('更新成功');
    } else {
      await createAiModel(formData as CreateAIModelRequest);
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

async function handleDelete(record: AIModel) {
  try {
    await deleteAiModel(record.id);
    message.success('删除成功');
    actionRef.value.reload();
  } catch (error) {
    message.error('删除失败');
  }
}

async function handleActivate(record: AIModel) {
  try {
    await activateAiModel(record.id);
    message.success('激活成功');
    actionRef.value.reload();
  } catch (error) {
    message.error('激活失败');
  }
}

async function handleTest(record: AIModel) {
  try {
    await testAiModel(record.id);
    message.success('测试成功');
  } catch (error) {
    message.error('测试失败');
  }
}
</script>

<style lang="less" scoped></style>