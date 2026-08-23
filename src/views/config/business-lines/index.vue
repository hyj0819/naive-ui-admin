<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="项目管理">
        管理各应用下的项目配置，创建项目时可同步配置关键词和提示词
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
          <n-button type="primary" @click="addBusinessLine">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增项目
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <!-- 新增项目向导 -->
    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle" :style="{ width: '680px' }" :mask-closable="false">
      <n-steps :current="currentStep" size="small" class="mt-2 mb-4">
        <n-step title="基本信息" />
        <n-step title="关键词配置" />
        <n-step title="提示词配置" />
      </n-steps>

      <!-- 步骤1: 基本信息 -->
      <n-form v-if="currentStep === 1" :model="formData" :label-width="100">
        <n-form-item label="所属应用">
          <n-select v-model:value="formData.platform_id" placeholder="请选择应用" :options="applicationOptions" />
        </n-form-item>
        <n-form-item label="项目名称">
          <n-input v-model:value="formData.name" placeholder="请输入项目名称" />
        </n-form-item>
        <n-form-item label="状态">
          <n-switch v-model:value="formData.status" :checked-value="1" :unchecked-value="0" />
        </n-form-item>
      </n-form>

      <!-- 步骤2: 关键词配置 -->
      <div v-if="currentStep === 2">
        <n-alert type="info" :bordered="false" class="mb-3">
          为项目配置搜索关键词，每行一个。此步骤可跳过，稍后在「关键词管理」中配置。
        </n-alert>
        <n-input
          v-model:value="wizardKeywords"
          type="textarea"
          placeholder="每行一个关键词，例如：&#10;golf simulator&#10;indoor golf&#10;launch monitor"
          :rows="6"
        />
      </div>

      <!-- 步骤3: 提示词配置 -->
      <div v-if="currentStep === 3">
        <n-alert type="info" :bordered="false" class="mb-3">
          为项目配置 AI 提示词模板。此步骤可跳过，稍后在「提示词管理」中配置。
        </n-alert>
        <n-card v-for="(tpl, index) in wizardPrompts" :key="index" :bordered="true" class="mb-3" size="small">
          <template #header>
            <n-space align="center">
              <span>提示词 {{ index + 1 }}</span>
              <n-button text type="error" size="small" @click="removeWizardPrompt(index)">删除</n-button>
            </n-space>
          </template>
          <n-form :label-width="80">
            <n-form-item label="名称">
              <n-input v-model:value="tpl.name" placeholder="如：客户筛选-高尔夫" />
            </n-form-item>
            <n-form-item label="模板内容">
              <n-input v-model:value="tpl.template_content" type="textarea" :rows="4" placeholder="请输入提示词模板，支持 {variable} 变量" />
            </n-form-item>
            <n-form-item label="变量">
              <n-input v-model:value="tpl.variables" placeholder="JSON数组，如: ['post_content', 'comment_content']" />
            </n-form-item>
          </n-form>
        </n-card>
        <n-button dashed block @click="addWizardPrompt">
          <template #icon><n-icon><PlusOutlined /></n-icon></template>
          添加提示词模板
        </n-button>
      </div>

      <template #action>
        <n-space justify="space-between" class="w-full">
          <n-button v-if="currentStep > 1" @click="currentStep--">
            ← 上一步
          </n-button>
          <span v-else />
          <n-space>
            <n-button @click="showModal = false">取消</n-button>
            <n-button v-if="currentStep < 3" ghost type="info" @click="skipAndFinish">
              跳过，直接创建
            </n-button>
            <n-button v-if="currentStep < 3" type="info" @click="currentStep++">
              下一步 →
            </n-button>
            <n-button v-if="currentStep === 3" type="primary" :loading="formLoading" @click="finishWizard">
              ✓ 完成创建
            </n-button>
          </n-space>
        </n-space>
      </template>
    </n-modal>

    <!-- 编辑项目弹窗 -->
    <n-modal v-model:show="showEditModal" :show-icon="false" preset="dialog" :title="'编辑项目'">
      <n-form :model="editFormData" :label-width="100" class="mt-4">
        <n-form-item label="所属应用">
          <n-select v-model:value="editFormData.platform_id" placeholder="请选择应用" :options="applicationOptions" />
        </n-form-item>
        <n-form-item label="项目名称">
          <n-input v-model:value="editFormData.name" placeholder="请输入项目名称" />
        </n-form-item>
        <n-form-item label="状态">
          <n-switch v-model:value="editFormData.status" :checked-value="1" :unchecked-value="0" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showEditModal = false">取消</n-button>
          <n-button type="primary" :loading="editFormLoading" @click="submitEditForm">提交</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, computed, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage, useDialog } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import { getBusinessLineList, createBusinessLine, updateBusinessLine, deleteBusinessLine, type BusinessLine, type CreateBusinessLineRequest, type UpdateBusinessLineRequest } from '@/api/config/businessLines';
import { getPlatformListRaw, type Platform } from '@/api/config/platforms';
import { batchCreateKeywords } from '@/api/config/keywords';
import { createPromptTemplate } from '@/api/config/promptTemplates';

const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const actionRef = ref();

// ==================== 列表相关 ====================
const applicationList = ref<Platform[]>([]);
const applicationOptions = computed(() => applicationList.value.map(p => ({ label: p.name, value: p.id })));

const columns = [
  { title: '项目编码', key: 'code', width: 120 },
  { title: '项目名称', key: 'name', width: 150 },
  { title: '所属应用', key: 'platform_name', width: 120 },
  {
    title: '状态', key: 'status', width: 100,
    render(row: BusinessLine) { return row.status ? '启用' : '禁用'; },
  },
  { title: '创建时间', key: 'created_at', width: 160 },
];

const actionColumn = reactive({
  width: 240,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: BusinessLine) {
    return h(TableAction, {
      style: 'button',
      actions: [
        { label: '配置', onClick: () => router.push({ name: 'project_detail', params: { id: record.id } }) },
        { label: '编辑', onClick: () => handleEdit(record) },
        { label: '删除', onClick: () => handleDelete(record) },
      ],
    });
  },
});

const loadDataTable = async (res: any) => getBusinessLineList(res);

onMounted(async () => {
  applicationList.value = await getPlatformListRaw();
});

// ==================== 新增向导 ====================
const showModal = ref(false);
const currentStep = ref(1);
const formLoading = ref(false);

const formData = reactive<CreateBusinessLineRequest>({
  platform_id: null as unknown as number,
  name: '',
  status: 1,
});

const wizardKeywords = ref('');
const wizardPrompts = ref<Array<{ name: string; template_content: string; variables: string }>>([]);

function addWizardPrompt() {
  wizardPrompts.value.push({ name: '', template_content: '', variables: '' });
}

function removeWizardPrompt(index: number) {
  wizardPrompts.value.splice(index, 1);
}

function resetWizard() {
  currentStep.value = 1;
  Object.assign(formData, { platform_id: null, name: '', status: 1 });
  wizardKeywords.value = '';
  wizardPrompts.value = [];
}

function addBusinessLine() {
  resetWizard();
  showModal.value = true;
}

async function skipAndFinish() {
  formLoading.value = true;
  try {
    const result = await createBusinessLine(formData) as any;
    message.success('项目创建成功');
    showModal.value = false;
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  } finally {
    formLoading.value = false;
  }
}

async function finishWizard() {
  formLoading.value = true;
  try {
    // 1. 创建项目
    const result = await createBusinessLine(formData) as any;
    const projectId = result?.id ?? result?.data?.id;

    if (!projectId) {
      message.error('项目创建失败，无法获取项目ID');
      formLoading.value = false;
      return;
    }

    // 2. 批量创建关键词
    if (wizardKeywords.value.trim()) {
      const keywords = wizardKeywords.value
        .split(/[\n,，]+/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
      const uniqueKeywords = [...new Set(keywords)];
      if (uniqueKeywords.length > 0) {
        try {
          await batchCreateKeywords({
            business_line_id: projectId,
            keywords: uniqueKeywords,
            priority: 0,
            status: 1,
          });
        } catch (e) {
          // 关键词创建失败不阻塞整体流程
        }
      }
    }

    // 3. 创建提示词模板
    for (const tpl of wizardPrompts.value) {
      if (tpl.name && tpl.template_content) {
        try {
          await createPromptTemplate({
            business_line_id: projectId,
            name: tpl.name,
            template_content: tpl.template_content,
            variables: tpl.variables || '[]',
            version: 1,
            status: 1,
          });
        } catch (e) {
          // 提示词创建失败不阻塞整体流程
        }
      }
    }

    message.success('项目创建成功！');
    showModal.value = false;
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  } finally {
    formLoading.value = false;
  }
}

// ==================== 编辑项目 ====================
const showEditModal = ref(false);
const editFormLoading = ref(false);
const editId = ref<number | null>(null);
const editFormData = reactive<UpdateBusinessLineRequest>({
  platform_id: null as unknown as number,
  name: '',
  status: 1,
});

function handleEdit(record: BusinessLine) {
  editId.value = record.id;
  Object.assign(editFormData, { platform_id: record.platform_id, name: record.name, status: record.status });
  showEditModal.value = true;
}

async function submitEditForm() {
  editFormLoading.value = true;
  try {
    await updateBusinessLine(editId.value!, editFormData);
    message.success('更新成功');
    showEditModal.value = false;
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  } finally {
    editFormLoading.value = false;
  }
}

// ==================== 删除项目 ====================
function handleDelete(record: BusinessLine) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除项目「${record.name}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteBusinessLine(record.id);
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
