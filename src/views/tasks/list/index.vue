<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="任务列表">
        查看所有任务的执行状态和历史记录
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <BasicTable
        :columns="columns"
        :request="loadDataTable"
        :row-key="(row) => row.id"
        ref="actionRef"
        :actionColumn="actionColumn"
      >
        <template #tableTitle>
          <n-button type="primary" @click="goCreate">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            创建任务
          </n-button>
        </template>
      </BasicTable>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h } from 'vue';
import { useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import { getTaskList, deleteTask, startTask, completeTask, type TaskExecution } from '@/api/tasks';

const router = useRouter();
const message = useMessage();
const actionRef = ref();

const columns = [
  {
    title: '任务类型',
    key: 'task_type',
    width: 120,
    render(row: TaskExecution) {
      const typeMap: Record<string, string> = {
        scrape: '爬虫任务',
        message: '私信任务',
        analyze: '分析任务',
      };
      return typeMap[row.task_type] || row.task_type;
    },
  },
  {
    title: '所属业务线',
    key: 'business_line_name',
    width: 150,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: TaskExecution) {
      const statusMap: Record<string, string> = {
        pending: '待执行',
        running: '执行中',
        completed: '已完成',
        partial: '部分完成',
        failed: '失败',
      };
      return statusMap[row.status] || row.status;
    },
  },
  {
    title: '总数',
    key: 'total_items',
    width: 80,
  },
  {
    title: '成功',
    key: 'success_items',
    width: 80,
  },
  {
    title: '失败',
    key: 'failed_items',
    width: 80,
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
  },
];

const actionColumn = reactive({
  width: 300,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: TaskExecution) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '详情',
          onClick: handleDetail.bind(null, record),
        },
        {
          label: '启动',
          onClick: handleStart.bind(null, record),
          ifShow: () => record.status === 'pending',
        },
        {
          label: '完成',
          onClick: handleComplete.bind(null, record),
          ifShow: () => record.status === 'running',
        },
        {
          label: '删除',
          onClick: handleDelete.bind(null, record),
        },
      ],
    });
  },
});

const loadDataTable = async (res: any) => {
  return await getTaskList(res);
};

function goCreate() {
  router.push('/tasks/create');
}

function handleDetail(record: TaskExecution) {
  router.push(`/tasks/${record.id}`);
}

async function handleStart(record: TaskExecution) {
  try {
    await startTask(record.id);
    message.success('任务已启动');
    actionRef.value.reload();
  } catch (error) {
    message.error('启动失败');
  }
}

async function handleComplete(record: TaskExecution) {
  try {
    await completeTask(record.id, { success_items: record.success_items, failed_items: record.failed_items });
    message.success('任务已完成');
    actionRef.value.reload();
  } catch (error) {
    message.error('操作失败');
  }
}

async function handleDelete(record: TaskExecution) {
  try {
    await deleteTask(record.id);
    message.success('删除成功');
    actionRef.value.reload();
  } catch (error) {
    message.error('删除失败');
  }
}
</script>

<style lang="less" scoped></style>