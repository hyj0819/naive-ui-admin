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

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle" style="width: 680px;">
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

        <n-form-item label="模型名称">
          <n-input v-model:value="formData.model_name" placeholder="例如：deepseek-chat" />
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

        <n-form-item label="基础URL">
          <n-input v-model:value="formData.base_url" placeholder="例如：https://api.deepseek.com/v1" />
        </n-form-item>

        <n-divider title-placement="left" class="section-divider">
          <n-icon size="14" class="mr-1.5 text-success">
            <SettingOutlined />
          </n-icon>
          模型参数
        </n-divider>

        <n-form-item label="最大Token">
          <n-input-number v-model:value="formData.max_tokens" :min="100" :max="128000" :step="100" />
        </n-form-item>

        <n-form-item label="温度" :show-feedback="false">
          <div class="slider-container">
            <div class="slider-wrap">
              <n-slider v-model:value="formData.temperature" :min="0" :max="100" :step="1" class="slider" />
              <n-input-number 
                v-model:value="formData.temperature" 
                :min="0" 
                :max="100" 
                :step="1"
                class="slider-num"
              />
            </div>
            <div class="slider-hint">
              <span class="hint-left">稳定精确</span>
              <span class="hint-right">随机创意</span>
            </div>
          </div>
        </n-form-item>

        <n-form-item label="Top P" :show-feedback="false">
          <div class="slider-container">
            <div class="slider-wrap">
              <n-slider v-model:value="formData.top_p" :min="0" :max="100" :step="1" class="slider" />
              <n-input-number 
                v-model:value="formData.top_p" 
                :min="0" 
                :max="100" 
                :step="1"
                class="slider-num"
              />
            </div>
            <div class="slider-hint">
              <span class="hint-left">更确定</span>
              <span class="hint-right">更多样</span>
            </div>
          </div>
        </n-form-item>

        <n-divider title-placement="left" class="section-divider">
          <n-icon size="14" class="mr-1.5 text-warning">
            <SettingOutlined />
          </n-icon>
          高级配置
          <n-tag size="small" type="warning" style="margin-left: 8px;">可选</n-tag>
        </n-divider>

        <n-form-item label="描述">
          <n-input v-model:value="formData.description" type="textarea" :rows="3" placeholder="请输入模型描述..." />
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
  SettingOutlined, 
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

const defaultBaseUrls: Record<string, string> = {
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
    title: '描述',
    key: 'description',
    ellipsis: true,
    width: 200,
    render(row: AIModel) {
      return row.description || '-';
    },
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
  model_name: '',
  api_key: '',
  base_url: '',
  max_tokens: 2000,
  temperature: 70,
  top_p: 90,
  description: '',
});

function handleProviderChange(provider: string) {
  if (provider && defaultBaseUrls[provider]) {
    formData.base_url = defaultBaseUrls[provider];
  } else {
    formData.base_url = '';
  }
}

/** 清理 base_url 中的反引号 */
function cleanBaseUrl(url: string): string {
  return url ? url.replace(/`/g, '').trim() : url;
}

const loadDataTable = async (res: any) => {
  const result = await getAiModelList(res);
  result.list = result.list.map((item: AIModel) => ({
    ...item,
    base_url: item.base_url ? item.base_url.trim().replace(/^`|`$/g, '') : '',
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
  apiKeyInputType.value = 'password';
  editApiKeyMasked.value = record.api_key_masked || '';
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
  // 提交前切换为text类型，避免浏览器弹出保存密码提示
  apiKeyInputType.value = 'text';
  await nextTick();
  formLoading.value = true;
  try {
    // 清理 base_url 中的反引号
    const submitData: Record<string, any> = { ...formData };
    submitData.base_url = cleanBaseUrl(submitData.base_url);

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
    // alova 全局处理器已展示错误信息，此处无需重复提示
  } finally {
    formLoading.value = false;
    apiKeyInputType.value = 'password';
  }
}

function handleDelete(record: AIModel) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除模型「${record.provider} / ${record.model_name}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteAiModel(record.id);
        message.success('删除成功');
        await nextTick();
        await actionRef.value?.reload();
      } catch (error) {
        // alova 全局处理器已展示错误信息
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
    // alova 全局处理器已展示错误信息
  }
}

async function handleDeactivate(record: AIModel) {
  try {
    await deactivateAiModel(record.id);
    message.success('已取消激活');
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  }
}

async function handleTest(record: AIModel) {
  try {
    await testAiModel(record.id);
    message.success('测试成功');
  } catch (error) {
    // alova 全局处理器已展示错误信息
  }
}
</script>

<style lang="less" scoped>
.section-divider {
  margin: 12px 0;
}

.slider-container {
  width: 100%;
}

.slider-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.slider-wrap .slider {
  flex: 1;
  min-width: 80px;
}

.slider-wrap .slider-num {
  width: 80px;
  flex-shrink: 0;
}

.slider-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 2px;
  line-height: 1.2;
}

.slider-hint .hint-left,
.slider-hint .hint-right {
  font-size: 12px;
  color: #999;
}
</style>