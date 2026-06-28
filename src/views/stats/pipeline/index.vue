<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="转化漏斗">
        查看用户从发现到转化的完整漏斗分析
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <div class="flex flex-col items-center space-y-4">
        <n-space v-for="(stage, index) in pipelineStages" :key="stage.name" class="w-full">
          <n-card :style="{ width: stage.width + '%', background: stage.color }" class="text-center">
            <n-statistic :label="stage.name" :value="stage.value" />
            <div v-if="index > 0" class="mt-2 text-sm text-gray-600">
              转化率: {{ stage.rate }}%
            </div>
          </n-card>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { getOverviewStats, type OverviewStats } from '@/api/stats';

interface PipelineStage {
  name: string;
  value: number;
  width: number;
  color: string;
  rate: number;
}

const pipelineStages = ref<PipelineStage[]>([]);

onMounted(async () => {
  const stats = await getOverviewStats();
  const total = stats.contacts.total || 1;
  pipelineStages.value = [
    {
      name: '总用户数',
      value: stats.contacts.total,
      width: 100,
      color: '#eef2ff',
      rate: 100,
    },
    {
      name: '待触达',
      value: stats.contacts.pending,
      width: Math.round((stats.contacts.pending / total) * 100),
      color: '#dbeafe',
      rate: Math.round((stats.contacts.pending / total) * 100),
    },
    {
      name: '已触达',
      value: stats.contacts.contacted,
      width: Math.round((stats.contacts.contacted / total) * 100),
      color: '#dcfce7',
      rate: Math.round((stats.contacts.contacted / total) * 100),
    },
    {
      name: '触达率',
      value: stats.contacts.contact_rate,
      width: Math.round(stats.contacts.contact_rate),
      color: '#fef9c3',
      rate: Math.round(stats.contacts.contact_rate),
    },
  ];
});
</script>

<style lang="less" scoped></style>