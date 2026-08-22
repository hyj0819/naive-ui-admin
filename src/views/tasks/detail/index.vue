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
            <div class="flex items-center">
              <h3 class="task-title">{{ task?.task_name || `任务 #${task?.id}` }}</h3>
              <n-tag :type="statusType" size="small" round class="ml-3">
                <template #icon>
                  <n-icon v-if="isActive" class="spin"><SyncOutlined /></n-icon>
                </template>
                {{ statusLabel }}
              </n-tag>
            </div>
          </div>
          <n-space>
            <n-button v-if="task?.status === 'pending'" type="primary" @click="handleStart">
              <template #icon><n-icon><PlayCircleOutlined /></n-icon></template>
              启动任务
            </n-button>
            <n-button
              v-if="task?.status === 'running' || task?.status === 'queued'"
              type="error"
              secondary
              @click="handleStop"
            >
              <template #icon><n-icon><PauseCircleOutlined /></n-icon></template>
              停止任务
            </n-button>
            <n-button
              v-if="task?.status === 'failed' || task?.status === 'cancelled'"
              type="warning"
              @click="handleRetry"
              :loading="retrying"
            >
              <template #icon><n-icon><RedoOutlined /></n-icon></template>
              重新执行
            </n-button>
          </n-space>
        </div>
      </n-card>
    </div>

    <div v-if="task" class="task-detail-container">
      <div class="task-detail-layout">
        <!-- 左侧：任务信息和进度 -->
        <div class="task-detail-left">
          <!-- 状态横幅 -->
          <n-alert :type="bannerType" :show-icon="true" class="status-banner">
            <template #header>
              <span class="banner-title">{{ bannerTitle }}</span>
            </template>
            <div class="banner-body">
              <span>{{ bannerDesc }}</span>
              <span v-if="durationText" class="banner-meta">耗时 {{ durationText }}</span>
            </div>
          </n-alert>

          <!-- 基本信息 -->
          <n-card title="基本信息" :bordered="false" class="proCard">
            <n-descriptions :column="2" bordered label-placement="left">
              <n-descriptions-item label="任务类型">
                <n-tag size="small" :bordered="false" type="info">{{ typeLabel }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="业务线">
                {{ task.platform_name && task.business_line_name ? `${task.platform_name} / ${task.business_line_name}` : '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="状态">
                <n-tag :type="statusType" size="small" round>{{ statusLabel }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="创建时间">{{ task.created_at || '-' }}</n-descriptions-item>
              <n-descriptions-item label="开始时间">{{ task.start_time || '尚未开始' }}</n-descriptions-item>
              <n-descriptions-item label="结束时间">{{ task.end_time || '—' }}</n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- 任务配置 -->
          <n-card title="任务配置" :bordered="false" class="proCard" v-if="taskConfig">
            <n-descriptions :column="2" bordered label-placement="left">
              <template v-if="task.task_type === 'scrape'">
                <n-descriptions-item label="关键词">
                  <n-space :size="4" :wrap="true">
                    <n-tag v-for="kw in taskConfig.keywords" :key="kw" size="small" type="success" :bordered="false">{{ kw }}</n-tag>
                  </n-space>
                </n-descriptions-item>
                <n-descriptions-item label="内容类型">
                  {{ contentTypesLabel }}
                </n-descriptions-item>
                <n-descriptions-item label="最大采集数/关键词">{{ taskConfig.max_items_per_keyword }}</n-descriptions-item>
                <n-descriptions-item label="每视频评论上限">
                  {{ taskConfig.max_comments_per_video === 0 ? '不限制' : taskConfig.max_comments_per_video }} 条
                </n-descriptions-item>
                <n-descriptions-item label="超时时间">
                  {{ taskConfig.timeout_seconds || 60 }} 秒
                </n-descriptions-item>
                <n-descriptions-item label="AI 筛选">
                  <n-tag size="small" :type="taskConfig.ai_filter_enabled ? 'success' : 'default'" :bordered="false">
                    {{ taskConfig.ai_filter_enabled ? '已启用' : '未启用' }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="排除作者本人">{{ taskConfig.exclude_author ? '是' : '否' }}</n-descriptions-item>
              </template>
              <template v-if="task.task_type === 'message'">
                <n-descriptions-item label="目标用户数">{{ (taskConfig.target_contact_ids || []).length }} 人</n-descriptions-item>
                <n-descriptions-item label="消息模式">
                  {{ taskConfig.message_mode === 'personalized' ? '个性化生成' : '固定话术' }}
                </n-descriptions-item>
                <n-descriptions-item label="发送上限">{{ taskConfig.max_send_count }}</n-descriptions-item>
                <n-descriptions-item label="发送间隔">{{ taskConfig.send_interval_min }} - {{ taskConfig.send_interval_max }} 分钟</n-descriptions-item>
              </template>
              <template v-if="task.task_type === 'reply'">
                <n-descriptions-item label="关键词">
                  <n-space :size="4" :wrap="true">
                    <n-tag v-for="kw in taskConfig.keywords" :key="kw" size="small" type="success" :bordered="false">{{ kw }}</n-tag>
                  </n-space>
                </n-descriptions-item>
                <n-descriptions-item label="最大回复数">{{ taskConfig.max_reply_count }}</n-descriptions-item>
              </template>
            </n-descriptions>
          </n-card>

          <!-- 执行进度 -->
          <n-card title="执行进度" :bordered="false" class="proCard">
            <div class="progress-section">
              <div class="progress-head">
                <span class="progress-label">整体进度</span>
                <span class="progress-value">{{ task.progress }}%</span>
              </div>
              <n-progress
                type="line"
                :percentage="task.progress"
                :status="progressStatus"
                :height="14"
                :processing="isActive"
                :indicator-placement="'inside'"
                class="mb-4"
              />
              <div class="stat-grid">
                <div class="stat-cell">
                  <div class="stat-num">{{ task.total_items }}</div>
                  <div class="stat-lbl">{{ statLabels.total }}</div>
                </div>
                <div class="stat-cell success">
                  <div class="stat-num">{{ task.success_items }}</div>
                  <div class="stat-lbl">{{ statLabels.success }}</div>
                </div>
                <div class="stat-cell error">
                  <div class="stat-num">{{ task.failed_items }}</div>
                  <div class="stat-lbl">{{ statLabels.failed }}</div>
                </div>
                <div class="stat-cell">
                  <div class="stat-num">{{ task.pending_items }}</div>
                  <div class="stat-lbl">{{ statLabels.pending }}</div>
                </div>
              </div>
              <div v-if="task.error_message" class="error-msg">
                <n-alert type="error" title="任务执行出错">
                  <div class="error-body">
                    <span class="error-text">{{ task.error_message }}</span>
                    <n-button size="small" type="warning" @click="handleRetry" :loading="retrying">重新执行</n-button>
                  </div>
                </n-alert>
              </div>
            </div>
          </n-card>

          <!-- 任务完成结果反馈通知栏 -->
          <transition name="slide-up">
            <div v-if="showResultModal" class="result-notification-bar">
              <div class="result-bar-content">
                <div class="result-bar-left">
                  <n-icon :size="24" :color="resultStatus?.type === 'success' ? '#18a058' : resultStatus?.type === 'error' ? '#d03050' : '#f0a020'">
                    <component :is="resultStatus?.icon" />
                  </n-icon>
                  <div class="result-bar-text">
                    <span class="result-bar-title">{{ typeLabel }}执行{{ resultStatus?.label }}</span>
                    <span class="result-bar-metrics">
                      耗时 {{ durationText }} | {{ resultMetrics?.total }}项 | 成功{{ resultMetrics?.success }} | 失败{{ resultMetrics?.failed }} | {{ resultMetrics?.successRate }}%
                    </span>
                  </div>
                </div>
                <div class="result-bar-right">
                  <n-button text @click="viewDetailReport">查看详细报告</n-button>
                  <n-button text @click="closeResultModal">关闭</n-button>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 右侧：执行日志 -->
        <div class="task-detail-right">
          <n-card :bordered="false" class="proCard log-card">
            <template #header>
              <div class="log-header">
                <span>执行日志</span>
                <span v-if="lastUpdated" class="log-updated">最后更新 {{ lastUpdated }}</span>
              </div>
            </template>
            <template #header-extra>
              <n-space align="center" :size="12">
                <n-select
                  v-model:value="logFilter"
                  placeholder="全部级别"
                  :options="logLevelOptions"
                  clearable
                  size="small"
                  style="width: 120px"
                  @update:value="loadLogs"
                />
                <div class="auto-toggle">
                  <span class="auto-lbl">自动刷新</span>
                  <n-switch v-model:value="autoRefresh" size="small" @update:value="onAutoRefreshChange" />
                </div>
                <n-button size="small" :loading="logLoading" @click="manualRefresh">刷新</n-button>
              </n-space>
            </template>
            <n-scrollbar ref="logScrollRef" class="log-scroll">
              <div v-if="logs.length === 0" class="text-center text-gray-400 py-8">暂无日志</div>
              <div v-else class="log-list">
                <div v-for="log in logs" :key="log.id" class="log-item" :class="log.log_level">
                  <span class="log-time">{{ log.created_at }}</span>
                  <n-tag :type="logTagType(log.log_level)" size="tiny" :bordered="false" class="mx-2 log-level-tag">
                    {{ (log.log_level || 'info').toUpperCase() }}
                  </n-tag>
                  <span class="log-msg">{{ log.message }}</span>
                </div>
              </div>
            </n-scrollbar>
          </n-card>
        </div>
      </div>
    </div>

    <n-spin v-else :show="true" class="loading-holder" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage, useDialog } from 'naive-ui';
import {
  ArrowLeftOutlined,
  SyncOutlined,
  RedoOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@vicons/antd';
import { getTask, startTask, stopTask, retryTask, getTaskLogs, type TaskExecution, type TaskLog } from '@/api/tasks';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const dialog = useDialog();

const task = ref<TaskExecution | null>(null);
const logs = ref<TaskLog[]>([]);
const logFilter = ref<string | undefined>(undefined);
const autoRefresh = ref(true);
const lastUpdated = ref<string>('');
const logLoading = ref(false);
const retrying = ref(false);
const logScrollRef = ref<any>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const showResultModal = ref(false);
const lastTaskStatus = ref<string | null>(null);
const hasShownResult = ref(false);

const POLL_INTERVAL = 3000;

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
  queued: { label: '排队中', type: 'info' },
  running: { label: '运行中', type: 'info' },
  success: { label: '成功', type: 'success' },
  failed: { label: '失败', type: 'error' },
  cancelled: { label: '已取消', type: 'warning' },
};

// 各任务类型的统计口径标签
const statLabelMap: Record<string, { total: string; success: string; failed: string; pending: string }> = {
  scrape: { total: '目标量', success: '已采集', failed: '失败', pending: '待处理' },
  message: { total: '目标量', success: '已发送', failed: '失败', pending: '待发送' },
  reply: { total: '目标量', success: '已回复', failed: '失败', pending: '待回复' },
};

const contentTypeMap: Record<string, string> = { video: '视频', comment: '评论', post: '帖子' };

const typeLabel = computed(() => (task.value ? typeMap[task.value.task_type] || task.value.task_type : ''));
const statusLabel = computed(() => (task.value ? statusConfig[task.value.status]?.label || task.value.status : ''));
const statusType = computed(() => (task.value ? (statusConfig[task.value.status]?.type as any) || 'default' : 'default'));
const isActive = computed(() => !!task.value && ['queued', 'running'].includes(task.value.status));
const statLabels = computed(
  () => statLabelMap[task.value?.task_type || ''] || { total: '总项目', success: '成功', failed: '失败', pending: '待处理' }
);

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

const contentTypesLabel = computed(() => {
  const arr = taskConfig.value?.content_types || [];
  return arr.map((t: string) => contentTypeMap[t] || t).join('、') || '-';
});

const resultStatus = computed(() => {
  const s = task.value?.status;
  if (s === 'success') return { type: 'success', label: '成功', icon: CheckCircleOutlined };
  if (s === 'failed') return { type: 'error', label: '失败', icon: CloseCircleOutlined };
  if (s === 'cancelled') return { type: 'warning', label: '已取消', icon: CloseCircleOutlined };
  return null;
});

const resultMetrics = computed(() => {
  if (!task.value) return null;
  const total = task.value.total_items;
  const success = task.value.success_items;
  const failed = task.value.failed_items;
  const pending = task.value.pending_items;
  return {
    total,
    success,
    failed,
    pending,
    successRate: total > 0 ? Math.round((success / total) * 100) : 0,
  };
});

const resultSummary = computed(() => {
  if (!task.value) return '';
  const s = task.value.status;
  const metrics = resultMetrics.value;
  if (!metrics) return '';

  if (s === 'success') {
    if (metrics.failed === 0) {
      return `任务执行成功！共处理 ${metrics.total} 项，全部完成。`;
    }
    return `任务执行完成！共处理 ${metrics.total} 项，成功 ${metrics.success} 项，失败 ${metrics.failed} 项。`;
  }
  if (s === 'failed') {
    return task.value.error_message || '任务执行失败，请查看日志了解详情。';
  }
  if (s === 'cancelled') {
    return `任务已取消。已处理 ${metrics.success} 项，剩余 ${metrics.pending} 项未完成。`;
  }
  return '';
});

// 状态横幅
const bannerType = computed(() => {
  const s = task.value?.status;
  if (s === 'success') return 'success';
  if (s === 'failed') return 'error';
  if (s === 'cancelled') return 'warning';
  if (s === 'running' || s === 'queued') return 'info';
  return 'default';
});
const bannerTitle = computed(() => {
  const s = task.value?.status;
  if (s === 'success') return '任务已完成';
  if (s === 'failed') return '任务执行失败';
  if (s === 'cancelled') return '任务已取消';
  if (s === 'running') return '任务执行中';
  if (s === 'queued') return '任务排队中';
  return '任务待启动';
});
const bannerDesc = computed(() => {
  const s = task.value?.status;
  if (s === 'success') return `共处理 ${task.value?.total_items || 0} 项，成功 ${task.value?.success_items || 0} 项。`;
  if (s === 'failed') return task.value?.error_message || '执行过程中出现异常，可点击右上角「重新执行」重试。';
  if (s === 'cancelled') return '任务已被手动停止，可点击右上角「重新执行」重新入队。';
  if (s === 'running') return '正在执行，页面将自动刷新进度与日志。';
  if (s === 'queued') return '已加入执行队列，等待 Worker 认领。请确认后台 Worker 进程已启动。';
  return '任务尚未启动，点击右上角「启动任务」加入执行队列。';
});

// 耗时计算
function parseTime(s?: string | null): number | null {
  if (!s) return null;
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    ).getTime();
  }
  const d = new Date(s);
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}
const nowTick = ref(Date.now());
const durationText = computed(() => {
  const start = parseTime(task.value?.start_time);
  if (!start) return '';
  const end = parseTime(task.value?.end_time) ?? (isActive.value ? nowTick.value : null);
  if (!end) return '';
  let sec = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(sec / 3600);
  sec -= h * 3600;
  const m = Math.floor(sec / 60);
  sec -= m * 60;
  if (h > 0) return `${h}小时${m}分${sec}秒`;
  if (m > 0) return `${m}分${sec}秒`;
  return `${sec}秒`;
});

function logTagType(level: string): any {
  if (level === 'error') return 'error';
  if (level === 'warn') return 'warning';
  return 'info';
}

function nowStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function loadTask() {
  const id = parseInt(route.params.id as string);
  task.value = await getTask(id);
  nowTick.value = Date.now();
}

async function loadLogs(scrollBottom = false) {
  if (!task.value) return;
  const res = await getTaskLogs(task.value.id, {
    page: 1,
    page_size: 200,
    log_level: logFilter.value,
  });
  const prevLen = logs.value.length;
  logs.value = res.items || [];
  lastUpdated.value = nowStr();
  // 有新日志且开启自动刷新时，滚动到底部
  if (scrollBottom || (autoRefresh.value && logs.value.length > prevLen)) {
    await nextTick();
    scrollLogToBottom();
  }
}

function scrollLogToBottom() {
  const inst = logScrollRef.value;
  if (!inst) return;
  const el = inst.$el?.parentElement?.querySelector('.n-scrollbar-container') || inst.$el?.querySelector('.n-scrollbar-container');
  const top = el ? el.scrollHeight : 999999;
  if (typeof inst.scrollTo === 'function') {
    inst.scrollTo({ top });
  } else if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

async function manualRefresh() {
  logLoading.value = true;
  try {
    await Promise.all([loadTask(), loadLogs(true)]);
  } finally {
    logLoading.value = false;
  }
}

function goBack() {
  router.push('/tasks/list');
}

function handleStart() {
  hasShownResult.value = false;
  lastTaskStatus.value = null;
  if (resultTimer) {
    clearTimeout(resultTimer);
    resultTimer = null;
  }
  startTask(task.value!.id)
    .then(async () => {
      message.success('任务已加入执行队列');
      autoRefresh.value = true;
      await loadTask();
      startPolling();
    })
    .catch(() => {});
}

function handleStop() {
  dialog.warning({
    title: '确认停止',
    content: '确定要停止当前任务吗？停止后可通过「重新执行」再次运行。',
    positiveText: '确认停止',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await stopTask(task.value!.id);
        message.success('任务已停止');
        await loadTask();
        checkAndShowResult();
        await loadLogs();
      } catch (error) {
        // handled globally
      }
    },
  });
}

async function handleRetry() {
  hasShownResult.value = false;
  lastTaskStatus.value = null;
  if (resultTimer) {
    clearTimeout(resultTimer);
    resultTimer = null;
  }
  retrying.value = true;
  try {
    await retryTask(task.value!.id);
    message.success('任务已重新加入执行队列');
    autoRefresh.value = true;
    await loadTask();
    await loadLogs(true);
    startPolling();
  } catch (error) {
    // handled globally
  } finally {
    retrying.value = false;
  }
}

function onAutoRefreshChange(val: boolean) {
  if (val) {
    startPolling();
  } else {
    stopPolling();
  }
}

function startPolling() {
  if (pollTimer) return;
  if (!autoRefresh.value) return;
  pollTimer = setInterval(async () => {
    nowTick.value = Date.now();
    if (task.value && ['queued', 'running'].includes(task.value.status)) {
      await loadTask();
      checkAndShowResult();
      await loadLogs();
    } else {
      // 到达终态：做最后一次刷新后停止轮询
      await loadTask();
      checkAndShowResult();
      await loadLogs();
      stopPolling();
    }
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

let resultTimer: ReturnType<typeof setTimeout> | null = null;

function closeResultModal() {
  showResultModal.value = false;
  hasShownResult.value = true;
  if (resultTimer) {
    clearTimeout(resultTimer);
    resultTimer = null;
  }
}

function viewDetailReport() {
  showResultModal.value = false;
  hasShownResult.value = true;
  if (resultTimer) {
    clearTimeout(resultTimer);
    resultTimer = null;
  }
  router.push(`/tasks/${task.value!.id}/report`);
}

function checkAndShowResult() {
  if (!task.value || hasShownResult.value) return;
  const currentStatus = task.value.status;
  const terminalStatuses = ['success', 'failed', 'cancelled'];

  if (terminalStatuses.includes(currentStatus)) {
    if (!lastTaskStatus.value) {
      showResultModal.value = true;
      resultTimer = setTimeout(() => {
        closeResultModal();
      }, 15000);
    } else if (lastTaskStatus.value !== currentStatus && ['running', 'queued'].includes(lastTaskStatus.value)) {
      showResultModal.value = true;
      resultTimer = setTimeout(() => {
        closeResultModal();
      }, 15000);
    }
  }
  lastTaskStatus.value = currentStatus;
}

onMounted(async () => {
  await loadTask();
  await loadLogs(true);
  
  const terminalStatuses = ['success', 'failed', 'cancelled'];
  if (terminalStatuses.includes(task.value?.status || '') && !hasShownResult.value) {
    showResultModal.value = true;
    resultTimer = setTimeout(() => {
      closeResultModal();
    }, 15000);
    hasShownResult.value = true;
  }
  
  lastTaskStatus.value = task.value?.status || null;
  if (isActive.value) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
  if (resultTimer) {
    clearTimeout(resultTimer);
    resultTimer = null;
  }
});
</script>

<style lang="less" scoped>
.task-detail-container {
  padding: 16px;
  padding-bottom: 80px;
}

.task-detail-layout {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 16px;
  max-width: 1920px;
  margin: 0 auto;
}

.task-detail-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-detail-right {
  display: flex;
  flex-direction: column;
  height: fit-content;
  position: sticky;
  top: 16px;
}

.log-card {
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.log-card :deep(.n-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-scroll {
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.task-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

@media (max-width: 1200px) {
  .task-detail-layout {
    grid-template-columns: 1fr;
  }

  .task-detail-right {
    position: static;
  }

  .log-card {
    height: 500px;
  }
}

@media (max-width: 768px) {
  .task-detail-container {
    padding: 12px;
    padding-bottom: 80px;
  }

  .log-card {
    height: 400px;
  }
}

.status-banner {
  border-radius: 8px;

  .banner-title {
    font-weight: 600;
  }

  .banner-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .banner-meta {
    color: #666;
    font-size: 13px;
    white-space: nowrap;
  }
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;

  .progress-label {
    color: #666;
    font-size: 13px;
  }

  .progress-value {
    font-weight: 600;
    font-size: 15px;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 4px;
}

.stat-cell {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px 12px;
  text-align: center;

  .stat-num {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
  }

  .stat-lbl {
    color: #999;
    font-size: 12px;
    margin-top: 4px;
  }

  &.success .stat-num {
    color: #18a058;
  }

  &.error .stat-num {
    color: #d03050;
  }
}

.error-msg {
  margin-top: 16px;
}

.error-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.error-text {
  word-break: break-all;
}

.log-header {
  display: flex;
  align-items: baseline;
  gap: 12px;

  .log-updated {
    font-size: 12px;
    color: #999;
    font-weight: 400;
  }
}

.auto-toggle {
  display: flex;
  align-items: center;
  gap: 6px;

  .auto-lbl {
    font-size: 13px;
    color: #666;
  }
}

.log-scroll {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 12px 16px;
}

.log-list {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.7;
}

.log-item {
  padding: 5px 8px;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  color: #e8e8e8;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  &.error {
    color: #ff6b6b;
    background-color: rgba(255, 107, 107, 0.08);
  }

  &.warn {
    color: #ffd93d;
  }

  &.info {
    color: #a8d8ea;
  }
}

.log-level-tag {
  flex-shrink: 0;
  font-size: 11px;
  padding: 1px 6px;
}

.log-time {
  color: #7bed9f;
  white-space: nowrap;
  min-width: 170px;
  font-weight: 500;
}

.log-msg {
  flex: 1;
  word-break: break-all;
}

.loading-holder {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.result-notification-bar {
  z-index: 100;
  background: linear-gradient(135deg, #f6ffed 0%, #fffbe6 100%);
  border: 2px solid #b7eb8f;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(24, 160, 88, 0.15);
}

.result-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.result-bar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.result-bar-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-bar-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.result-bar-metrics {
  font-size: 13px;
  color: #666;
}

.result-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
