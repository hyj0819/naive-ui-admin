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

      <!-- 步骤 2: 关键词配置 -->
      <div v-if="currentStep === 2">
        <n-alert type="info" :bordered="false" class="mb-3">
          <template #header>
            <n-space align="center">
              <span style="font-weight: 500">🔍 关键词配置说明</span>
            </n-space>
          </template>
          <div style="margin-top: 8px; line-height: 1.6;">
            <p style="margin: 0 0 8px 0"><strong>📌 作用：</strong>系统会使用这些关键词在平台上搜索相关内容和用户，帮助你发现和触达潜在客户。</p>
            <p style="margin: 0 0 8px 0"><strong>⚙️ 工作原理：</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>系统会按照关键词优先级（数字越大优先级越高）进行搜索</li>
              <li>优先匹配高优先级的关键词内容</li>
              <li>搜索结果将用于后续的客户筛选和触达任务</li>
            </ul>
            <p style="margin: 0 0 8px 0"><strong>📝 格式要求：</strong>每行一个关键词，也可以使用英文逗号 (,) 或中文逗号 (，) 分隔。</p>
            <p style="margin: 0 0 8px 0"><strong>💡 优化建议：</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>建议配置 10-50 个精准关键词，覆盖目标客户可能使用的所有表达方式</li>
              <li>包含核心产品词、场景词、痛点词等多种类型</li>
              <li>可以配置一些长尾关键词提高精准度</li>
              <li>优先考虑用户在高价值内容中可能使用的词汇</li>
            </ul>
            <p style="margin: 0 0 8px 0"><strong>📋 示例：</strong></p>
            <pre style="background: #f0f7ff; padding: 12px; border-radius: 6px; margin-top: 8px; font-size: 13px; color: #333; overflow-x: auto; border: 1px solid #d6e4f0;">golf simulator    # 室内高尔夫模拟器
indoor golf       # 室内高尔夫
launch monitor    # 发射监测器
golf equipment    # 高尔夫设备
golf fitting      # 高尔夫挥杆分析
simulator rental  # 模拟器租赁</pre>
            <p style="margin-top: 8px; font-size: 13px; color: #1890ff; background: #e6f7ff; padding: 8px 12px; border-radius: 4px;">💎 小贴士：对于高尔夫行业，建议同时关注专业玩家和休闲爱好者都可能使用的词汇组合。</p>
          </div>
        </n-alert>
        <n-input
          v-model:value="wizardKeywords"
          type="textarea"
          placeholder="每行一个关键词，例如：&#10;golf simulator&#10;indoor golf&#10;launch monitor&#10;室内高尔夫模拟器"
          :rows="8"
        />
      </div>

      <!-- 步骤 3: 提示词配置 -->
      <div v-if="currentStep === 3">
        <n-alert type="info" :bordered="false" class="mb-3">
          <template #header>
            <n-space align="center">
              <span style="font-weight: 500">📝 提示词配置说明</span>
            </n-space>
          </template>
          <div style="margin-top: 8px; line-height: 1.6;">
            <p style="margin: 0 0 8px 0"><strong>📌 作用：</strong>定义 AI 如何处理采集到的数据和用户行为，包括客户质量评估、兴趣判断、回复策略、触达话术等智能化决策。</p>
            <p style="margin: 0 0 8px 0"><strong>⚙️ 核心功能：</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>客户筛选：</strong>评估潜在客户的价值和匹配度</li>
              <li><strong>兴趣识别：</strong>分析用户对产品的兴趣程度</li>
              <li><strong>自动回复：</strong>根据场景智能生成回复内容</li>
              <li><strong>触达策略：</strong>制定最佳的联系时机和话术</li>
            </ul>
            <p style="margin: 0 0 8px 0"><strong>🔧 变量用法：</strong>使用 <code>{variable}</code> 格式的占位符，系统会在运行时自动替换为实际数据。</p>
            <p style="margin: 0 0 8px 0"><strong>💡 优化建议：</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>每个项目建议配置 2-5 个不同场景的提示词模板</li>
              <li>涵盖客户筛选、兴趣判断、自动回复、私信触达等关键场景</li>
              <li>使用清晰的结构化语言描述逻辑</li>
              <li>考虑不同用户类型的差异化策略</li>
              <li>结合平台特性制定合适的触达方式</li>
            </ul>
            <p style="margin: 0 0 8px 0"><strong>📋 完整示例：</strong></p>
            <pre style="background: #f6ffed; padding: 12px; border-radius: 6px; margin-top: 8px; font-size: 13px; color: #333; overflow-x: auto; border: 1px solid #d9f7be;"><strong>名称：</strong>客户筛选 - 高尔夫爱好者

<strong>变量列表：</strong>["post_content", "comment_content", "user_profile", "engagement_score"]

<strong>提示词模板：</strong>
你是一名高尔夫行业专家助手。请分析以下内容:

【内容分析】
1. 如果内容涉及以下领域，标记为「高度感兴趣」：
   - 室内高尔夫模拟器、发射监测器等设备
   - 高尔夫挥杆分析、技巧提升
   - 高尔夫球场、练习场相关信息

2. 如果仅提及「喜欢打高尔夫」等泛泛表达，标记为「一般兴趣」

3. 如果完全没有高尔夫相关内容，标记为「不相关」

【输出格式】
{
  "interest_level": "high/medium/low",
  "reasoning": "简短说明判断依据",
  "priority_score": 0-100 之间的数字
}</pre>
            <p style="margin-top: 8px; font-size: 13px; color: #722ed1; background: #fff0ff; padding: 8px 12px; border-radius: 4px;">🎯 进阶提示：你可以配置多个提示词模板来处理不同的业务场景，比如「客户筛选」、「自动回复」「触达策略」等。</p>
          </div>
        </n-alert>
        
        <div v-if="wizardPrompts.length === 0" class="mb-3" style="text-align: center; padding: 24px; background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 8px;">
          <span style="color: #999; font-size: 14px;">✨ 还没有添加提示词模板</span>
          <div style="margin-top: 8px; font-size: 12px; color: #bbb;">点击下方按钮开始添加第一个模板</div>
        </div>
        
        <n-card v-for="(tpl, index) in wizardPrompts" :key="index" :bordered="true" class="mb-3" size="small" :title="`${index + 1}. ${tpl.name || '未命名模板'}`">
          <template #extra>
            <n-button text type="error" size="small" @click="removeWizardPrompt(index)">
              <template #icon><n-icon><CloseOutlined /></n-icon></template>
              删除
            </n-button>
          </template>
          <n-form :label-width="80">
            <n-form-item label="名称">
              <n-input 
                v-model:value="tpl.name" 
                placeholder="如：客户筛选 - 高尔夫 / 自动回复 - 询价"
              />
            </n-form-item>
            <n-form-item label="变量">
              <n-input 
                v-model:value="tpl.variables" 
                placeholder="JSON 数组，如：['post_content', 'comment_content', 'user_profile']"
              />
            </n-form-item>
            <n-form-item label="模板内容">
              <n-input 
                v-model:value="tpl.template_content" 
                type="textarea" 
                :rows="6" 
                placeholder="请输入详细的提示词逻辑描述\n\n示例结构:\n1. 分析对象\n2. 判断规则\n3. 输出格式\n4. 特殊情况处理"
              />
            </n-form-item>
            <n-alert type="success" :bordered="false" style="margin-top: 8px; font-size: 12px;">
              💡 提示：描述越具体详细，AI 的处理效果越好。建议使用结构化语言，分步骤说明逻辑。
            </n-alert>
          </n-form>
        </n-card>
        <n-button dashed block type="primary" @click="addWizardPrompt">
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
import { PlusOutlined, CloseOutlined } from '@vicons/antd';
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
        { label: '配置', onClick: () => router.push({ name: 'project_detail', params: { id: record.id } }), type: 'primary' }, // Primary 色
        { label: '编辑', onClick: () => handleEdit(record), type: 'info' }, // Info 色
        { label: '删除', onClick: () => handleDelete(record), type: 'error' }, // Error 色
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

const modalTitle = computed(() => {
  const titles = ['基本信息', '关键词配置', '提示词配置'];
  return `新增项目 - ${titles[currentStep.value - 1]}`;
});

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
