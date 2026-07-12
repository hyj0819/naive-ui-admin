<template>
  <div>
    <!-- 页面标题 + 筛选栏 -->
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="数据概览">
        <template #header-extra>
          <n-space align="center">
            <n-select
              v-model:value="filterBusinessLineId"
              :options="businessLineOptions"
              placeholder="全部业务线"
              clearable
              style="width: 180px"
              @update:value="loadData"
            />
            <n-date-picker
              v-model:value="dateRange"
              type="daterange"
              clearable
              style="width: 260px"
              @update:value="loadData"
            />
          </n-space>
        </template>
        查看系统整体运营数据概览
      </n-card>
    </div>

    <!-- 核心指标卡片 -->
    <div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <n-card class="proCard" size="small">
        <n-statistic label="总采集内容" :value="overview.total_contents" />
      </n-card>
      <n-card class="proCard" size="small">
        <n-statistic label="总触达用户" :value="overview.total_contacts" />
      </n-card>
      <n-card class="proCard" size="small">
        <n-statistic label="已联系" :value="overview.contacted" />
      </n-card>
      <n-card class="proCard" size="small">
        <n-statistic label="已转化" :value="overview.converted" />
      </n-card>
      <n-card class="proCard" size="small">
        <n-statistic label="转化率">
          <template #default>
            <span class="text-lg font-bold text-green-600">{{ overview.conversion_rate }}%</span>
          </template>
        </n-statistic>
      </n-card>
    </div>

    <!-- 趋势折线图 -->
    <n-card class="mt-4 proCard" title="数据趋势（近30天）">
      <div ref="trendChartRef" style="height: 320px"></div>
    </n-card>

    <!-- 转化漏斗 -->
    <n-card class="mt-4 proCard" title="转化漏斗">
      <div ref="funnelChartRef" style="height: 320px"></div>
    </n-card>

    <!-- 底部：平台分布 + 业务线对比 -->
    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <n-card class="proCard" title="平台用户分布">
        <div ref="platformPieRef" style="height: 280px"></div>
      </n-card>
      <n-card class="proCard" title="业务线对比">
        <div ref="businessBarRef" style="height: 280px"></div>
      </n-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
import * as echarts from 'echarts';
import {
  getOverviewStats,
  getContactsStats,
  getContentsStats,
  getPipelineStats,
  getTrendData,
  type OverviewStats,
  type ContactsStatsResult,
  type ContentsStatsResult,
  type PipelineResult,
  type TrendResult,
} from '@/api/stats';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

// ─── 筛选条件 ────────────────────────────────────────
const filterBusinessLineId = ref<number | null>(null);
const dateRange = ref<[number, number] | null>(null);
const businessLineOptions = ref<{ label: string; value: number }[]>([]);

const startDate = computed(() => {
  if (!dateRange.value) return undefined;
  return new Date(dateRange.value[0]).toISOString().slice(0, 10);
});
const endDate = computed(() => {
  if (!dateRange.value) return undefined;
  return new Date(dateRange.value[1]).toISOString().slice(0, 10);
});

const filterParams = computed(() => ({
  business_line_id: filterBusinessLineId.value ?? undefined,
  start_date: startDate.value,
  end_date: endDate.value,
}));

// ─── 数据 ────────────────────────────────────────────
const overview = reactive<OverviewStats>({
  total_contents: 0,
  total_contacts: 0,
  contacted: 0,
  converted: 0,
  ai_passed: 0,
  messaged: 0,
  conversion_rate: 0,
  contact_rate: 0,
  running_tasks: 0,
});

// ─── ECharts 实例 ────────────────────────────────────
const trendChartRef = ref<HTMLElement>();
const funnelChartRef = ref<HTMLElement>();
const platformPieRef = ref<HTMLElement>();
const businessBarRef = ref<HTMLElement>();

let trendChart: echarts.ECharts | null = null;
let funnelChart: echarts.ECharts | null = null;
let platformPie: echarts.ECharts | null = null;
let businessBar: echarts.ECharts | null = null;

function initCharts() {
  if (trendChartRef.value) trendChart = echarts.init(trendChartRef.value);
  if (funnelChartRef.value) funnelChart = echarts.init(funnelChartRef.value);
  if (platformPieRef.value) platformPie = echarts.init(platformPieRef.value);
  if (businessBarRef.value) businessBar = echarts.init(businessBarRef.value);
}

function renderTrendChart(data: TrendResult) {
  if (!trendChart) return;
  const dates = data.data.map(d => d.date);
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增采集内容', '新增触达用户', '发送私信数'], bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: dates, axisLabel: { rotate: dates.length > 15 ? 45 : 0 } },
    yAxis: { type: 'value' },
    series: [
      { name: '新增采集内容', type: 'line', smooth: true, data: data.data.map(d => d.contents), itemStyle: { color: '#3b82f6' } },
      { name: '新增触达用户', type: 'line', smooth: true, data: data.data.map(d => d.contacts), itemStyle: { color: '#22c55e' } },
      { name: '发送私信数', type: 'line', smooth: true, data: data.data.map(d => d.messages), itemStyle: { color: '#f97316' } },
    ],
  });
}

function renderFunnelChart(pipeline: PipelineResult) {
  if (!funnelChart) return;
  funnelChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}: ${params.value} (转化率: ${pipeline.stages[params.dataIndex]?.rate ?? 0}%)`,
    },
    series: [
      {
        name: '转化漏斗',
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 20,
        width: '80%',
        min: 0,
        max: Math.max(...pipeline.stages.map(s => s.value), 1),
        sort: 'descending',
        gap: 2,
        label: { show: true, position: 'inside', formatter: (p: any) => `${p.name}\n${p.value}` },
        data: pipeline.stages.map(s => ({ value: s.value, name: s.name })),
      },
    ],
  });
}

function renderPlatformPie(contactsData: ContactsStatsResult) {
  if (!platformPie) return;
  platformPie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        name: '平台分布',
        type: 'pie',
        radius: ['40%', '65%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        data: contactsData.by_platform.map(p => ({ value: p.total, name: p.platform_name })),
      },
    ],
  });
}

function renderBusinessBar(contactsData: ContactsStatsResult) {
  if (!businessBar) return;
  const labels = contactsData.by_business_line.map(b => `${b.platform_name}/${b.business_line_name}`);
  businessBar.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['总触达', '已联系', '已转化'], bottom: 0 },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: labels, axisLabel: { rotate: 20 } },
    yAxis: { type: 'value' },
    series: [
      { name: '总触达', type: 'bar', data: contactsData.by_business_line.map(b => b.total), itemStyle: { color: '#3b82f6' } },
      { name: '已联系', type: 'bar', data: contactsData.by_business_line.map(b => b.contacted), itemStyle: { color: '#22c55e' } },
      { name: '已转化', type: 'bar', data: contactsData.by_business_line.map(b => b.converted), itemStyle: { color: '#f97316' } },
    ],
  });
}

// ─── 数据加载 ─────────────────────────────────────────
async function loadBusinessLines() {
  try {
    const list = await getBusinessLineListRaw({ status: 1 });
    businessLineOptions.value = list.map((bl: BusinessLine) => ({
      label: `${bl.platform_name} / ${bl.name}`,
      value: bl.id,
    }));
  } catch {
    businessLineOptions.value = [];
  }
}

async function loadData() {
  try {
    const params = filterParams.value;
    const [overviewData, contactsData, pipelineData, trendData] = await Promise.all([
      getOverviewStats(params),
      getContactsStats(params),
      getPipelineStats(params),
      getTrendData({ ...params, granularity: 'day' }),
    ]);

    Object.assign(overview, overviewData);
    await nextTick();
    renderTrendChart(trendData);
    renderFunnelChart(pipelineData);
    renderPlatformPie(contactsData);
    renderBusinessBar(contactsData);
  } catch (e) {
    console.error('加载统计数据失败:', e);
  }
}

function handleResize() {
  trendChart?.resize();
  funnelChart?.resize();
  platformPie?.resize();
  businessBar?.resize();
}

onMounted(async () => {
  await loadBusinessLines();
  await nextTick();
  initCharts();
  await loadData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  funnelChart?.dispose();
  platformPie?.dispose();
  businessBar?.dispose();
});
</script>

<style lang="less" scoped></style>