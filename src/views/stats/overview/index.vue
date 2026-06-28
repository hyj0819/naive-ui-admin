<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="数据概览">
        查看系统整体运营数据概览
      </n-card>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-4">
      <n-card class="proCard">
        <n-statistic label="平台数量" :value="overviewStats.platforms.total" />
      </n-card>
      <n-card class="proCard">
        <n-statistic label="业务线数量" :value="overviewStats.business_lines.total" />
      </n-card>
      <n-card class="proCard">
        <n-statistic label="关键词数量" :value="overviewStats.keywords.total" />
      </n-card>
      <n-card class="proCard">
        <n-statistic label="触达用户数" :value="overviewStats.contacts.total" />
      </n-card>
      <n-card class="proCard">
        <n-statistic label="内容数据数" :value="overviewStats.contents.total" />
      </n-card>
      <n-card class="proCard">
        <n-statistic label="活跃模型数" :value="overviewStats.ai_models.active" />
      </n-card>
      <n-card class="proCard">
        <n-statistic label="运行中任务" :value="overviewStats.tasks.running" />
      </n-card>
      <n-card class="proCard">
        <n-statistic label="已完成任务" :value="overviewStats.tasks.completed" />
      </n-card>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-4">
      <n-card class="proCard" title="用户触达状态">
        <div class="space-y-3">
          <n-progress type="line" :percentage="overviewStats.contacts.contact_rate" status="success">
            <template #indicator-text>触达率: {{ overviewStats.contacts.contact_rate }}%</template>
          </n-progress>
          <div class="flex justify-between text-sm">
            <span>待触达</span>
            <span class="text-gray-500">{{ overviewStats.contacts.pending }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>已触达</span>
            <span class="text-gray-500">{{ overviewStats.contacts.contacted }}</span>
          </div>
        </div>
      </n-card>
      <n-card class="proCard" title="平台用户分布">
        <n-space vertical style="width: 100%">
          <n-progress v-for="item in contactsByPlatform" :key="item.platform_code" :type="'line'" :percentage="getPercentage(item.total, totalContacts)">
            <template #indicator-text>{{ item.platform_name }}: {{ item.total }}</template>
          </n-progress>
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { getOverviewStats, getContactsByPlatform, type OverviewStats, type ContactByPlatform } from '@/api/stats';

const overviewStats = reactive<OverviewStats>({
  platforms: { total: 0 },
  business_lines: { total: 0 },
  keywords: { total: 0 },
  contacts: { total: 0, contacted: 0, pending: 0, contact_rate: 0 },
  contents: { total: 0 },
  ai_models: { active: 0 },
  tasks: { running: 0, completed: 0 },
});

const contactsByPlatform = ref<ContactByPlatform[]>([]);

const totalContacts = computed(() => contactsByPlatform.value.reduce((sum, item) => sum + item.total, 0));

function getPercentage(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

onMounted(async () => {
  Object.assign(overviewStats, await getOverviewStats());
  contactsByPlatform.value = await getContactsByPlatform();
});
</script>

<style lang="less" scoped></style>