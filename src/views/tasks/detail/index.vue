<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="任务详情">
        查看任务的详细执行日志和结果
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <div v-if="task" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <n-descriptions title="基本信息" :column="1">
            <n-descriptions-item label="任务类型">{{ taskTypeLabel }}</n-descriptions-item>
            <n-descriptions-item label="所属业务线">{{ task.business_line_name }}</n-descriptions-item>
            <n-descriptions-item label="状态">{{ statusLabel }}</n-descriptions-item>
          </n-descriptions>
          <n-descriptions title="执行统计" :column="1">
            <n-descriptions-item label="总项数">{{ task.total_items }}</n-descriptions-item>
            <n-descriptions-item label="成功">{{ task.success_items }}</n-descriptions-item>
            <n-descriptions-item label="失败">{{ task.failed_items }}</n-descriptions-item>
            <n-descriptions-item label="成功率">{{ successRate }}%</n-descriptions-item>
          </n-descriptions>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <n-descriptions title="时间信息" :column="1">
            <n-descriptions-item label="创建时间">{{ task.created_at }}</n-descriptions-item>
            <n-descriptions-item label="开始时间">{{ task.start_time || '-' }}</n-descriptions-item>
            <n-descriptions-item label="结束时间">{{ task.end_time || '-' }}</n-descriptions-item>
          </n-descriptions>
          <n-descriptions title="错误信息" :column="1">
            <n-descriptions-item label="错误详情">{{ task.error_message || '-' }}</n-descriptions-item>
          </n-descriptions>
        </div>
        <n-card title="执行日志" v-if="task.execution_log">
          <n-scrollbar style="max-height: 400px;">
            <pre class="text-sm text-gray-600 whitespace-pre-wrap">{{ task.execution_log }}</pre>
          </n-scrollbar>
        </n-card>
      </div>
      <div class="mt-8 flex justify-end">
        <n-button type="info" ghost @click="goBack">返回</n-button>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getTask, type TaskExecution } from '@/api/tasks';

const route = useRoute();
const router = useRouter();
const task = ref<TaskExecution | null>(null);

const taskTypeLabel = computed(() => {
  if (!task.value) return '';
  const typeMap: Record<string, string> = {
    scrape: '爬虫任务',
    message: '私信任务',
    analyze: '分析任务',
  };
  return typeMap[task.value.task_type] || task.value.task_type;
});

const statusLabel = computed(() => {
  if (!task.value) return '';
  const statusMap: Record<string, string> = {
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    partial: '部分完成',
    failed: '失败',
  };
  return statusMap[task.value.status] || task.value.status;
});

const successRate = computed(() => {
  if (!task.value || task.value.total_items === 0) return 0;
  return Math.round((task.value.success_items / task.value.total_items) * 100);
});

onMounted(async () => {
  const id = parseInt(route.params.id as string);
  task.value = await getTask(id);
});

function goBack() {
  router.push('/tasks/list');
}
</script>

<style lang="less" scoped></style>