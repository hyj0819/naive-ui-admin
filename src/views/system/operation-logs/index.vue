<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="操作日志">
        查看系统所有操作记录，支持按类型、时间筛选
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <n-form inline :model="filterParams" class="filter-form">
        <n-form-item label="操作类型">
          <n-select
            v-model:value="filterParams.operation_type"
            placeholder="全部"
            :options="operationTypeOptions"
            clearable
            style="width: 160px"
          />
        </n-form-item>
        <n-form-item label="目标类型">
          <n-select
            v-model:value="filterParams.target_type"
            placeholder="全部"
            :options="targetTypeOptions"
            clearable
            style="width: 140px"
          />
        </n-form-item>
        <n-form-item label="日期范围">
          <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 260px" />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
            <n-button @click="handleExport" :loading="exportLoading">导出</n-button>
          </n-space>
        </n-form-item>
      </n-form>

      <BasicTable
        :columns="columns"
        :request="loadDataTable"
        :row-key="(row) => row.id"
        ref="actionRef"
        :pagination="pagination"
      />
    </n-card>

    <!-- 导出弹窗 -->
    <n-modal v-model:show="showExportModal" preset="card" title="导出操作日志" style="width: 600px;">
      <n-data-table
        :columns="exportColumns"
        :data="exportData"
        :bordered="true"
        :single-line="false"
        max-height="400"
        size="small"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="showExportModal = false">关闭</n-button>
          <n-button type="primary" @click="downloadCSV">下载 CSV</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { BasicTable } from '@/components/Table';
import { getOperationLogList, exportOperationLogs, getLogTypes, type OperationLog } from '@/api/system/operationLogs';

const message = useMessage();
const actionRef = ref();
const exportLoading = ref(false);
const showExportModal = ref(false);
const exportData = ref<OperationLog[]>([]);
const dateRange = ref<[number, number] | null>(null);

const filterParams = reactive({
  operation_type: null as string | null,
  target_type: null as string | null,
});

const operationTypeOptions = ref<{ label: string; value: string }[]>([]);
const targetTypeOptions = ref<{ label: string; value: string }[]>([]);

const pagination = reactive({
  pageSize: 20,
});

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 60,
  },
  {
    title: '操作类型',
    key: 'operation_type',
    width: 140,
    render(row: OperationLog) {
      return h('span', { style: { fontWeight: 'bold' } }, row.operation_type);
    },
  },
  {
    title: '操作人',
    key: 'operator',
    width: 100,
    render(row: OperationLog) {
      return row.operator || '-';
    },
  },
  {
    title: '目标类型',
    key: 'target_type',
    width: 100,
    render(row: OperationLog) {
      const typeMap: Record<string, string> = {
        account: '账号',
        platform: '平台',
        keyword: '关键词',
        prompt: '提示词',
        task: '任务',
      };
      return typeMap[row.target_type] || row.target_type || '-';
    },
  },
  {
    title: '详情',
    key: 'operation_detail',
    ellipsis: true,
    render(row: OperationLog) {
      return row.operation_detail || '-';
    },
  },
  {
    title: 'IP地址',
    key: 'ip_address',
    width: 130,
    render(row: OperationLog) {
      return row.ip_address || '-';
    },
  },
  {
    title: '时间',
    key: 'created_at',
    width: 170,
  },
];

const exportColumns = [
  { title: 'ID', key: 'id' },
  { title: '操作类型', key: 'operation_type' },
  { title: '操作人', key: 'operator' },
  { title: '目标类型', key: 'target_type' },
  { title: '详情', key: 'operation_detail' },
  { title: 'IP', key: 'ip_address' },
  { title: '时间', key: 'created_at' },
];

function buildQueryParams() {
  const params: Record<string, any> = {};
  if (filterParams.operation_type) {
    params.operation_type = filterParams.operation_type;
  }
  if (filterParams.target_type) {
    params.target_type = filterParams.target_type;
  }
  if (dateRange.value) {
    params.start_date = new Date(dateRange.value[0]).toISOString().split('T')[0];
    params.end_date = new Date(dateRange.value[1]).toISOString().split('T')[0];
  }
  return params;
}

const loadDataTable = async (res: any) => {
  const params = {
    ...buildQueryParams(),
    page: res.page || 1,
    page_size: res.pageSize || pagination.pageSize,
  };
  return await getOperationLogList(params);
};

async function loadLogTypes() {
  try {
    const result = await getLogTypes();
    operationTypeOptions.value = (result.operation_types || []).map((t: string) => ({ label: t, value: t }));
    targetTypeOptions.value = (result.target_types || []).map((t: string) => {
      const typeMap: Record<string, string> = {
        account: '账号',
        platform: '平台',
        keyword: '关键词',
        prompt: '提示词',
        task: '任务',
      };
      return { label: typeMap[t] || t, value: t };
    });
  } catch (error) {
    console.error('加载日志类型失败', error);
  }
}

onMounted(() => {
  loadLogTypes();
});

function handleSearch() {
  actionRef.value?.reload();
}

function handleReset() {
  filterParams.operation_type = null;
  filterParams.target_type = null;
  dateRange.value = null;
  actionRef.value?.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const params = buildQueryParams();
    const data = await exportOperationLogs(params);
    exportData.value = data || [];
    showExportModal.value = true;
  } catch (error) {
    message.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
}

function downloadCSV() {
  if (!exportData.value.length) {
    message.warning('没有数据可导出');
    return;
  }

  const headers = ['ID', '操作类型', '操作人', '目标类型', '详情', 'IP地址', '时间'];
  const rows = exportData.value.map((item) => [
    item.id,
    item.operation_type,
    item.operator || '',
    item.target_type || '',
    item.operation_detail || '',
    item.ip_address || '',
    item.created_at,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `操作日志_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
</script>

<style lang="less" scoped>
.filter-form {
  margin-bottom: 16px;
}
</style>
