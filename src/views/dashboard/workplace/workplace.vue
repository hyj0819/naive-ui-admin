<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="工作台">
        <n-grid cols="2 s:1 m:1 l:2 xl:2 2xl:2" responsive="screen">
          <n-gi>
            <div class="flex items-center">
              <div>
                <n-avatar circle :size="64" :src="schoolboy" />
              </div>
              <div>
                <p class="px-4 text-xl">早安，管理员，开始您一天的工作吧！</p>
                <p class="px-4 text-gray-400">{{ currentDate }}</p>
              </div>
            </div>
          </n-gi>
          <n-gi>
            <div class="flex justify-end w-full">
              <div class="flex flex-col justify-center flex-1 text-right">
                <span class="text-secondary">总用户</span>
                <span class="text-2xl">{{ overviewStats.total_contacts }}</span>
              </div>
              <div class="flex flex-col justify-center flex-1 text-right">
                <span class="text-secondary">总内容</span>
                <span class="text-2xl">{{ overviewStats.total_contents }}</span>
              </div>
              <div class="flex flex-col justify-center flex-1 text-right">
                <span class="text-secondary">运行中任务</span>
                <span class="text-2xl">{{ overviewStats.running_tasks }}</span>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </n-card>
    </div>
    <n-grid class="mt-4" cols="2 s:1 m:1 l:2 xl:2 2xl:2" responsive="screen" :x-gap="12" :y-gap="9">
      <n-gi>
        <n-card :bordered="false" size="small" title="数据概览">
          <div class="grid grid-cols-2 gap-4">
            <n-statistic label="总采集内容" :value="overviewStats.total_contents" />
            <n-statistic label="总触达用户" :value="overviewStats.total_contacts" />
            <n-statistic label="已联系" :value="overviewStats.contacted" />
            <n-statistic label="已转化" :value="overviewStats.converted" />
            <n-statistic label="运行中任务" :value="overviewStats.running_tasks" />
          </div>
        </n-card>

        <n-card :bordered="false" size="small" title="最近任务" class="mt-4">
          <n-list v-if="recentTasks.length > 0">
            <n-list-item v-for="task in recentTasks" :key="task.id">
              <n-thing :title="getTaskTypeLabel(task.task_type)" :description="task.created_at">
                <template #header-extra>
                  <n-tag :type="getTaskStatusType(task.status)">{{ getTaskStatusLabel(task.status) }}</n-tag>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
          <n-empty v-else description="暂无任务记录" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" size="small" title="用户触达状态">
          <div class="space-y-3">
            <n-progress type="line" :percentage="overviewStats.contact_rate" status="success">
              <template #indicator-text>触达率: {{ overviewStats.contact_rate }}%</template>
            </n-progress>
            <div class="flex justify-between text-sm">
              <span>已联系</span>
              <span class="text-gray-500">{{ overviewStats.contacted }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>已转化</span>
              <span class="text-gray-500">{{ overviewStats.converted }}</span>
            </div>
          </div>
        </n-card>
        <n-card :bordered="false" size="small" title="热门关键词" class="mt-4">
          <n-list v-if="topKeywords.length > 0">
            <n-list-item v-for="kw in topKeywords" :key="kw.keyword">
              <n-thing :title="kw.keyword" :description="kw.business_line_name">
                <template #header-extra>
                  <n-tag>{{ kw.matched_contents }}</n-tag>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
          <n-empty v-else description="暂无关键词数据" />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script lang="ts">
  export default { name: 'DashboardWorkplace' };
</script>

<script lang="ts" setup>
  import { reactive, ref, computed, onMounted } from 'vue';
  import schoolboy from '@/assets/images/schoolboy.png';
  import { getOverviewStats, getRecentTasks, getTopKeywords, type OverviewStats, type RecentTask, type TopKeyword } from '@/api/stats';

  const overviewStats = reactive<OverviewStats>({
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

  const recentTasks = ref<RecentTask[]>([]);
  const topKeywords = ref<TopKeyword[]>([]);

  const currentDate = computed(() => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  });

  function getTaskTypeLabel(taskType: string) {
    const typeMap: Record<string, string> = {
      content_collect: '内容采集',
      ai_analysis: 'AI分析',
      contact: '用户触达',
      content_generate: '内容生成',
    };
    return typeMap[taskType] || taskType;
  }

  function getTaskStatusLabel(status: string) {
    const statusMap: Record<string, string> = {
      pending: '待执行',
      running: '执行中',
      completed: '已完成',
      partial: '部分完成',
      failed: '失败',
    };
    return statusMap[status] || status;
  }

  function getTaskStatusType(status: string): 'warning' | 'info' | 'success' | 'error' {
    const typeMap: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
      pending: 'warning',
      running: 'info',
      completed: 'success',
      partial: 'info',
      failed: 'error',
    };
    return typeMap[status] || 'info';
  }

  onMounted(async () => {
    Object.assign(overviewStats, await getOverviewStats());
    recentTasks.value = await getRecentTasks({ limit: 5 });
    topKeywords.value = await getTopKeywords({ limit: 5 });
  });
</script>

<style lang="less" scoped></style>
