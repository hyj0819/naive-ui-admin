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
              <h3 class="report-title">{{ task?.task_name || `任务报告 #${task?.id}` }}</h3>
              <n-tag :type="statusType" size="small" round class="ml-3">
                {{ statusLabel }}
              </n-tag>
            </div>
          </div>
          <n-space>
            <n-button @click="exportReport">
              <template #icon><n-icon><DownloadOutlined /></n-icon></template>
              导出报告
            </n-button>
          </n-space>
        </div>
      </n-card>
    </div>

    <div v-if="task" class="report-container">
      <!-- 报告概览 -->
      <n-card title="报告概览" :bordered="false" class="proCard">
        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-icon success">
              <n-icon :size="28"><CheckCircleOutlined /></n-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ task.success_items }}</div>
              <div class="overview-label">成功数</div>
            </div>
          </div>
          <div class="overview-item">
            <div class="overview-icon error">
              <n-icon :size="28"><CloseCircleOutlined /></n-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ task.failed_items }}</div>
              <div class="overview-label">失败数</div>
            </div>
          </div>
          <div class="overview-item">
            <div class="overview-icon info">
              <n-icon :size="28"><ClockCircleOutlined /></n-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ durationText }}</div>
              <div class="overview-label">执行耗时</div>
            </div>
          </div>
          <div class="overview-item">
            <div class="overview-icon">
              <n-icon :size="28"><PercentageOutlined /></n-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ successRate }}%</div>
              <div class="overview-label">成功率</div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- 基本信息 -->
      <n-card title="任务信息" :bordered="false" class="proCard">
        <n-descriptions :column="3" bordered label-placement="left">
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
          <n-descriptions-item label="开始时间">{{ task.start_time || '未开始' }}</n-descriptions-item>
          <n-descriptions-item label="结束时间">{{ task.end_time || '未结束' }}</n-descriptions-item>
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
            <n-descriptions-item label="内容类型">{{ contentTypesLabel }}</n-descriptions-item>
            <n-descriptions-item label="最大采集数/关键词">{{ taskConfig.max_items_per_keyword }}</n-descriptions-item>
            <n-descriptions-item label="每视频评论上限">
              {{ taskConfig.max_comments_per_video === 0 ? '不限制' : taskConfig.max_comments_per_video }} 条
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

      <!-- 执行统计 -->
      <n-card title="执行统计" :bordered="false" class="proCard">
        <div class="stats-section">
          <div class="stats-chart">
            <div class="pie-chart-container">
              <div class="pie-chart" :style="{ background: `conic-gradient(#18a058 0% ${successRate}%, #d03050 ${successRate}% 100%)` }"></div>
              <div class="pie-center">
                <div class="pie-value">{{ successRate }}%</div>
                <div class="pie-label">成功率</div>
              </div>
            </div>
          </div>
          <div class="stats-list">
            <div class="stat-row">
              <span class="stat-label">总项目</span>
              <span class="stat-value">{{ task.total_items }}</span>
            </div>
            <div class="stat-row success">
              <span class="stat-label">成功</span>
              <span class="stat-value">{{ task.success_items }}</span>
            </div>
            <div class="stat-row error">
              <span class="stat-label">失败</span>
              <span class="stat-value">{{ task.failed_items }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">待处理</span>
              <span class="stat-value">{{ task.pending_items }}</span>
            </div>
          </div>
        </div>
      </n-card>

      <!-- 执行日志 -->
      <n-card :bordered="false" class="proCard">
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
            <n-button size="small" :loading="logLoading" @click="loadLogs">刷新</n-button>
          </n-space>
        </template>
        <n-scrollbar style="max-height: 500px" class="log-scroll">
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

    <n-spin v-else :show="true" class="loading-holder" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  DownloadOutlined,
} from '@vicons/antd';
import { getTask, getTaskLogs, type TaskExecution, type TaskLog } from '@/api/tasks';

const route = useRoute();
const router = useRouter();
const message = useMessage();

const task = ref<TaskExecution | null>(null);
const logs = ref<TaskLog[]>([]);
const logFilter = ref<string | undefined>(undefined);
const logLoading = ref(false);
const lastUpdated = ref<string>('');

const logLevelOptions = [
  { label: '全部', value: undefined },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
];

const taskConfig = computed(() => {
  try {
    return task.value ? JSON.parse(task.value.task_config) : null;
  } catch {
    return null;
  }
});

const contentTypeMap: Record<string, string> = {
  video: '视频',
  comment: '评论',
  post: '帖子',
};

const contentTypesLabel = computed(() => {
  const arr = taskConfig.value?.content_types || [];
  return arr.map((t: string) => contentTypeMap[t] || t).join('、') || '-';
});

const typeLabel = computed(() => {
  const map: Record<string, string> = {
    scrape: '爬取任务',
    message: '私信任务',
    reply: '评论回复任务',
  };
  return map[task.value?.task_type || ''] || task.value?.task_type || '-';
});

const statusType = computed(() => {
  const s = task.value?.status;
  if (s === 'success') return 'success';
  if (s === 'failed') return 'error';
  if (s === 'cancelled') return 'warning';
  if (s === 'running' || s === 'queued') return 'info';
  return 'default';
});

const statusLabel = computed(() => {
  const s = task.value?.status;
  if (s === 'success') return '成功';
  if (s === 'failed') return '失败';
  if (s === 'cancelled') return '已取消';
  if (s === 'running') return '执行中';
  if (s === 'queued') return '排队中';
  if (s === 'pending') return '待启动';
  return '-';
});

const successRate = computed(() => {
  const total = task.value?.total_items || 0;
  const success = task.value?.success_items || 0;
  return total > 0 ? Math.round((success / total) * 100) : 0;
});

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

const durationText = computed(() => {
  const start = parseTime(task.value?.start_time);
  const end = parseTime(task.value?.end_time);
  if (!start || !end) return '-';
  const ms = end - start;
  let sec = Math.max(0, Math.floor(ms / 1000));
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
}

async function loadLogs() {
  if (!task.value) return;
  logLoading.value = true;
  try {
    const res = await getTaskLogs(task.value.id, {
      page: 1,
      page_size: 200,
      log_level: logFilter.value,
    });
    logs.value = res.items || [];
    lastUpdated.value = nowStr();
  } finally {
    logLoading.value = false;
  }
}

function goBack() {
  router.push(`/tasks/${route.params.id}`);
}

function exportReport() {
  if (!task.value) return;
  
  const reportData = {
    taskName: task.value.task_name,
    taskId: task.value.id,
    taskType: typeLabel.value,
    status: statusLabel.value,
    createdAt: task.value.created_at,
    startTime: task.value.start_time,
    endTime: task.value.end_time,
    duration: durationText.value,
    totalItems: task.value.total_items,
    successItems: task.value.success_items,
    failedItems: task.value.failed_items,
    successRate: successRate.value,
    logs: logs.value,
  };

  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task_report_${task.value.id}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  message.success('报告已导出');
}

onMounted(async () => {
  await loadTask();
  await loadLogs();
});
</script>

<style lang="less" scoped>
.report-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.report-container {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
}

.overview-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f7ff;

  &.success {
    background: #f6ffed;
    color: #18a058;
  }

  &.error {
    background: #fff2f0;
    color: #d03050;
  }

  &.info {
    background: #fffbe6;
    color: #faad14;
  }
}

.overview-info {
  display: flex;
  flex-direction: column;
}

.overview-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

.overview-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.stats-section {
  display: flex;
  gap: 40px;
  align-items: center;
}

.pie-chart-container {
  position: relative;
  width: 180px;
  height: 180px;
}

.pie-chart {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    #18a058 calc(var(--percent) * 1%),
    #d03050 0
  );
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    width: 80%;
    height: 80%;
    background: #fff;
    border-radius: 50%;
  }
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1;
}

.pie-value {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.pie-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.stats-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;

  &.success .stat-value {
    color: #18a058;
  }

  &.error .stat-value {
    color: #d03050;
  }
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
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

.log-scroll {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 8px 12px;
}

.log-list {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.log-item {
  padding: 4px 6px;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  color: #d4d4d4;

  &.error {
    color: #ff7875;
  }

  &.warn {
    color: #ffd666;
  }
}

.log-level-tag {
  flex-shrink: 0;
}

.log-time {
  color: #6a9955;
  white-space: nowrap;
  min-width: 170px;
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

@media (max-width: 900px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-section {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 600px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>