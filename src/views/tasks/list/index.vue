<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="任务列表">
        查看所有任务的执行状态和历史记录
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <!-- 左侧操作区 + 右侧筛选条件 -->
      <div class="filter-bar mb-4">
        <n-space align="flex-start">
          <!-- 右侧：筛选条件 -->
          <n-space align="flex-start" style="flex: 1; margin-left: auto;">
            <n-select
              v-model:value="filterParams.task_type"
              placeholder="任务类型"
              :options="taskTypeOptions"
              clearable
              style="width: 140px"
            />
            <n-select
              v-model:value="filterParams.business_line_id"
              placeholder="项目"
              :options="businessLineOptions"
              clearable
              style="width: 160px"
            />
            <n-select
              v-model:value="filterParams.status"
              placeholder="状态"
              :options="statusOptions"
              clearable
              style="width: 120px"
            />
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-space>
      </div>

      <!-- 创建任务按钮（在查询表单下方） -->
      <div class="mb-4">
        <n-button type="primary" @click="goCreate">
          <template #icon>
            <n-icon><PlusOutlined /></n-icon>
          </template>
          创建新任务
        </n-button>
      </div>

      <!-- 批量操作按钮组 -->
      <n-space v-if="checkedRowKeys.length > 0" class="mb-4">
        <n-button type="primary" danger @click="handleBatchDelete">
          <template #icon>
            <n-icon><DeleteOutlined /></n-icon>
          </template>
          批量删除 ({{ checkedRowKeys.length }})
        </n-button>
        <n-button @click="checkedRowKeys = []">取消选择</n-button>
      </n-space>

      <!-- 表格 -->
      <BasicTable
        :columns="columns"
        :request="loadDataTable"
        :row-key="(row) => row.id"
        ref="actionRef"
        :actionColumn="actionColumn"
        :pagination="{ pageSize: 20 }"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheckedRowKeysChange"
        :row-class-name="rowClassName"
      />
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, computed, onMounted } from 'vue';
import { useMessage, useDialog, NTag, NProgress, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined, DeleteOutlined } from '@vicons/antd';
import {
  getTaskList,
  startTask,
  stopTask,
  retryTask,
  deleteTask,
  deleteTaskBatch,
  type TaskExecution,
  type TaskListParams,
} from '@/api/tasks';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const businessLineList = ref<BusinessLine[]>([]);
const checkedRowKeys = ref<number[]>([]);

const filterParams = reactive<TaskListParams>({
  task_type: undefined,
  business_line_id: undefined,
  status: undefined,
});

const taskTypeOptions = [
  { label: '爬虫任务', value: 'scrape' },
  { label: '触达任务', value: 'reach' },
  { label: '私信任务', value: 'message' },
  { label: '回复任务', value: 'reply' },
];

const statusOptions = [
  { label: '待执行', value: 'pending' },
  { label: '排队中', value: 'queued' },
  { label: '运行中', value: 'running' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '已取消', value: 'cancelled' },
];

const businessLineOptions = computed(() =>
  businessLineList.value.map((bl) => ({
    label: `${bl.platform_name}-${bl.name}`,
    value: bl.id,
  }))
);

onMounted(async () => {
  businessLineList.value = await getBusinessLineListRaw();
});

// 状态配置
const statusConfig: Record<string, { label: string; type: string }> = {
  pending: { label: '待执行', type: 'default' },
  queued: { label: '排队中', type: 'info' },
  running: { label: '运行中', type: 'info' },
  success: { label: '成功', type: 'success' },
  failed: { label: '失败', type: 'error' },
  cancelled: { label: '已取消', type: 'warning' },
};

const typeMap: Record<string, string> = {
  scrape: '爬虫任务',
  reach: '触达任务',
  message: '私信任务',
  reply: '回复任务',
};

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '任务名称', key: 'task_name', width: 160, ellipsis: { tooltip: true } },
  {
    title: '类型',
    key: 'task_type',
    width: 90,
    render(row: TaskExecution) {
      return typeMap[row.task_type] || row.task_type;
    },
  },
  {
    title: '项目',
    key: 'business_line',
    width: 140,
    render(row: TaskExecution) {
      return row.platform_name && row.business_line_name
        ? `${row.platform_name}/${row.business_line_name}`
        : '-';
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: TaskExecution) {
      const cfg = statusConfig[row.status] || { label: row.status, type: 'default' };
      return h(NTag, { type: cfg.type as any, size: 'small', round: true }, { default: () => cfg.label });
    },
  },
  {
    title: '进度',
    key: 'progress',
    width: 140,
    render(row: TaskExecution) {
      const statusType = row.status === 'running' ? 'info' : row.status === 'success' ? 'success' : row.status === 'failed' ? 'error' : 'default';
      return h(NProgress, {
        type: 'line',
        percentage: row.progress,
        status: statusType as any,
        showIndicator: true,
        height: 8,
      });
    },
  },
  {
    title: '成功/失败',
    key: 'result',
    width: 100,
    render(row: TaskExecution) {
      return `${row.success_items}/${row.failed_items}`;
    },
  },
  { title: '创建时间', key: 'created_at', width: 160 },
];

const actionColumn = reactive({
  width: 280,
  title: '操作',
  key: 'action',
  fixed: 'right' as const,
  render(record: TaskExecution) {
    return h(TableAction, {
      style: 'button',
      actions: [
        { label: '详情', onClick: () => handleDetail(record), type: 'info' }, // Info 色
        {
          label: '报告',
          onClick: () => handleReport(record),
          ifShow: () => ['success', 'failed', 'cancelled'].includes(record.status),
          type: 'primary', // Primary 色
        },
        {
          label: '启动',
          onClick: () => handleStart(record),
          ifShow: () => record.status === 'pending',
          type: 'success', // Success 色
        },
        {
          label: '停止',
          onClick: () => handleStop(record),
          ifShow: () => record.status === 'running' || record.status === 'queued',
          type: 'warning', // Warning 色
        },
        {
          label: '重新执行',
          onClick: () => handleRetry(record),
          ifShow: () => record.status === 'failed' || record.status === 'cancelled',
          type: 'primary', // Primary 色
        },
        {
          label: '删除',
          onClick: () => handleDelete(record),
          ifShow: () => record.status !== 'running',
          type: 'error', // Error 色
        },
      ],
    });
  },
});

const loadDataTable = async (res: any) => {
  const params: TaskListParams = {
    ...filterParams,
    page: res?.page || 1,
    page_size: res?.pageSize || 20,
  };
  return await getTaskList(params);
};

function handleSearch() {
  actionRef.value?.reload();
  checkedRowKeys.value = [];
}

function handleReset() {
  filterParams.task_type = undefined;
  filterParams.business_line_id = undefined;
  filterParams.status = undefined;
  actionRef.value?.reload();
  checkedRowKeys.value = [];
}

function handleCheckedRowKeysChange(keys: number[]) {
  checkedRowKeys.value = keys;
}

function rowClassName(row: TaskExecution) {
  if (row.status === 'running') {
    return 'n-data-table-row--disabled';
  }
  return '';
}

function goCreate() {
  router.push('/tasks/create');
}

function handleDetail(record: TaskExecution) {
  router.push(`/tasks/${record.id}`);
}

function handleReport(record: TaskExecution) {
  router.push(`/tasks/${record.id}/report`);
}

async function handleStart(record: TaskExecution) {
  try {
    await startTask(record.id);
    message.success('任务已加入执行队列');
    actionRef.value?.reload();
  } catch (error) {
    // handled globally
  }
}

function handleStop(record: TaskExecution) {
  dialog.warning({
    title: '确认停止',
    content: `确定要停止任务「${record.task_name || '#' + record.id}」吗？`,
    positiveText: '确认停止',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await stopTask(record.id);
        message.success('任务已停止');
        actionRef.value?.reload();
      } catch (error) {
        // handled globally
      }
    },
  });
}

async function handleRetry(record: TaskExecution) {
  try {
    await retryTask(record.id);
    message.success('任务已重新加入执行队列');
    actionRef.value?.reload();
  } catch (error) {
    // handled globally
  }
}

function handleDelete(record: TaskExecution) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除任务「${record.task_name || '#' + record.id}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteTask(record.id);
        message.success('删除成功');
        actionRef.value?.reload();
      } catch (error) {
        // handled globally
      }
    },
  });
}

function handleBatchDelete() {
  dialog.warning({
    title: '批量删除确认',
    content: `确定要删除选中的 ${checkedRowKeys.value.length} 个任务吗？删除后不可恢复。运行中的任务将被跳过。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteTaskBatch(checkedRowKeys.value);
        message.success(`成功删除 ${checkedRowKeys.value.length} 个任务`);
        checkedRowKeys.value = [];
        actionRef.value?.reload();
      } catch (error) {
        // handled globally
      }
    },
  });
}
</script>

<style lang="less" scoped>
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
</style>