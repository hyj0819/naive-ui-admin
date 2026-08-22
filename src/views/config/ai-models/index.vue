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

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle" style="width: 520px;">
      <n-form :model="formData" :label-width="90" label-placement="left">
        <n-form-item label="提供商">
          <n-select 
            v-model:value="formData.provider" 
            placeholder="请选择" 
            :options="providerOptions" 
            @update:value="handleProviderChange"
            clearable
          />
        </n-form-item>

        <n-form-item label="API Key">
          <n-input 
            v-model:value="formData.api_key" 
            :type="apiKeyInputType"
            show-password-on="click"
            :placeholder="apiKeyPlaceholder"
            :input-props="{ autocomplete: 'new-password' }"
          />
        </n-form-item>

        <n-form-item label="API URL">
          <n-input v-model:value="formData.api_url" placeholder="例如：https://api.deepseek.com/v1" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="formLoading" @click="submitForm">
            <template #icon>
              <n-icon v-if="editId">
                <EditOutlined />
              </n-icon>
              <n-icon v-else>
                <PlusOutlined />
              </n-icon>
            </template>
            {{ editId ? '保存修改' : '创建模型' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, nextTick, computed } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { 
  PlusOutlined, 
  EditOutlined
} from '@vicons/antd';
import { getAiModelList, createAiModel, updateAiModel, deleteAiModel, activateAiModel, deactivateAiModel, testAiModel, type AIModel, type CreateAIModelRequest, type UpdateAIModelRequest } from '@/api/config/aiModels';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增模型');
const editId = ref<number | null>(null);
const apiKeyInputType = ref<'password' | 'text'>('password');
const editApiKeyMasked = ref('');

const apiKeyPlaceholder = computed(() => {
  if (editId.value && editApiKeyMasked.value) {
    return `当前: ${editApiKeyMasked.value}（留空表示不修改）`;
  }
  return '请输入API Key';
});

const defaultApiUrls: Record<string, string> = {
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1',
  ollama: 'http://localhost:11434/v1',
  custom: '',
};

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
    title: 'API Key',
    key: 'api_key_masked',
    width: 180,
  },
  {
    title: 'API URL',
    key: 'api_url',
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
          label: '取消激活',
          onClick: handleDeactivate.bind(null, record),
          ifShow: () => !!record.is_active,
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
  api_key: '',
  api_url: '',
});

function handleProviderChange(provider: string) {
  if (provider && defaultApiUrls[provider]) {
    formData.api_url = defaultApiUrls[provider];
  } else {
    formData.api_url = '';
  }
}

function cleanApiUrl(url: string): string {
  return url ? url.replace(/`/g, '').trim() : url;
}

const loadDataTable = async (res: any) => {
  const result = await getAiModelList(res);
  result.list = result.list.map((item: AIModel) => ({
    ...item,
    api_url: item.api_url ? item.api_url.trim().replace(/^`|`$/g, '') : '',
  }));
  return result;
};

function addModel() {
  editId.value = null;
  modalTitle.value = '新增模型';
  apiKeyInputType.value = 'password';
  editApiKeyMasked.value = '';
  Object.assign(formData, {
    provider: '',
    api_key: '',
    api_url: '',
  });
  showModal.value = true;
}

function handleEdit(record: AIModel) {
  editId.value = record.id;
  modalTitle.value = '编辑模型';
  apiKeyInputType.value = 'password';
  editApiKeyMasked.value = record.api_key_masked || '';
  Object.assign(formData, {
    provider: record.provider,
    api_key: '',
    api_url: record.api_url,
  });
  showModal.value = true;
}

async function submitForm() {
  apiKeyInputType.value = 'text';
  await nextTick();
  formLoading.value = true;
  try {
    const submitData: Record<string, any> = { ...formData };
    submitData.api_url = cleanApiUrl(submitData.api_url);

    if (editId.value) {
      if (!submitData.api_key) {
        delete submitData.api_key;
      }
      await updateAiModel(editId.value, submitData as any);
      message.success('更新成功');
    } else {
      await createAiModel(submitData as CreateAIModelRequest);
      message.success('创建成功');
    }
    showModal.value = false;
    await nextTick();
    await actionRef.value?.reload();
  } catch (error: any) {
  } finally {
    formLoading.value = false;
    apiKeyInputType.value = 'password';
  }
}

function handleDelete(record: AIModel) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除模型「${record.provider}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteAiModel(record.id);
        message.success('删除成功');
        await nextTick();
        await actionRef.value?.reload();
      } catch (error) {
      }
    },
  });
}

async function handleActivate(record: AIModel) {
  try {
    await activateAiModel(record.id);
    message.success('激活成功');
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
  }
}

async function handleDeactivate(record: AIModel) {
  try {
    await deactivateAiModel(record.id);
    message.success('已取消激活');
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
  }
}

async function handleTest(record: AIModel) {
  try {
    const response: any = await testAiModel(record.id);
    if (response.success === true) {
      message.success('测试成功');
    } else {
      message.error(response.response || '测试失败');
    }
  } catch (error: any) {
    message.error(error.message || '测试失败');
  }
}
</script>

<style lang="less" scoped>
</style>