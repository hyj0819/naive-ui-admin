<template>
  <div>
    <!-- 页面标题 + 筛选栏 -->
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="趋势分析">
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
            <n-button-group>
              <n-button
                v-for="g in granularityOptions"
                :key="g.value"
                :type="granularity === g.value ? 'primary' : 'default'"
                @click="changeGranularity(g.value)"
              >
                {{ g.label }}
              </n-button>
            </n-button-group>
          </n-space>
        </template>
        查看用户、内容、任务的趋势变化
      </n-card>
    </div>

    <!-- 折线图 -->
    <n-card class="mt-4 proCard" title="数据趋势">
      <div ref="trendChartRef" style="height: 420px"></div>
    </n-card>

    <!-- 数据明细表 -->
    <n-card class="mt-4 proCard" title="数据明细">
      <n-data-table
        :columns="columns"
        :data="tableData"
        :bordered="false"
        :pagination="{ pageSize: 15 }"
        size="small"
      />
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import { getTrendData, type TrendItem } from '@/api/stats';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

// ─── 筛选条件 ────────────────────────────────────────
const filterBusinessLineId = ref<number | null>(null);
const dateRange = ref<[number, number] | null>(null);
const granularity = ref<'day' | 'week' | 'month'>('day');
const businessLineOptions = ref<{ label: string; value: number }[]>([]);

const granularityOptions = [
  { label: '日', value: 'day' as const },
  { label: '周', value: 'week' as const },
  { label: '月', value: 'month' as const },
];

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
  granularity: granularity.value,
}));

// ─── 数据 ────────────────────────────────────────────
const trendData = ref<TrendItem[]>([]);

const tableData = computed(() =>
  trendData.value.map(d => ({
    date: d.date,
    contents: d.contents,
    contacts: d.contacts,
    messages: d.messages,
  }))
);

const columns = [
  { title: '日期', key: 'date', width: 140 },
  { title: '新增采集内容', key: 'contents', width: 130 },
  { title: '新增触达用户', key: 'contacts', width: 130 },
  { title: '发送私信数', key: 'messages', width: 120 },
];

// ─── ECharts ──────────────────────────────────────────
const trendChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;

function renderChart() {
  if (!trendChartRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendChartRef.value);

  const dates = trendData.value.map(d => d.date);
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增采集内容', '新增触达用户', '发送私信数'], bottom: 0 },
    grid: { left: 60, right: 30, top: 30, bottom: 50 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: dates.length > 20 ? 45 : 0, fontSize: 11 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '新增采集内容',
        type: 'line',
        smooth: true,
        data: trendData.value.map(d => d.contents),
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#3b82f6' },
      },
      {
        name: '新增触达用户',
        type: 'line',
        smooth: true,
        data: trendData.value.map(d => d.contacts),
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#22c55e' },
      },
      {
        name: '发送私信数',
        type: 'line',
        smooth: true,
        data: trendData.value.map(d => d.messages),
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#f97316' },
      },
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
    const result = await getTrendData(filterParams.value);
    trendData.value = result.data || [];
    await nextTick();
    renderChart();
  } catch (e) {
    console.error('加载趋势数据失败:', e);
  }
}

function changeGranularity(g: 'day' | 'week' | 'month') {
  granularity.value = g;
  loadData();
}

function handleResize() {
  trendChart?.resize();
}

onMounted(async () => {
  await loadBusinessLines();
  await nextTick();
  renderChart();
  await loadData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
});
</script>

<style lang="less" scoped></style>