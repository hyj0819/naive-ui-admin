<template>
  <div class="console-dashboard">
    <!-- 欢迎问候 -->
    <div style="margin-bottom: 12px; padding: 8px 0;">
      <h3 style="margin: 0; color: #666; font-size: 14px;">{{ timeGreeting }}</h3>
    </div>

    <!-- ① 核心指标卡片 -->
    <n-grid cols="1 s:2 m:2 l:4 xl:4 2xl:4" responsive="screen" :x-gap="12" :y-gap="8">
      <n-grid-item v-for="card in kpiCards" :key="card.label">
        <n-card :bordered="false" size="small" :content-style="{ padding: '16px 20px' }">
          <div class="kpi-card">
            <div class="kpi-icon" :style="{ background: card.bgColor }">
              <n-icon :size="26" :color="card.color">
                <component :is="card.icon" />
              </n-icon>
            </div>
            <div class="kpi-body">
              <div class="kpi-value">
                <CountTo :startVal="0" :endVal="card.value" :suffix="card.suffix || ''" />
              </div>
              <div class="kpi-label">{{ card.label }}</div>
            </div>
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">{{ card.sub }}</span>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- ② 趋势折线图 -->
    <n-card :bordered="false" size="small" class="mt-3">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="card-title">数据趋势</span>
          <n-radio-group v-model:value="granularity" size="small" @update:value="onGranularityChange">
            <n-radio-button value="day">日</n-radio-button>
            <n-radio-button value="week">周</n-radio-button>
            <n-radio-button value="month">月</n-radio-button>
          </n-radio-group>
        </div>
      </template>
      <div ref="trendChartRef" style="height: 300px"></div>
    </n-card>

    <!-- ③ 转化漏斗 + 平台分布 -->
    <n-grid class="mt-3" cols="1 s:1 m:1 l:2 xl:2 2xl:2" responsive="screen" :x-gap="12" :y-gap="8">
      <n-gi>
        <n-card :bordered="false" size="small" title="转化流程概览">
          <!-- 上下布局：上为漏斗图，下为阶段指标列表 -->
          <div ref="funnelChartRef" style="height: 200px; margin-bottom: 16px;"></div>
          
          <!-- 阶段指标详情 -->
          <div class="pipeline-stages-list">
            <div v-for="(stage, i) in pipelineStages" :key="stage.name" class="stage-item">
              <div class="stage-header">
                <span class="stage-name">{{ stage.name }}</span>
                <span class="stage-value">{{ stage.value.toLocaleString() }}</span>
              </div>
              <div class="stage-progress">
                <n-progress 
                  type="line" 
                  :percentage="stage.rate" 
                  :show-indicator="false"
                  :height="8"
                  :color="funnelColors[i % funnelColors.length]"
                  stroke-color="var(--primary-color)"
                />
                <span class="stage-rate">{{ stage.rate }}%</span>
              </div>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" size="small" title="平台内容分布" :content-style="{ height: '350px', padding: '12px' }">
          <div class="flex items-center" style="height: 320px">
            <div ref="pieChartRef" style="width: 45%; height: 100%"></div>
            <div class="platform-list compact">
              <div v-for="p in platformData" :key="p.platform_code" class="platform-row">
                <span class="platform-dot" :style="{ background: getPlatformColor(p.platform_code) }"></span>
                <span class="platform-name">{{ p.platform_name }}</span>
                <span class="platform-count">{{ p.total }}</span>
              </div>
              <n-empty v-if="!platformData.length" description="暂无数据" size="small" />
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- ④ 最近任务 -->
    <n-card :bordered="false" size="small" class="mt-3">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="card-title">最近任务</span>
          <n-button text type="primary" size="small" @click="router.push('/tasks/list')">查看全部</n-button>
        </div>
      </template>
      <n-data-table
        :columns="taskColumns"
        :data="recentTasks"
        :bordered="false"
        :single-line="false"
        size="small"
        :pagination="false"
      />
      <n-empty v-if="!recentTasks.length" description="暂无任务记录" class="py-4" />
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, h, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { NTag, NButton, NProgress } from 'naive-ui';
import * as echarts from 'echarts';
import { CountTo } from '@/components/CountTo/index';
import {
  FileTextOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
} from '@vicons/antd';
import {
  getOverviewStats,
  getContentsStats,
  getPipelineStats,
  getTrendData,
  getRecentTasks,
  type OverviewStats,
  type ContentByPlatform,
  type PipelineStage,
  type TrendItem,
  type RecentTask,
} from '@/api/stats';

const router = useRouter();
const message = useMessage();

// ─── 动态时间问候语 ────────────────────────────────────────
const timeGreeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了管理员，注意休息';
  if (hour < 9) return '早上好管理员';
  if (hour < 12) return '上午好管理员';
  if (hour < 14) return '中午好管理员';
  if (hour < 18) return '下午好管理员';
  if (hour < 22) return '晚上好管理员';
  return '夜深了管理员，注意休息';
});

// ─── 概览数据 ────────────────────────────────────────────
const overview = ref<OverviewStats>({
  total_contents: 0, total_contacts: 0, contacted: 0, converted: 0,
  ai_passed: 0, messaged: 0, conversion_rate: 0, contact_rate: 0, running_tasks: 0,
});

// ─── KPI 卡片 ────────────────────────────────────────────
const kpiCards = computed(() => [
  {
    label: '采集总内容',
    value: overview.value.total_contents,
    icon: markRaw(FileTextOutlined),
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.1)',
    sub: `AI 智能筛选通过 ${overview.value.ai_passed} 条`,
  },
  {
    label: '触达总用户',
    value: overview.value.total_contacts,
    icon: markRaw(TeamOutlined),
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.1)',
    sub: `已联系 ${overview.value.contacted} · 已转化 ${overview.value.converted}`,
  },
  {
    label: '客户转化率',
    value: overview.value.conversion_rate,
    suffix: '%',
    icon: markRaw(ThunderboltOutlined),
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.1)',
    sub: `触达率 ${overview.value.contact_rate}%`,
  },
  {
    label: '执行中任务',
    value: overview.value.running_tasks,
    icon: markRaw(PlayCircleOutlined),
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.1)',
    sub: '当前正在执行',
  },
]);

// ─── 趋势数据 ────────────────────────────────────────────
const granularity = ref<'day' | 'week' | 'month'>('day');
const trendData = ref<TrendItem[]>([]);
const trendChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;

function renderTrendChart() {
  if (!trendChartRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendChartRef.value);
  const dates = trendData.value.map(d => d.date);
  
  // 计算 x 轴标签的显示频率
  const labelSkip = Math.max(1, Math.floor(dates.length / 15));
  
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { 
      data: ['新增采集', '新增用户', '发送私信'], 
      bottom: 0, 
      itemGap: 24,
      icon: 'roundRect'
    },
    grid: { left: 50, right: 30, top: 16, bottom: 50 },
    xAxis: { 
      type: 'category', 
      data: dates, 
      axisLabel: { 
        rotate: dates.length > 15 ? 45 : 0, 
        fontSize: 11,
        formatter: (value: string, index: number) => {
          // 只显示月和日（如"1 月 5 日"）
          const date = new Date(value);
          if (isNaN(date.getTime())) return value;
          const month = date.getMonth() + 1;
          const day = date.getDate();
          return `${month}月${day}日`;
        }
      } 
    },
    yAxis: { 
      type: 'value', 
      splitLine: { lineStyle: { type: 'dashed' } } 
    },
    series: [
      { 
        name: '新增采集', 
        type: 'line', 
        smooth: true, 
        data: trendData.value.map((d, i) => i % labelSkip === 0 ? d.contents : null),
        itemStyle: { color: '#3b82f6' }, 
        areaStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59,130,246,0.25)' }, 
            { offset: 1, color: 'rgba(59,130,246,0.02)' }
          ])
        } 
      },
      { 
        name: '新增用户', 
        type: 'line', 
        smooth: true, 
        data: trendData.value.map((d, i) => i % labelSkip === 0 ? d.contacts : null),
        itemStyle: { color: '#22c55e' }, 
        areaStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34,197,94,0.2)' }, 
            { offset: 1, color: 'rgba(34,197,94,0.02)' }
          ])
        } 
      },
      { 
        name: '发送私信', 
        type: 'line', 
        smooth: true, 
        data: trendData.value.map(d => d.messages), 
        itemStyle: { color: '#f97316' } 
      }
    ],
    // 图例组件 - 底部显示
    legendComponent: {
      bottom: 0,
      data: ['新增采集', '新增用户', '发送私信'],
      textStyle: { fontSize: 12 },
      itemType: 'rectangle'
    }
  });
}

async function onGranularityChange(val: 'day' | 'week' | 'month') {
  const res = await getTrendData({ granularity: val });
  trendData.value = res.data || [];
  renderTrendChart();
}

// ─── 漏斗数据 ────────────────────────────────────────────
const pipelineStages = ref<PipelineStage[]>([]);
const funnelChartRef = ref<HTMLElement>();
let funnelChart: echarts.ECharts | null = null;
const funnelColors = ['#3b82f6', '#6366f1', '#8b5cf6', '#22c55e', '#f97316'];

function renderFunnel() {
  if (!funnelChartRef.value || !pipelineStages.value.length) return;
  if (!funnelChart) funnelChart = echarts.init(funnelChartRef.value);
  funnelChart.setOption({
    tooltip: { 
      trigger: 'item', 
      formatter: (p: any) => { 
        const s = pipelineStages.value[p.dataIndex];
        return `${s.name}<br/>数量：${s.value.toLocaleString()}<br/>转化率：${s.rate}%`;
      } 
    },
    series: [{
      name: '转化漏斗', 
      type: 'funnel', 
      left: '10%', 
      top: 16, 
      bottom: 16, 
      width: '80%',
      min: 0, 
      max: Math.max(...pipelineStages.value.map(s => s.value), 1),
      sort: 'descending', 
      gap: 4,
      label: { 
        show: true, 
        position: 'inside', 
        formatter: (p: any) => `${pipelineStages.value[p.dataIndex].name}\n${pipelineStages.value[p.dataIndex].value.toLocaleString()}`, 
        fontSize: 12, 
        color: '#fff',
        fontWeight: 'bold'
      },
      itemStyle: { 
        borderColor: '#fff', 
        borderWidth: 2 
      },
      data: pipelineStages.value.map((s, i) => ({ 
        value: s.value, 
        name: s.name, 
        itemStyle: { color: funnelColors[i % funnelColors.length] } 
      }))
    }]
  });
}

// ─── 平台分布 ────────────────────────────────────────────
const platformData = ref<ContentByPlatform[]>([]);
const pieChartRef = ref<HTMLElement>();
let pieChart: echarts.ECharts | null = null;
const platformColors: Record<string, string> = { tiktok: '#3b82f6', xiaohongshu: '#ef4444', douyin: '#22c55e' };

function getPlatformColor(code: string) {
  return platformColors[code] || '#8b5cf6';
}

function renderPie() {
  if (!pieChartRef.value || !platformData.value.length) return;
  if (!pieChart) pieChart = echarts.init(pieChartRef.value);
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie', radius: ['45%', '72%'], center: ['50%', '50%'],
      label: { show: false },
      data: platformData.value.map(p => ({
        name: p.platform_name, value: p.total,
        itemStyle: { color: getPlatformColor(p.platform_code) },
      })),
    }],
  });
}

// ─── 最近任务 ────────────────────────────────────────────
const recentTasks = ref<RecentTask[]>([]);

const taskTypeMap: Record<string, string> = { scrape: '爬虫任务', message: '私信任务', reply: '评论回复' };
const statusMap: Record<string, { label: string; type: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
  pending: { label: '待启动', type: 'warning' }, queued: { label: '排队中', type: 'info' },
  running: { label: '执行中', type: 'info' }, success: { label: '已完成', type: 'success' },
  completed: { label: '已完成', type: 'success' }, failed: { label: '失败', type: 'error' },
  cancelled: { label: '已取消', type: 'default' },
};

const taskColumns = [
  { title: '任务类型', key: 'task_type', width: 120, render(row: RecentTask) { return h(NTag, { size: 'small', bordered: false }, () => taskTypeMap[row.task_type] || row.task_type); } },
  { title: '所属项目', key: 'business_line_name', width: 160, ellipsis: { tooltip: true } },
  { title: '状态', key: 'status', width: 100, render(row: RecentTask) { const s = statusMap[row.status] || { label: row.status, type: 'default' as const }; return h(NTag, { size: 'small', type: s.type, round: true }, () => s.label); } },
  { title: '进度', key: 'progress', width: 140, render(row: RecentTask) { const pct = row.total_items > 0 ? Math.round(row.success_items / row.total_items * 100) : 0; return h('div', { style: 'display:flex;align-items:center;gap:8px' }, [h(NProgress, { type: 'line', percentage: pct, height: 6, showIndicator: false, style: 'flex:1' }), h('span', { style: 'font-size:12px;color:#999;white-space:nowrap' }, `${row.success_items}/${row.total_items}`)]); } },
  { title: '创建时间', key: 'created_at', width: 170 },
  { title: '操作', key: 'actions', width: 80, render(row: RecentTask) { return h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => router.push(`/tasks/${row.id}`) }, () => '详情'); } },
];

// ─── 生命周期 ────────────────────────────────────────────
function handleResize() {
  trendChart?.resize();
  funnelChart?.resize();
  pieChart?.resize();
}

onMounted(async () => {
  // 并行加载所有数据
  const [overviewRes, contentsRes, pipelineRes, trendRes, tasksRes] = await Promise.all([
    getOverviewStats(),
    getContentsStats(),
    getPipelineStats(),
    getTrendData({ granularity: 'day' }),
    getRecentTasks({ limit: 5 }),
  ]);

  overview.value = overviewRes;
  platformData.value = contentsRes?.by_platform || [];
  pipelineStages.value = pipelineRes?.stages || [];
  trendData.value = trendRes?.data || [];
  recentTasks.value = tasksRes || [];

  await nextTick();
  renderTrendChart();
  renderFunnel();
  renderPie();

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  funnelChart?.dispose();
  pieChart?.dispose();
});
</script>

<style lang="less" scoped>
.console-dashboard {
  padding: 0;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
}

/* KPI 卡片 */
.kpi-card {
  display: flex;
  align-items: center;
  gap: 16px;
}
.kpi-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-body {
  flex: 1;
  min-width: 0;
}
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1a1a;
}
.kpi-label {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}
.kpi-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
.kpi-sub {
  font-size: 12px;
  color: #999;
}

/* 漏斗转化率 */
.pipeline-stages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.stage-name {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.stage-value {
  font-size: 16px;
  color: #333;
  font-weight: 700;
}

.stage-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-rate {
  font-size: 12px;
  color: #999;
  min-width: 40px;
  text-align: right;
}

.funnel-rates {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.funnel-rate-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.funnel-name {
  width: 72px;
  color: #666;
  flex-shrink: 0;
}
.funnel-val {
  width: 56px;
  text-align: right;
  color: #333;
  font-weight: 600;
  flex-shrink: 0;
}
.funnel-pct {
  width: 48px;
  text-align: right;
  color: #999;
  flex-shrink: 0;
}

/* 平台列表 */
.platform-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
}

.platform-list.compact {
  gap: 10px;
  padding: 10px 14px;
}

.platform-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.platform-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.platform-name {
  flex: 1;
  font-size: 13px;
  color: #666;
}
.platform-count {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 统一卡片高度 */
.console-dashboard > .n-card:first-child {
  min-height: 120px; /* KPI 卡片 */
}

.dashboard-trend-card {
  min-height: 320px; /* 趋势图 */
}

.dashboard-funnel-section {
  min-height: 350px; /* 漏斗 section */
}

.dashboard-platform-section {
  min-height: 350px; /* 平台分布 */
}

.dashboard-task-section {
  min-height: 250px; /* 最近任务 */
}
</style>
