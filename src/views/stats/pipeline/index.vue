<template>
  <div>
    <!-- 页面标题 + 筛选栏 -->
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="转化漏斗">
        <template #header-extra>
          <n-space align="center">
            <n-select
              v-model:value="filterBusinessLineId"
              :options="businessLineOptions"
              placeholder="全部项目"
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
        查看用户从发现到转化的完整漏斗分析
      </n-card>
    </div>

    <!-- 漏斗图 -->
    <n-card class="mt-4 proCard" title="转化漏斗图">
      <div ref="funnelChartRef" style="height: 400px"></div>
    </n-card>

    <!-- 漏斗详情表格 -->
    <n-card class="mt-4 proCard" title="漏斗详情">
      <n-table :bordered="false" :single-line="false">
        <thead>
          <tr>
            <th>阶段</th>
            <th>数量</th>
            <th>阶段转化率</th>
            <th>整体转化率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(stage, index) in stages" :key="stage.name">
            <td>{{ stage.name }}</td>
            <td>{{ stage.value.toLocaleString() }}</td>
            <td>
              <n-tag v-if="index === 0" type="info">-</n-tag>
              <n-tag v-else :type="stage.rate >= 50 ? 'success' : stage.rate >= 20 ? 'warning' : 'error'">
                {{ stage.rate }}%
              </n-tag>
            </td>
            <td>
              <n-tag type="info">
                {{ stages.length > 0 ? Math.round((stage.value / stages[0].value) * 100) : 0 }}%
              </n-tag>
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import { getPipelineStats, type PipelineStage } from '@/api/stats';
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
const stages = ref<PipelineStage[]>([]);

// ─── ECharts ──────────────────────────────────────────
const funnelChartRef = ref<HTMLElement>();
let funnelChart: echarts.ECharts | null = null;

function renderFunnel() {
  if (!funnelChartRef.value) return;
  if (!funnelChart) funnelChart = echarts.init(funnelChartRef.value);

  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#22c55e', '#f97316'];
  funnelChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const idx = params.dataIndex;
        const stage = stages.value[idx];
        return `${stage.name}<br/>数量: ${stage.value.toLocaleString()}<br/>阶段转化率: ${stage.rate}%`;
      },
    },
    series: [
      {
        name: '转化漏斗',
        type: 'funnel',
        left: '15%',
        top: 30,
        bottom: 30,
        width: '70%',
        min: 0,
        max: Math.max(...stages.value.map(s => s.value), 1),
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: (p: any) => {
            const stage = stages.value[p.dataIndex];
            return `${stage.name}\n${stage.value.toLocaleString()}`;
          },
          fontSize: 14,
          color: '#fff',
        },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: stages.value.map((s, i) => ({
          value: s.value,
          name: s.name,
          itemStyle: { color: colors[i % colors.length] },
        })),
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
    const result = await getPipelineStats(filterParams.value);
    stages.value = result.stages || [];
    await nextTick();
    renderFunnel();
  } catch (e) {
    console.error('加载漏斗数据失败:', e);
  }
}

function handleResize() {
  funnelChart?.resize();
}

onMounted(async () => {
  await loadBusinessLines();
  await nextTick();
  renderFunnel();
  await loadData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  funnelChart?.dispose();
});
</script>

<style lang="less" scoped></style>