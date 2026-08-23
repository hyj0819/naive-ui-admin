<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="创建任务">
        创建爬虫或触达任务，系统将根据平台规则自动选择最佳触达方式
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <!-- 步骤条 -->
      <n-steps :current="currentStep" size="small" class="mb-6">
        <n-step title="选择目标" />
        <n-step title="配置参数" />
      </n-steps>

      <!-- 步骤一：选择目标 -->
      <div v-if="currentStep === 1" class="type-cards">
        <n-card
          v-for="item in taskTypes"
          :key="item.value"
          hoverable
          class="type-card"
          :class="{ selected: selectedType === item.value }"
          @click="selectedType = item.value"
        >
          <div class="type-card-inner">
            <n-icon size="32" :color="selectedType === item.value ? '#18a058' : '#999'">
              <component :is="item.icon" />
            </n-icon>
            <h3>{{ item.label }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </n-card>
      </div>

      <!-- 步骤二：配置参数 -->
      <div v-if="currentStep === 2">
        <!-- 爬虫任务配置 -->
        <n-form v-if="selectedType === 'scrape'" :label-width="120" label-placement="left">
          <n-form-item label="所属项目" required>
            <n-select
              v-model:value="scrapeForm.business_line_id"
              placeholder="请选择项目"
              :options="businessLineOptions"
              @update:value="onBusinessLineChange"
            />
          </n-form-item>
          <n-form-item label="关键词" v-if="scrapeForm.business_line_id">
            <div class="field-block">
              <n-space v-if="availableKeywords.length" size="small" class="mt-1">
                <n-tag v-for="kw in availableKeywords" :key="kw.id" size="small">
                  {{ kw.keyword }}
                </n-tag>
              </n-space>
              <span v-else class="form-help">该项目暂无已配置的关键词，请先在项目中心添加</span>
            </div>
          </n-form-item>
          <n-form-item label="筛选提示词" v-if="scrapeForm.business_line_id">
            <div class="field-block">
              <n-tag v-if="activePrompt" size="small" type="success">
                {{ activePrompt.name }} (v{{ activePrompt.version }})
              </n-tag>
              <span v-else class="form-help">该项目暂无已激活的提示词模板，将使用系统默认筛选逻辑</span>
            </div>
          </n-form-item>
          <n-form-item label="内容类型" required>
            <div class="field-block">
              <n-checkbox-group v-model:value="scrapeForm.content_types">
                <n-space>
                  <n-checkbox value="video">视频</n-checkbox>
                  <n-checkbox value="comment">评论</n-checkbox>
                  <n-checkbox value="post" :disabled="true">帖子 <span class="text-gray-400 text-xs">（暂不支持）</span></n-checkbox>
                </n-space>
              </n-checkbox-group>
              <div class="form-help mt-1">采集时命中的内容形式，至少选择一项</div>
            </div>
          </n-form-item>
          <n-form-item label="每视频评论上限" v-if="scrapeForm.content_types.includes('comment')">
            <div class="field-block">
              <n-input-number v-model:value="scrapeForm.max_comments_per_video" :min="0" :max="500" style="width: 200px" />
              <div class="form-help mt-1">0=不限制；测试时填小值，例如 5</div>
            </div>
          </n-form-item>
          <n-form-item label="最大采集数/关键词">
            <div class="field-block">
              <n-input-number v-model:value="scrapeForm.max_items_per_keyword" :min="1" :max="500" style="width: 200px" />
              <div class="form-help mt-1">预计采集总量约 {{ scrapeForm.keywords.length * scrapeForm.max_items_per_keyword }} 条</div>
            </div>
          </n-form-item>
          <n-form-item label="排除作者">
            <n-switch v-model:value="scrapeForm.exclude_author" />
          </n-form-item>
          <n-form-item label="执行账号">
            <div class="field-block">
              <n-select
                v-model:value="scrapeForm.account_id"
                placeholder="选择执行此任务的浏览器账号"
                :options="accountOptions"
                clearable
              />
              <div class="form-help mt-1">选择已配置的指纹浏览器账号，任务将使用该浏览器环境执行</div>
            </div>
          </n-form-item>
        </n-form>

        <!-- 触达任务配置 -->
        <n-form v-if="selectedType === 'reach'" :label-width="120" label-placement="left">
          <n-form-item label="所属项目" required>
            <n-select
              v-model:value="reachForm.business_line_id"
              placeholder="请选择项目"
              :options="businessLineOptions"
              @update:value="onReachBusinessLineChange"
            />
          </n-form-item>
          <n-form-item label="目标用户" required v-if="reachForm.business_line_id">
            <div class="field-block" style="width: 100%">
              <div class="flex items-center justify-between mb-2">
                <n-space>
                  <n-radio-group v-model:value="contactFilter" size="small" @update:value="loadReachContacts">
                    <n-radio-button value="all">全部</n-radio-button>
                    <n-radio-button value="pending">待联系</n-radio-button>
                    <n-radio-button value="contacted">已联系</n-radio-button>
                  </n-radio-group>
                </n-space>
                <n-space>
                  <n-button size="small" @click="selectAllContacts">全选当前页</n-button>
                  <n-text depth="3">已选 {{ reachForm.target_contact_ids.length }} 人</n-text>
                </n-space>
              </div>
              <n-data-table
                :columns="contactColumns"
                :data="contactTableData"
                :row-key="(row: Contact) => row.id"
                @update:checked-row-keys="onContactCheck"
                :checked-row-keys="reachForm.target_contact_ids"
                :bordered="true"
                size="small"
                :pagination="{ pageSize: 10 }"
                max-height="320"
                virtual-scroll
              />
              <div class="form-help mt-1" v-if="contactTableData.length === 0">
                该项目暂无可触达的联系人
              </div>
            </div>
          </n-form-item>
          <n-form-item label="消息模式">
            <n-radio-group v-model:value="reachForm.message_mode">
              <n-space>
                <n-radio value="personalized">个性化生成</n-radio>
                <n-radio value="fixed">固定话术</n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
          <n-form-item v-if="reachForm.message_mode === 'fixed'" label="固定话术">
            <n-input v-model:value="reachForm.fixed_message" type="textarea" :rows="3" placeholder="输入固定消息内容" />
          </n-form-item>
          <n-form-item label="附带商家信息" v-if="reachForm.business_line_id">
            <div class="field-block">
              <n-radio-group v-model:value="reachForm.include_business_info">
                <n-space>
                  <n-radio :value="false">不附带</n-radio>
                  <n-radio :value="true">附带</n-radio>
                </n-space>
              </n-radio-group>
              <div v-if="reachForm.include_business_info && hasBusinessProfile" class="mt-2">
                <div class="form-help mb-1">选择需要附带的字段：</div>
                <n-checkbox-group v-model:value="reachForm.business_info_fields">
                  <n-space>
                    <n-checkbox value="phone" :disabled="!businessProfile.phone">联系电话</n-checkbox>
                    <n-checkbox value="wechat" :disabled="!businessProfile.wechat">微信号</n-checkbox>
                    <n-checkbox value="shop_name" :disabled="!businessProfile.shop_name">店铺名称</n-checkbox>
                    <n-checkbox value="shop_address" :disabled="!businessProfile.shop_address">店铺地址</n-checkbox>
                    <n-checkbox value="site_url" :disabled="!businessProfile.site_url">独立站地址</n-checkbox>
                  </n-space>
                </n-checkbox-group>
                <div class="form-help mt-1" v-if="reachForm.business_info_fields.length > 0">
                  预览：消息末尾将附上 {{ fieldLabels(reachForm.business_info_fields) }}
                </div>
              </div>
              <div v-if="reachForm.include_business_info && !hasBusinessProfile" class="form-help mt-1" style="color: #f0a020">
                该项目尚未配置商家信息，请先在「项目中心 → 配置 → 商家信息」中维护
              </div>
            </div>
          </n-form-item>
          <n-form-item label="执行账号">
            <div class="field-block">
              <n-select
                v-model:value="reachForm.account_id"
                placeholder="选择执行此任务的浏览器账号"
                :options="accountOptions"
                clearable
              />
            </div>
          </n-form-item>
        </n-form>

        <!-- 可折叠配置摘要 -->
        <n-collapse class="mt-4 mb-4" :default-expanded-names="[]">
          <n-collapse-item title="配置摘要" name="summary">
            <n-descriptions bordered :column="1" label-placement="left" size="small">
              <n-descriptions-item label="任务目标">{{ typeLabel }}</n-descriptions-item>
              <n-descriptions-item label="所属项目">{{ businessLinePreview }}</n-descriptions-item>
              <n-descriptions-item v-if="selectedType === 'scrape'" label="关键词">
                {{ scrapeForm.keywords.join('、') || '-' }}（{{ scrapeForm.keywords.length }} 个）
              </n-descriptions-item>
              <n-descriptions-item v-if="selectedType === 'scrape'" label="内容类型">
                {{ scrapeContentTypesLabel }}
              </n-descriptions-item>
              <n-descriptions-item v-if="selectedType === 'scrape'" label="预计采集量">
                {{ scrapeForm.keywords.length * scrapeForm.max_items_per_keyword }} 条
              </n-descriptions-item>
              <n-descriptions-item v-if="selectedType === 'reach'" label="目标用户">
                {{ reachForm.target_contact_ids.length }} 人
              </n-descriptions-item>
              <n-descriptions-item v-if="selectedType === 'reach'" label="消息模式">
                {{ reachForm.message_mode === 'personalized' ? '个性化生成（AI 自动）' : '固定话术' }}
              </n-descriptions-item>
              <n-descriptions-item v-if="selectedType === 'reach'" label="附带商家信息">
                {{ reachForm.include_business_info && reachForm.business_info_fields?.length ? fieldLabels(reachForm.business_info_fields) : '不附带' }}
              </n-descriptions-item>
            </n-descriptions>
          </n-collapse-item>
        </n-collapse>
      </div>

      <!-- 底部操作按钮 -->
      <div class="mt-4 flex items-center justify-between footer-bar">
        <span class="valid-tip">{{ currentStep === 2 ? validationTip : '' }}</span>
        <n-space>
          <n-button @click="goBack">取消</n-button>
          <n-button v-if="currentStep > 1" @click="currentStep--">上一步</n-button>
          <n-button v-if="currentStep < 2" type="primary" :disabled="!canNext" @click="currentStep++">
            下一步
          </n-button>
          <n-button v-if="currentStep === 2" type="primary" :loading="loading" :disabled="!canSubmit" @click="submitTask">
            启动任务
          </n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted, h } from 'vue';
import { useMessage, NTag } from 'naive-ui';
import { useRouter } from 'vue-router';
import {
  createScrapeTask,
  createReachTask,
  type CreateScrapeTaskRequest,
  type CreateReachTaskRequest,
} from '@/api/tasks';
import { getBusinessLineListRaw, getBusinessProfile, type BusinessLine, type BusinessProfile } from '@/api/config/businessLines';
import { getKeywordList, type Keyword } from '@/api/config/keywords';
import { getPromptTemplateList, type PromptTemplate } from '@/api/config/promptTemplates';
import { getContactList, type Contact } from '@/api/contacts';
import { getAccountList, type Account } from '@/api/system/accounts';
import {
  BugOutlined,
  MessageOutlined,
} from '@vicons/antd';

const router = useRouter();
const message = useMessage();
const loading = ref(false);
const currentStep = ref(1);
const selectedType = ref('scrape');

// 数据源
const businessLineList = ref<BusinessLine[]>([]);
const keywordList = ref<Keyword[]>([]);
const promptList = ref<PromptTemplate[]>([]);
const accountList = ref<Account[]>([]);

const taskTypes = [
  { value: 'scrape', label: '采集内容', desc: '搜索关键词，AI 筛选潜在客户', icon: BugOutlined },
  { value: 'reach', label: '触达用户', desc: '联系已采集的潜在客户，系统自动选择最佳方式', icon: MessageOutlined },
];

// 表单数据
const scrapeForm = reactive<CreateScrapeTaskRequest>({
  task_name: '',
  business_line_id: null as unknown as number,
  keywords: [],
  content_types: ['video', 'comment'],
  max_items_per_keyword: 50,
  max_comments_per_video: 0,
  timeout_seconds: 60,
  ai_filter_enabled: true,
  ai_prompt_template_id: undefined,
  exclude_author: true,
  account_id: undefined,
});

const reachForm = reactive<CreateReachTaskRequest>({
  task_name: '',
  business_line_id: null as unknown as number,
  target_contact_ids: [],
  message_mode: 'personalized',
  fixed_message: '',
  include_business_info: false,
  business_info_fields: [],
});

// 商家信息
const businessProfile = ref<BusinessProfile>({});
const hasBusinessProfile = computed(() => {
  const p = businessProfile.value;
  return !!(p.phone || p.wechat || p.shop_name || p.shop_address || p.site_url);
});

const bizFieldLabelMap: Record<string, string> = {
  phone: '联系电话',
  wechat: '微信号',
  shop_name: '店铺名称',
  shop_address: '店铺地址',
  site_url: '独立站地址',
};

function fieldLabels(fields: string[]) {
  return (fields || []).map(f => bizFieldLabelMap[f] || f).join('、');
}

// 计算属性
const businessLineOptions = computed(() =>
  businessLineList.value.map((bl) => ({
    label: `${bl.platform_name}-${bl.name}`,
    value: bl.id,
  }))
);

const availableKeywords = computed(() =>
  keywordList.value.filter((k) => k.status === 1)
);

const activePrompt = computed(() =>
  promptList.value.find((p) => p.is_active === 1 && p.status === 1)
);

// ─── 联系人表格（触达任务） ────────────────────────────
const contactFilter = ref<string>('pending');
const contactTableData = ref<Contact[]>([]);

const contactStatusMap: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' }> = {
  pending: { label: '待联系', type: 'warning' },
  contacted: { label: '已联系', type: 'info' },
  converted: { label: '已转化', type: 'success' },
};

const contactColumns = [
  { type: 'selection' as const },
  { title: '用户名', key: 'username', width: 140, ellipsis: { tooltip: true }, render(row: Contact) { return row.username || row.platform_user_id; } },
  { title: '状态', key: 'contact_status', width: 90, render(row: Contact) { const s = contactStatusMap[row.contact_status] || { label: row.contact_status, type: 'default' as const }; return h(NTag, { size: 'small', type: s.type, round: true }, () => s.label); } },
  { title: '来源关键词', key: 'source_keyword', width: 140, ellipsis: { tooltip: true }, render(row: Contact) { try { return JSON.parse(row.metadata || '{}').source_keyword || '-'; } catch { return '-'; } } },
  { title: '添加时间', key: 'created_at', width: 110, render(row: Contact) { return row.created_at?.slice(0, 10) || '-'; } },
];

function onContactCheck(keys: number[]) {
  reachForm.target_contact_ids = keys;
}

function selectAllContacts() {
  reachForm.target_contact_ids = contactTableData.value.map(c => c.id);
}

async function loadReachContacts() {
  if (!reachForm.business_line_id) return;
  const params: any = { business_line_id: reachForm.business_line_id, pageSize: 200 };
  if (contactFilter.value !== 'all') params.contact_status = contactFilter.value;
  const res = await getContactList(params);
  contactTableData.value = res.list;
  // 默认全选 pending 状态
  if (reachForm.target_contact_ids.length === 0) {
    reachForm.target_contact_ids = contactTableData.value
      .filter(c => c.contact_status === 'pending')
      .map(c => c.id);
  }
}

const accountOptions = computed(() =>
  accountList.value
    .filter((a) => a.status === 1)
    .map((a) => ({
      label: `${a.account_name}${a.browser_id ? ` (${a.platform_name})` : ''}`,
      value: a.id,
    }))
);

const typeLabel = computed(() => taskTypes.find((t) => t.value === selectedType.value)?.label || '');
const businessLinePreview = computed(() => {
  const blId = selectedType.value === 'scrape'
    ? scrapeForm.business_line_id
    : reachForm.business_line_id;
  const bl = businessLineList.value.find((b) => b.id === blId);
  return bl ? `${bl.platform_name}/${bl.name}` : '-';
});

// 内容类型中文展示
const contentTypeLabelMap: Record<string, string> = { video: '视频', comment: '评论', post: '帖子' };
const scrapeContentTypesLabel = computed(
  () => scrapeForm.content_types.map((t) => contentTypeLabelMap[t] || t).join('、') || '未选择'
);

const canNext = computed(() => {
  if (currentStep.value === 1) return !!selectedType.value;
  return true;
});

const canSubmit = computed(() => {
  if (selectedType.value === 'scrape') {
    return scrapeForm.business_line_id > 0 && scrapeForm.keywords.length > 0 && scrapeForm.content_types.length > 0;
  }
  if (selectedType.value === 'reach') {
    return reachForm.business_line_id > 0 && reachForm.target_contact_ids.length > 0;
  }
  return false;
});

const validationTip = computed(() => {
  if (currentStep.value !== 2) return '';
  if (selectedType.value === 'scrape') {
    if (!scrapeForm.business_line_id) return '请先选择项目';
    if (scrapeForm.keywords.length === 0) return '该项目暂无关键词，请先在项目中心配置';
    if (scrapeForm.content_types.length === 0) return '请至少选择一种内容类型';
  } else if (selectedType.value === 'reach') {
    if (!reachForm.business_line_id) return '请先选择项目';
    if (reachForm.target_contact_ids.length === 0) return '请至少选择一个目标用户';
  }
  return '';
});

onMounted(async () => {
  businessLineList.value = await getBusinessLineListRaw();
  const accountRes = await getAccountList({ status: 1 });
  accountList.value = accountRes.list;
});

function onBusinessLineChange(blId: number) {
  loadKeywords(blId);
  loadPrompts(blId);
  setTimeout(() => {
    scrapeForm.keywords = keywordList.value.filter(k => k.status === 1).map(k => k.keyword);
    const active = promptList.value.find(p => p.is_active === 1 && p.status === 1);
    if (active) scrapeForm.ai_prompt_template_id = active.id;
  }, 300);
}

function onReachBusinessLineChange(blId: number) {
  reachForm.target_contact_ids = [];
  reachForm.include_business_info = false;
  reachForm.business_info_fields = [];
  contactFilter.value = 'pending';
  loadReachContacts();
  loadBusinessProfileForReach(blId);
}

async function loadBusinessProfileForReach(blId: number) {
  try {
    const data = await getBusinessProfile(blId);
    businessProfile.value = data || {};
  } catch {
    businessProfile.value = {};
  }
}

async function loadKeywords(blId: number) {
  const res = await getKeywordList({ business_line_id: blId, status: 1 });
  keywordList.value = res.list;
}

async function loadPrompts(blId: number) {
  const res = await getPromptTemplateList({ business_line_id: blId, status: 1 });
  promptList.value = res.list;
}

function goBack() {
  router.push('/tasks/list');
}

async function submitTask() {
  loading.value = true;
  try {
    if (selectedType.value === 'scrape') {
      await createScrapeTask(scrapeForm);
    } else if (selectedType.value === 'reach') {
      await createReachTask(reachForm);
    }
    message.success('任务创建成功');
    router.push('/tasks/list');
  } catch (error) {
    // handled globally
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="less" scoped>
.type-cards {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 24px 0;
}

.type-card {
  width: 260px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    border-color: #18a058;
  }

  &.selected {
    border-color: #18a058;
    box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.15);
  }

  .type-card-inner {
    padding: 12px 0;
  }

  h3 {
    margin: 12px 0 4px;
    font-size: 16px;
  }

  p {
    color: #999;
    font-size: 13px;
    margin: 0;
  }
}

.form-help {
  font-size: 12px;
  color: #999;
}

.field-block {
  width: 100%;
}

.footer-bar {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.valid-tip {
  color: #f0a020;
  font-size: 13px;
}
</style>
