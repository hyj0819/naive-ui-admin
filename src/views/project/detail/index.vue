<template>
  <div>
    <!-- 页面头部 -->
    <div class="n-layout-page-header">
      <n-card :bordered="false">
        <n-space align="center" justify="space-between">
          <n-space align="center">
            <n-button text @click="router.push({ name: 'project_business_lines' })">
              <template #icon><n-icon><ArrowLeftOutlined /></n-icon></template>
            </n-button>
            <n-h3 style="margin: 0">{{ projectInfo?.name || '项目详情' }}</n-h3>
            <n-tag v-if="projectInfo" :type="projectInfo.status ? 'success' : 'warning'" size="small">
              {{ projectInfo.status ? '启用' : '禁用' }}
            </n-tag>
            <n-tag v-if="projectInfo" size="small">{{ projectInfo.platform_name }}</n-tag>
          </n-space>
        </n-space>
      </n-card>
    </div>

    <!-- 内容区域 -->
    <n-card :bordered="false" class="mt-4 proCard">
      <n-tabs type="line" animated>
        <!-- Tab 1: 基本信息 -->
        <n-tab-pane name="info" tab="基本信息">
          <n-descriptions label-placement="left" bordered :column="2" v-if="projectInfo">
            <n-descriptions-item label="项目编码">{{ projectInfo.code }}</n-descriptions-item>
            <n-descriptions-item label="项目名称">{{ projectInfo.name }}</n-descriptions-item>
            <n-descriptions-item label="所属应用">{{ projectInfo.platform_name }}</n-descriptions-item>
            <n-descriptions-item label="状态">{{ projectInfo.status ? '启用' : '禁用' }}</n-descriptions-item>
            <n-descriptions-item label="创建时间">{{ projectInfo.created_at }}</n-descriptions-item>
            <n-descriptions-item label="更新时间">{{ projectInfo.updated_at }}</n-descriptions-item>
          </n-descriptions>
        </n-tab-pane>

        <!-- Tab 2: 关键词管理 -->
        <n-tab-pane name="keywords" :tab="`关键词 (${keywordCount})`">
          <n-data-table
            :columns="keywordColumns"
            :data="keywordList"
            :loading="keywordLoading"
            :row-key="(row: Keyword) => row.id"
            size="small"
          />
          <n-space class="mt-3">
            <n-button type="primary" size="small" @click="showKeywordModal = true">
              <template #icon><n-icon><PlusOutlined /></n-icon></template>
              添加关键词
            </n-button>
          </n-space>
        </n-tab-pane>

        <!-- Tab 3: 提示词管理 -->
        <n-tab-pane name="prompts" :tab="`提示词 (${promptCount})`">
          <n-data-table
            :columns="promptColumns"
            :data="promptList"
            :loading="promptLoading"
            :row-key="(row: PromptTemplate) => row.id"
            size="small"
          />
          <n-space class="mt-3">
            <n-button type="primary" size="small" @click="openPromptModal()">
              <template #icon><n-icon><PlusOutlined /></n-icon></template>
              添加提示词
            </n-button>
          </n-space>
        </n-tab-pane>

        <!-- Tab 4: 商家信息 -->
        <n-tab-pane name="business_info" tab="商家信息">
          <n-alert type="info" :bordered="false" class="mb-4">
            维护商家联系信息，创建触达任务时可选择将部分信息附带在消息中发送
          </n-alert>
          <n-form :label-width="120" label-placement="left" style="max-width: 600px">
            <n-form-item label="联系电话">
              <n-input v-model:value="businessProfile.phone" placeholder="手机号码" />
            </n-form-item>
            <n-form-item label="微信号">
              <n-input v-model:value="businessProfile.wechat" placeholder="微信号 / 微信ID" />
            </n-form-item>
            <n-form-item label="店铺名称">
              <n-input v-model:value="businessProfile.shop_name" placeholder="店铺 / 品牌名称" />
            </n-form-item>
            <n-form-item label="店铺地址">
              <n-input v-model:value="businessProfile.shop_address" placeholder="实体店地址" />
            </n-form-item>
            <n-form-item label="独立站地址">
              <n-input v-model:value="businessProfile.site_url" placeholder="独立站 / 官网链接" />
            </n-form-item>
            <n-form-item label=" ">
              <n-button type="primary" :loading="businessProfileSaving" @click="saveBusinessProfile">保存商家信息</n-button>
            </n-form-item>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 添加关键词弹窗 -->
    <n-modal v-model:show="showKeywordModal" preset="dialog" title="添加关键词" :style="{ width: '520px' }">
      <n-form :label-width="100" class="mt-4">
        <n-form-item label="关键词">
          <n-input
            v-model:value="newKeywordsText"
            type="textarea"
            placeholder="每行一个关键词，也可用逗号分隔"
            :rows="5"
          />
        </n-form-item>
        <n-form-item label="优先级">
          <n-input-number v-model:value="newKeywordPriority" :min="0" :max="100" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button ghost @click="showKeywordModal = false">取消</n-button>
          <n-button type="primary" :loading="keywordSubmitting" @click="submitKeywords">提交</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 添加/编辑提示词弹窗 -->
    <n-modal v-model:show="showPromptModal" preset="dialog" :title="promptEditId ? '编辑提示词' : '添加提示词'" :style="{ width: '680px' }">
      <n-form :label-width="100" class="mt-4">
        <n-form-item label="名称">
          <n-input v-model:value="promptFormData.name" placeholder="如：客户筛选-高尔夫" />
        </n-form-item>
        <n-form-item label="模板内容">
          <n-input v-model:value="promptFormData.template_content" type="textarea" :rows="5" placeholder="请输入提示词模板，支持 {variable} 变量" />
        </n-form-item>
        <n-form-item label="变量列表">
          <n-input v-model:value="promptFormData.variables" placeholder="JSON数组，如: ['post_content', 'comment_content']" />
        </n-form-item>
        <n-form-item label="状态" v-if="promptEditId">
          <n-switch v-model:value="promptFormData.status" :checked-value="1" :unchecked-value="0" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button ghost @click="showPromptModal = false">取消</n-button>
          <n-button type="primary" :loading="promptSubmitting" @click="submitPrompt">提交</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, h, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage, useDialog, NButton, NTag } from 'naive-ui';
import { PlusOutlined, ArrowLeftOutlined } from '@vicons/antd';
import { getBusinessLine, type BusinessLine, getBusinessProfile, updateBusinessProfile, type BusinessProfile } from '@/api/config/businessLines';
import { getKeywordList, batchCreateKeywords, deleteKeyword, type Keyword } from '@/api/config/keywords';
import { getPromptTemplateList, createPromptTemplate, updatePromptTemplate, deletePromptTemplate, activatePromptTemplate, type PromptTemplate } from '@/api/config/promptTemplates';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const dialog = useDialog();

const projectId = Number(route.params.id);

// ==================== 项目信息 ====================
const projectInfo = ref<BusinessLine | null>(null);

// ==================== 商家信息 ====================
const businessProfile = ref<BusinessProfile>({
  phone: '',
  wechat: '',
  shop_name: '',
  shop_address: '',
  site_url: '',
});
const businessProfileSaving = ref(false);

async function loadBusinessProfile() {
  try {
    const data = await getBusinessProfile(projectId);
    businessProfile.value = {
      phone: data.phone || '',
      wechat: data.wechat || '',
      shop_name: data.shop_name || '',
      shop_address: data.shop_address || '',
      site_url: data.site_url || '',
    };
  } catch {
    // 首次可能为空，保持默认值
  }
}

async function saveBusinessProfile() {
  businessProfileSaving.value = true;
  try {
    await updateBusinessProfile(projectId, businessProfile.value);
    message.success('商家信息保存成功');
  } catch {
    // handled globally
  } finally {
    businessProfileSaving.value = false;
  }
}

// ==================== 关键词 ====================
const keywordList = ref<Keyword[]>([]);
const keywordLoading = ref(false);
const keywordCount = ref(0);
const showKeywordModal = ref(false);
const newKeywordsText = ref('');
const newKeywordPriority = ref(50);
const keywordSubmitting = ref(false);

const keywordColumns = [
  { title: '关键词', key: 'keyword', width: 250 },
  { title: '优先级', key: 'priority', width: 80 },
  {
    title: '状态', key: 'status', width: 80,
    render(row: Keyword) {
      return h(NTag, { size: 'small', type: row.status ? 'success' : 'warning' }, { default: () => row.status ? '启用' : '禁用' });
    },
  },
  { title: '创建时间', key: 'created_at', width: 160 },
  {
    title: '操作', key: 'action', width: 80,
    render(record: Keyword) {
      return h(NButton, { text: true, type: 'error', size: 'small', onClick: () => handleDeleteKeyword(record) }, { default: () => '删除' });
    },
  },
];

async function loadKeywords() {
  keywordLoading.value = true;
  try {
    const res = await getKeywordList({ business_line_id: projectId, pageSize: 100 });
    keywordList.value = res.list;
    keywordCount.value = res.itemCount;
  } finally {
    keywordLoading.value = false;
  }
}

async function submitKeywords() {
  if (!newKeywordsText.value.trim()) {
    message.warning('请输入关键词');
    return;
  }
  keywordSubmitting.value = true;
  try {
    const keywords = newKeywordsText.value
      .split(/[\n,，]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0);
    const uniqueKeywords = [...new Set(keywords)];
    if (uniqueKeywords.length === 0) {
      message.warning('请输入至少一个关键词');
      keywordSubmitting.value = false;
      return;
    }
    const result = await batchCreateKeywords({
      business_line_id: projectId,
      keywords: uniqueKeywords,
      priority: newKeywordPriority.value,
      status: 1,
    });
    message.success(`成功添加 ${result.created_count} 个关键词`);
    showKeywordModal.value = false;
    newKeywordsText.value = '';
    await loadKeywords();
  } finally {
    keywordSubmitting.value = false;
  }
}

function handleDeleteKeyword(record: Keyword) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除关键词「${record.keyword}」吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deleteKeyword(record.id);
      message.success('删除成功');
      await loadKeywords();
    },
  });
}

// ==================== 提示词 ====================
const promptList = ref<PromptTemplate[]>([]);
const promptLoading = ref(false);
const promptCount = ref(0);
const showPromptModal = ref(false);
const promptEditId = ref<number | null>(null);
const promptSubmitting = ref(false);

const promptFormData = ref({
  name: '',
  template_content: '',
  variables: '',
  status: 1,
});

const promptColumns = [
  { title: '模板编码', key: 'template_code', width: 140 },
  { title: '名称', key: 'name', width: 180 },
  { title: '版本', key: 'version', width: 60 },
  {
    title: '状态', key: 'is_active', width: 80,
    render(row: PromptTemplate) {
      return h(NTag, { size: 'small', type: row.is_active ? 'success' : 'default' }, { default: () => row.is_active ? '已激活' : '未激活' });
    },
  },
  { title: '创建时间', key: 'created_at', width: 160 },
  {
    title: '操作', key: 'action', width: 160,
    render(record: PromptTemplate) {
      const btns = [];
      if (!record.is_active) {
        btns.push(h(NButton, { text: true, type: 'success', size: 'small', onClick: () => handleActivatePrompt(record) }, { default: () => '激活' }));
      }
      btns.push(h(NButton, { text: true, type: 'info', size: 'small', onClick: () => openPromptModal(record) }, { default: () => '编辑' }));
      btns.push(h(NButton, { text: true, type: 'error', size: 'small', onClick: () => handleDeletePrompt(record) }, { default: () => '删除' }));
      return h('div', { style: 'display:flex;gap:8px' }, btns);
    },
  },
];

async function loadPrompts() {
  promptLoading.value = true;
  try {
    const res = await getPromptTemplateList({ business_line_id: projectId, pageSize: 100 });
    promptList.value = res.list;
    promptCount.value = res.itemCount;
  } finally {
    promptLoading.value = false;
  }
}

function openPromptModal(record?: PromptTemplate) {
  if (record) {
    promptEditId.value = record.id;
    promptFormData.value = {
      name: record.name,
      template_content: record.template_content,
      variables: record.variables,
      status: record.status,
    };
  } else {
    promptEditId.value = null;
    promptFormData.value = { name: '', template_content: '', variables: '', status: 1 };
  }
  showPromptModal.value = true;
}

async function submitPrompt() {
  if (!promptFormData.value.name || !promptFormData.value.template_content) {
    message.warning('请填写名称和模板内容');
    return;
  }
  promptSubmitting.value = true;
  try {
    if (promptEditId.value) {
      await updatePromptTemplate(promptEditId.value, {
        ...promptFormData.value,
        business_line_id: projectId,
      });
      message.success('更新成功');
    } else {
      await createPromptTemplate({
        business_line_id: projectId,
        name: promptFormData.value.name,
        template_content: promptFormData.value.template_content,
        variables: promptFormData.value.variables || '[]',
        version: 1,
        status: 1,
      });
      message.success('添加成功');
    }
    showPromptModal.value = false;
    await loadPrompts();
  } finally {
    promptSubmitting.value = false;
  }
}

async function handleActivatePrompt(record: PromptTemplate) {
  await activatePromptTemplate(record.id);
  message.success('激活成功');
  await loadPrompts();
}

function handleDeletePrompt(record: PromptTemplate) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除提示词「${record.name}」吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deletePromptTemplate(record.id);
      message.success('删除成功');
      await loadPrompts();
    },
  });
}

// ==================== 初始化 ====================
onMounted(async () => {
  try {
    const res = await getBusinessLine(projectId) as any;
    projectInfo.value = res?.data || res;
  } catch (e) {
    message.error('项目不存在');
    router.push({ name: 'project_business_lines' });
  }
  await loadKeywords();
  await loadPrompts();
  await loadBusinessProfile();
});
</script>

<style lang="less" scoped></style>
