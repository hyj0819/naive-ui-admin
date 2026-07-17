<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="创建任务">
        创建爬虫、私信或评论回复任务
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <!-- 步骤条 -->
      <n-steps :current="currentStep" size="small" class="mb-6">
        <n-step title="选择类型" />
        <n-step title="配置参数" />
        <n-step title="确认启动" />
      </n-steps>

      <!-- 步骤一：选择任务类型 -->
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
          <n-form-item label="任务名称">
            <n-input v-model:value="scrapeForm.task_name" placeholder="可选，留空自动生成" />
          </n-form-item>
          <n-form-item label="业务线" required>
            <n-select
              v-model:value="scrapeForm.business_line_id"
              placeholder="请选择业务线"
              :options="businessLineOptions"
              @update:value="onBusinessLineChange"
            />
          </n-form-item>
          <n-form-item label="关键词" required>
            <n-dynamic-tags v-model:value="scrapeForm.keywords" />
            <div class="form-help mt-1">
              输入关键词后按回车添加，或从下方已有关键词中选择
            </div>
            <n-tag
              v-for="kw in availableKeywords"
              :key="kw.id"
              size="small"
              class="mr-1 mt-1"
              checkable
              :checked="scrapeForm.keywords.includes(kw.keyword)"
              @click="toggleKeyword(kw.keyword)"
            >
              {{ kw.keyword }}
            </n-tag>
          </n-form-item>
          <n-form-item label="内容类型">
            <n-checkbox-group v-model:value="scrapeForm.content_types">
              <n-space>
                <n-checkbox value="video">视频</n-checkbox>
                <n-checkbox value="comment">评论</n-checkbox>
                <n-checkbox value="post">帖子</n-checkbox>
              </n-space>
            </n-checkbox-group>
          </n-form-item>
          <n-form-item label="最大采集数/关键词">
            <n-input-number v-model:value="scrapeForm.max_items_per_keyword" :min="1" :max="500" />
          </n-form-item>
          <n-form-item label="启用AI筛选">
            <n-switch v-model:value="scrapeForm.ai_filter_enabled" />
          </n-form-item>
          <n-form-item v-if="scrapeForm.ai_filter_enabled" label="筛选提示词">
            <n-select
              v-model:value="scrapeForm.ai_prompt_template_id"
              placeholder="选择提示词模板"
              :options="promptOptions"
              clearable
            />
          </n-form-item>
          <n-form-item label="排除作者">
            <n-switch v-model:value="scrapeForm.exclude_author" />
          </n-form-item>
        </n-form>

        <!-- 私信任务配置 -->
        <n-form v-if="selectedType === 'message'" :label-width="120" label-placement="left">
          <n-form-item label="任务名称">
            <n-input v-model:value="messageForm.task_name" placeholder="可选，留空自动生成" />
          </n-form-item>
          <n-form-item label="业务线" required>
            <n-select
              v-model:value="messageForm.business_line_id"
              placeholder="请选择业务线"
              :options="businessLineOptions"
              @update:value="onMessageBusinessLineChange"
            />
          </n-form-item>
          <n-form-item label="目标用户" required>
            <n-select
              v-model:value="messageForm.target_contact_ids"
              multiple
              placeholder="选择目标用户"
              :options="contactOptions"
              :max-tag-count="5"
              filterable
            />
            <div class="form-help mt-1">已选 {{ messageForm.target_contact_ids.length }} 人</div>
          </n-form-item>
          <n-form-item label="消息模式">
            <n-radio-group v-model:value="messageForm.message_mode">
              <n-space>
                <n-radio value="personalized">个性化生成</n-radio>
                <n-radio value="fixed">固定话术</n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
          <n-form-item v-if="messageForm.message_mode === 'personalized'" label="生成提示词">
            <n-select
              v-model:value="messageForm.prompt_template_id"
              placeholder="选择提示词模板"
              :options="promptOptions"
              clearable
            />
          </n-form-item>
          <n-form-item v-if="messageForm.message_mode === 'fixed'" label="固定话术">
            <n-input v-model:value="messageForm.fixed_message" type="textarea" :rows="3" placeholder="输入固定消息内容" />
          </n-form-item>
          <n-form-item label="发送上限">
            <n-input-number v-model:value="messageForm.max_send_count" :min="1" :max="500" />
          </n-form-item>
          <n-form-item label="发送间隔(分钟)">
            <n-space>
              <n-input-number v-model:value="messageForm.send_interval_min" :min="1" :max="60" style="width: 120px" />
              <span>-</span>
              <n-input-number v-model:value="messageForm.send_interval_max" :min="1" :max="60" style="width: 120px" />
            </n-space>
          </n-form-item>
        </n-form>

        <!-- 评论回复任务配置 -->
        <n-form v-if="selectedType === 'reply'" :label-width="120" label-placement="left">
          <n-form-item label="任务名称">
            <n-input v-model:value="replyForm.task_name" placeholder="可选，留空自动生成" />
          </n-form-item>
          <n-form-item label="业务线" required>
            <n-select
              v-model:value="replyForm.business_line_id"
              placeholder="请选择业务线"
              :options="businessLineOptions"
              @update:value="onReplyBusinessLineChange"
            />
          </n-form-item>
          <n-form-item label="关键词" required>
            <n-dynamic-tags v-model:value="replyForm.keywords" />
          </n-form-item>
          <n-form-item label="回复提示词">
            <n-select
              v-model:value="replyForm.prompt_template_id"
              placeholder="选择提示词模板"
              :options="promptOptions"
              clearable
            />
          </n-form-item>
          <n-form-item label="最大回复数">
            <n-input-number v-model:value="replyForm.max_reply_count" :min="1" :max="200" />
          </n-form-item>
        </n-form>
      </div>

      <!-- 步骤三：确认 -->
      <div v-if="currentStep === 3">
        <n-descriptions title="任务摘要" bordered :column="1" label-placement="left">
          <n-descriptions-item label="任务类型">{{ typeLabel }}</n-descriptions-item>
          <n-descriptions-item label="任务名称">{{ taskNamePreview || '自动生成' }}</n-descriptions-item>
          <n-descriptions-item label="业务线">{{ businessLinePreview }}</n-descriptions-item>
          <n-descriptions-item v-if="selectedType === 'scrape'" label="关键词">
            {{ scrapeForm.keywords.join(', ') }} ({{ scrapeForm.keywords.length }}个)
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedType === 'scrape'" label="预计采集量">
            {{ scrapeForm.keywords.length * scrapeForm.max_items_per_keyword }} 条
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedType === 'scrape'" label="AI筛选">
            {{ scrapeForm.ai_filter_enabled ? '启用' : '关闭' }}
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedType === 'message'" label="目标用户">
            {{ messageForm.target_contact_ids.length }} 人
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedType === 'message'" label="消息模式">
            {{ messageForm.message_mode === 'personalized' ? '个性化生成' : '固定话术' }}
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedType === 'message'" label="发送上限">
            {{ messageForm.max_send_count }} 条
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedType === 'reply'" label="关键词">
            {{ replyForm.keywords.join(', ') }}
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedType === 'reply'" label="最大回复数">
            {{ replyForm.max_reply_count }} 条
          </n-descriptions-item>
        </n-descriptions>
      </div>

      <!-- 底部操作按钮 -->
      <div class="mt-8 flex justify-end">
        <n-space>
          <n-button @click="goBack">取消</n-button>
          <n-button v-if="currentStep > 1" @click="currentStep--">上一步</n-button>
          <n-button v-if="currentStep < 3" type="primary" :disabled="!canNext" @click="currentStep++">
            下一步
          </n-button>
          <n-button v-if="currentStep === 3" type="primary" :loading="loading" @click="submitTask">
            立即启动
          </n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import {
  createScrapeTask,
  createMessageTask,
  createReplyTask,
  type CreateScrapeTaskRequest,
  type CreateMessageTaskRequest,
  type CreateReplyTaskRequest,
} from '@/api/tasks';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';
import { getKeywordList, type Keyword } from '@/api/config/keywords';
import { getPromptTemplateList, type PromptTemplate } from '@/api/config/promptTemplates';
import { getContactList, type Contact } from '@/api/contacts';
import {
  BugOutlined,
  MessageOutlined,
  CommentOutlined,
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
const contactList = ref<Contact[]>([]);

const taskTypes = [
  { value: 'scrape', label: '关键词爬虫', desc: '搜索关键词爬取评论，AI筛选潜在客户', icon: BugOutlined },
  { value: 'message', label: '私信触达', desc: '向筛选出的用户发送个性化私信', icon: MessageOutlined },
  { value: 'reply', label: '评论自动回复', desc: '自动回复目标用户的评论', icon: CommentOutlined },
];

// 表单数据
const scrapeForm = reactive<CreateScrapeTaskRequest>({
  task_name: '',
  business_line_id: null as unknown as number,
  keywords: [],
  content_types: ['video', 'comment'],
  max_items_per_keyword: 50,
  ai_filter_enabled: true,
  ai_prompt_template_id: undefined,
  exclude_author: true,
});

const messageForm = reactive<CreateMessageTaskRequest>({
  task_name: '',
  business_line_id: null as unknown as number,
  target_contact_ids: [],
  message_mode: 'personalized',
  prompt_template_id: undefined,
  fixed_message: '',
  max_send_count: 50,
  send_interval_min: 8,
  send_interval_max: 20,
});

const replyForm = reactive<CreateReplyTaskRequest>({
  task_name: '',
  business_line_id: null as unknown as number,
  keywords: [],
  prompt_template_id: undefined,
  max_reply_count: 30,
});

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

const promptOptions = computed(() =>
  promptList.value
    .filter((p) => p.status === 1)
    .map((p) => ({
      label: `${p.name} (v${p.version})`,
      value: p.id,
    }))
);

const contactOptions = computed(() =>
  contactList.value
    .filter((c) => c.contact_status === 'pending' || c.contact_status === 'contacted')
    .map((c) => ({
      label: `${c.username || c.platform_user_id}`,
      value: c.id,
    }))
);

const typeLabel = computed(() => taskTypes.find((t) => t.value === selectedType.value)?.label || '');
const taskNamePreview = computed(() => {
  if (selectedType.value === 'scrape') return scrapeForm.task_name;
  if (selectedType.value === 'message') return messageForm.task_name;
  return replyForm.task_name;
});
const businessLinePreview = computed(() => {
  const blId =
    selectedType.value === 'scrape'
      ? scrapeForm.business_line_id
      : selectedType.value === 'message'
      ? messageForm.business_line_id
      : replyForm.business_line_id;
  const bl = businessLineList.value.find((b) => b.id === blId);
  return bl ? `${bl.platform_name}/${bl.name}` : '-';
});

const canNext = computed(() => {
  if (currentStep.value === 1) return !!selectedType.value;
  if (currentStep.value === 2) {
    if (selectedType.value === 'scrape') {
      return scrapeForm.business_line_id > 0 && scrapeForm.keywords.length > 0;
    }
    if (selectedType.value === 'message') {
      return messageForm.business_line_id > 0 && messageForm.target_contact_ids.length > 0;
    }
    if (selectedType.value === 'reply') {
      return replyForm.business_line_id > 0 && replyForm.keywords.length > 0;
    }
  }
  return true;
});

onMounted(async () => {
  businessLineList.value = await getBusinessLineListRaw();
});

function onBusinessLineChange(blId: number) {
  loadKeywords(blId);
  loadPrompts(blId);
}

function onMessageBusinessLineChange(blId: number) {
  loadContacts(blId);
  loadPrompts(blId);
}

function onReplyBusinessLineChange(blId: number) {
  loadPrompts(blId);
}

async function loadKeywords(blId: number) {
  const res = await getKeywordList({ business_line_id: blId, status: 1 });
  keywordList.value = res.list;
}

async function loadPrompts(blId: number) {
  const res = await getPromptTemplateList({ business_line_id: blId, status: 1 });
  promptList.value = res.list;
}

async function loadContacts(blId: number) {
  const res = await getContactList({ business_line_id: blId });
  contactList.value = res.list;
}

function toggleKeyword(kw: string) {
  const idx = scrapeForm.keywords.indexOf(kw);
  if (idx >= 0) {
    scrapeForm.keywords.splice(idx, 1);
  } else {
    scrapeForm.keywords.push(kw);
  }
}

function goBack() {
  router.push('/tasks/list');
}

async function submitTask() {
  loading.value = true;
  try {
    if (selectedType.value === 'scrape') {
      await createScrapeTask(scrapeForm);
    } else if (selectedType.value === 'message') {
      await createMessageTask(messageForm);
    } else if (selectedType.value === 'reply') {
      await createReplyTask(replyForm);
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
  width: 220px;
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
</style>