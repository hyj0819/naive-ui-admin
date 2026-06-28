<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="趋势分析">
        查看用户、内容、任务的趋势变化
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <n-space vertical style="width: 100%">
        <n-button-group>
          <n-button @click="loadTrend(7)">近7天</n-button>
          <n-button @click="loadTrend(14)">近14天</n-button>
          <n-button @click="loadTrend(30)">近30天</n-button>
        </n-button-group>
        <n-grid :cols="3" class="mt-4">
          <n-grid-item>
            <n-card title="用户增长趋势">
              <n-space vertical>
                <div v-for="item in trendData" :key="item.date" class="flex justify-between">
                  <span>{{ item.date }}</span>
                  <n-tag>{{ item.contacts }}</n-tag>
                </div>
              </n-space>
            </n-card>
          </n-grid-item>
          <n-grid-item>
            <n-card title="内容增长趋势">
              <n-space vertical>
                <div v-for="item in trendData" :key="item.date" class="flex justify-between">
                  <span>{{ item.date }}</span>
                  <n-tag type="info">{{ item.contents }}</n-tag>
                </div>
              </n-space>
            </n-card>
          </n-grid-item>
          <n-grid-item>
            <n-card title="任务完成趋势">
              <n-space vertical>
                <div v-for="item in trendData" :key="item.date" class="flex justify-between">
                  <span>{{ item.date }}</span>
                  <n-tag type="success">{{ item.tasks }}</n-tag>
                </div>
              </n-space>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-space>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';

interface TrendData {
  date: string;
  contacts: number;
  contents: number;
  tasks: number;
}

const trendData = ref<TrendData[]>([]);

function generateTrendData(days: number): TrendData[] {
  const data: TrendData[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      contacts: Math.floor(Math.random() * 50) + 10,
      contents: Math.floor(Math.random() * 30) + 5,
      tasks: Math.floor(Math.random() * 20) + 2,
    });
  }
  return data;
}

async function loadTrend(days: number) {
  trendData.value = generateTrendData(days);
}

onMounted(async () => {
  await loadTrend(7);
});
</script>

<style lang="less" scoped></style>