<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <n-button text @click="goBack" class="mr-3">
              <template #icon>
                <n-icon><ArrowLeftOutlined /></n-icon>
              </template>
            </n-button>
            <div>
              <h3 class="task-title">{{ task?.task_name || `任务 #${task?.id}` }}</h3>
              <n-tag :type="statusType" size="small" round class="ml-2">{{ statusLabel }}</n-tag>
            </div>
          </div>
          <n-space>
            <n-button v-if="task?.status === 'running'" type="error" secondary @click="handleStop">
              停止任务
            </n-button>
            <n-button
              v-if="task?.status === 'failed' || task?.status === 'cancelled'"
              type="warning"
              secondary
              @click="handleRetry"
            >
              重试
            </n-button>
          </n-space>
        </div>
      </n-card>
    </div>

    <div v-if="task" class="p-4 space-y-4">
      <!-- 基本信息 -->
      <n-card title="基本信息" :bordered="false" class="proCard">
        <n-descriptions :column="3" bordered label-placement="left">
          <n-descriptions-item label="任务类型">{{ typeLabel }}</n-descriptions-item>
          <n-descriptions-item label="业务线">
            {{ task.platform_name && task.business_line_name ? `${task.platform_name}/${task.business_line_name}` : '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="statusType" size="small" round>{{ statusLabel }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">{{ task.created_at }}</n-descriptions-item>
          <n-descriptions-item label="开始时间">{{ task.start_time || '-' }}</n-descriptions-item>
          <n-descriptions-item label="结束时间">{{ task.end_time || '-' }}</n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- 任务配置 -->
      <n-card title="任务配置" :bordered="false" class="proCard" v-if="taskConfig">
        <n-descriptions :column="2" bordered label-placement="left">
          <template v-if="task.task_type === 'scrape'">
            <n-descriptions-item label="关键词">
              <n-tag v-for="kw in taskConfig.keywords" :key="kw" size="small" class="mr-1">{{ kw }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="内容类型">
              {{ (taskConfig.content_types || []).join(', ') }}
            </n-descriptions-item>
            <n-descriptions-item label="最大采集数/关键词">{{ taskConfig.max_items_per_keyword }}</n-descriptions-item>
            <n-descriptions-item label="AI筛选">{{ taskConfig.ai_filter_enabled ? '启用' : '关闭' }}</n-descriptions-item>
            <n-descriptions-item label="排除作者">{{ taskConfig.exclude_author ? '是' : '否' }}</n-descriptions-item>
          </template>
          <template v-if="task.task_type === 'message'">
            <n-descriptions-item label="目标用户数">{{ (taskConfig.target_contact_ids || []).length }} 人</n-descriptions-item>
            <n-descriptions-item label="消息模式">
              {{ taskConfig.message_mode === 'personalized' ? '个性化生成' : '固定话术' }}
            </n-descriptions-item>
            <n-descriptions-item label="发送上限">{{ taskConfig.max_send_count }}</n-descriptions-item>
            <n-descriptions-item label="发送间隔">{{ taskConfig.send_interval_min }}-{{ taskConfig.send_interval_max }} 分钟</n-descriptions-item>
          </template>
          <template v-if="task.task_type === 'reply'">
            <n-descriptions-item label="关键词">
              <n-tag v-for="kw in taskConfig.keywords" :key="kw" size="small" class="mr-1">{{ kw }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="最大回复数">{{ taskConfig.max_reply_count }}</n-descriptions-item>
          </template>
        </n-descriptions>
      </n-card>

      <!-- 执行进度 -->
      <n-card title="执行进度" :bordered="false" class="proCard">
        <div class="progress-section">
          <n-progress
            type="line"
            :percentage="task.progress"
            :status="progressStatus"
            :height="16"
            :show-indicator="true"
            class="mb-4"
          />
          <div class="grid grid-cols-4 gap-4 mb-4">
            <n-statistic label="总项目" :value="task.total_items" />
            <n-statistic label="成功" :value="task.success_items" class="text-success" />
            <n-statistic label="失败" :value="task.failed_items" class="text-error" />
            <n-statistic label="待处理" :value="task.pending_items" />
          </div>
          <div v-if="task.error_message" class="error-msg">
            <n-alert type="error" :title="task.error_message" />
          </div>
        </div>
      </n-card>

      <!-- 执行日志 -->
      <n-card title="执行日志" :bordered="false" class="proCard">
        <div class="mb-3">
          <n-space>
            <n-select
              v-model:value="logFilter"
              placeholder="日志级别"
              :options="logLevelOptions"
              clearable
              style="width: 120px"
              @update:value="loadLogs"
            />
            <n-button size="small" @click="loadLogs">刷新</n-button>
          </n-space>
        </div>
        <n-scrollbar style="max-height: 400px">
          <div v-if="logs.length === 0" class="text-center text-gray-400 py-8">暂无日志</div>
          <div v-else class="log-list">
            <div v-for="log in logs" :key="log.id" class="log-item" :class="log.log_level">
              <span class="log-time">{{ log.created_at }}</span>
              <n-tag :type="logTagType(log.log_level)" size="tiny" class="mx-2">{{ log.log_level }}</n-tag>
              <span class="log-msg">{{ log.message }}</span>
            </div>
          </div>
        </n-scrollbar>
      </n-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage, useDialog } from 'naive-ui';
import { ArrowLeftOutlined } from '@vicons/antd';
import { getTask, stopTask, retryTask, getTaskLogs, type TaskExecution, type TaskLog } from '@/api/tasks';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const dialog = useDialog();

const task = ref<TaskExecution | null>(null);
const logs = ref<TaskLog[]>([]);
const logFilter = ref<string | undefined>(undefined);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const logLevelOptions = [
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
];

const typeMap: Record<string, string> = {
  scrape: '爬虫任务',
  message: '私信任务',
  reply: '回复任务',
};

const statusConfig: Record<string, { label: string; type: string }> = {
  pending: { label: '待执行', type: 'default' },
  running: { label: '运行中', type: 'info' },
  success: { label: '成功', type: 'success' },
  failed: { label: '失败', type: 'error' },
  cancelled: { label: '已取消', type: 'warning' },
};

const typeLabel = computed(() => (task.value ? typeMap[task.value.task_type] || task.value.task_type : ''));
const statusLabel = computed(() => (task.value ? statusConfig[task.value.status]?.label || task.value.status : ''));
const statusType = computed(() => (task.value ? (statusConfig[task.value.status]?.type as any) || 'default' : 'default'));
const progressStatus = computed(() => {
  if (!task.value) return 'default';
  if (task.value.status === 'success') return 'success';
  if (task.value.status === 'failed') return 'error';
  return 'default';
});

const taskConfig = computed(() => {
  if (!task.value?.task_config) return null;
  try {
    return JSON.parse(task.value.task_config);
  } catch {
    return null;
  }
});

function logTagType(level: string): any {
  if (level === 'error') return 'error';
  if (level === 'warn') return 'warning';
  return 'info';
}

async function loadTask() {
  const id = parseInt(route.params.id as string);
  task.value = await getTask(id);
}

async function loadLogs() {
  if (!task.value) return;
  const res = await getTaskLogs(task.value.id, {
    page: 1,
    page_size: 200,
    log_level: logFilter.value,
  });
  logs.value = res.items || [];
}

function goBack() {
  router.push('/tasks/list');
}

function handleStop() {
  dialog.warning({
    title: '确认停止',
    content: '确定要停止当前任务吗？',
    positiveText: '确认停止',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await stopTask(task.value!.id);
        message.success('任务已停止');
        await loadTask();
      } catch (error) {
        // handled globally
      }
    },
  });
}

async function handleRetry() {
  try {
    await retryTask(task.value!.id);
    message.success('已创建重试任务');
    router.push('/tasks/list');
  } catch (error) {
    // handled globally
  }
}

onMounted(async () => {
  await loadTask();
  await loadLogs();

  // 运行中任务轮询刷新
  pollTimer = setInterval(async () => {
    if (task.value?.status === 'running') {
      await loadTask();
      await loadLogs();
    } else {
      // 非运行状态停止轮询
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }
  }, 5000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<style lang="less" scoped>
.task-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: inline-block;
}

.text-success {
  color: #18a058;
}

.text-error {
  color: #d03050;
}

.error-msg {
  margin-top: 8px;
}

.log-list {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.log-item {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;

  &.error {
    background: #fff0f0;
  }

  &.warn {
    background: #fffbe6;
  }
}

.log-time {
  color: #999;
  white-space: nowrap;
  min-width: 170px;
}

.log-msg {
  flex: 1;
  word-break: break-all;
}
</style>