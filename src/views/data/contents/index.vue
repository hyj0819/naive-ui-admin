<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="内容数据">
        管理从社交媒体上抓取的帖子和内容
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <!-- 筛选栏 -->
      <n-space vertical :size="12">
        <div class="filter-bar">
          <n-select v-model:value="filterParams.platform_id" placeholder="平台" clearable :options="platformOptions" />
          <n-select v-model:value="filterParams.business_line_id" placeholder="项目" clearable :options="businessLineOptions" />
          <n-select v-model:value="filterParams.content_type" placeholder="内容类型" clearable :options="contentTypeOptions" />
          <n-input v-model:value="filterParams.source_keyword" placeholder="来源关键词" clearable @keyup.enter="handleSearch" />
          <div class="filter-actions">
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
            <n-button @click="handleExport">
              <template #icon><n-icon><DownloadOutlined /></n-icon></template>
              导出CSV
            </n-button>
          </div>
        </div>

        <!-- 表格 -->
        <BasicTable
          :columns="columns"
          :request="loadDataTable"
          :row-key="(row) => row.id"
          ref="actionRef"
          :actionColumn="actionColumn"
        />
      </n-space>
    </n-card>

    <!-- 详情弹窗 -->
    <n-modal
      v-model:show="showDetailModal"
      preset="card"
      title="内容详情"
      class="content-detail-modal"
      :style="{ width: '900px' }">
      <template v-if="currentContent">
        <div class="detail-body">
          <div class="detail-col detail-col-left">
            <n-descriptions label-placement="left" bordered :column="1" :label-style="{ width: '90px' }">
              <n-descriptions-item label="标题">{{ currentContent.title || '-' }}</n-descriptions-item>
              <n-descriptions-item label="平台">{{ currentContent.platform_name }}</n-descriptions-item>
              <n-descriptions-item label="所属项目">{{ currentContent.business_line_name }}</n-descriptions-item>
              <n-descriptions-item label="内容类型">
                <n-tag size="small">{{ typeLabel(currentContent.content_type) }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="内容链接">
                <n-a :href="currentContent.content_url" target="_blank">{{ currentContent.content_url }}</n-a>
              </n-descriptions-item>
              <n-descriptions-item label="作者">{{ currentContent.author_name || '-' }}</n-descriptions-item>
              <n-descriptions-item label="来源关键词">{{ currentContent.source_keyword || '-' }}</n-descriptions-item>
              <n-descriptions-item label="采集时间">{{ currentContent.scraped_at }}</n-descriptions-item>
            </n-descriptions>
          </div>

          <div class="detail-col">
            <div class="detail-section">
              <div class="detail-section-title">内容正文</div>
              <n-card embedded :bordered="false" class="content-scroll-card">
                {{ currentContent.content_text || '暂无内容' }}
              </n-card>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">互动数据</div>
              <n-card embedded :bordered="false" class="content-scroll-card">
                <pre class="content-pre">{{ formatJson(currentContent.engagement_stats) }}</pre>
              </n-card>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">AI分析结果</div>
              <n-card embedded :bordered="false" class="content-scroll-card">
                <pre class="content-pre">{{ currentContent.ai_analysis_result || '暂无分析结果' }}</pre>
              </n-card>
            </div>
          </div>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, computed, onMounted, resolveComponent } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { DownloadOutlined } from '@vicons/antd';
import {
  getContentList, deleteContent, getContentExportUrl,
  type Content
} from '@/api/contents';
import { getPlatformListRaw, type Platform } from '@/api/config/platforms';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const platformList = ref<Platform[]>([]);
const businessLineList = ref<BusinessLine[]>([]);
const showDetailModal = ref(false);
const currentContent = ref<Content | null>(null);

const filterParams = reactive({
  platform_id: undefined as number | undefined,
  business_line_id: undefined as number | undefined,
  content_type: undefined as string | undefined,
  source_keyword: '',
});

const platformOptions = computed(() => platformList.value.map(p => ({ label: p.name, value: p.id })));
const businessLineOptions = computed(() => businessLineList.value.map(bl => ({ label: `${bl.platform_name}-${bl.name}`, value: bl.id })));

const contentTypeOptions = [
  { label: '帖子', value: 'post' },
  { label: '评论', value: 'comment' },
  { label: '视频', value: 'video' },
  { label: '图片', value: 'image' },
];

function typeLabel(type: string) {
  const map: Record<string, string> = { post: '帖子', comment: '评论', video: '视频', image: '图片' };
  return map[type] || type;
}

function typeTagType(type: string): 'default' | 'info' | 'success' | 'warning' {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning'> = { post: 'default', comment: 'info', video: 'success', image: 'warning' };
  return map[type] || 'default';
}

function formatJson(str: string | null) {
  if (!str) return '暂无数据';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

const columns = [
  { title: '标题', key: 'title', ellipsis: true, width: 220, minWidth: 120 },
  {
    title: '类型', key: 'content_type', width: 80, minWidth: 60,
    render(row: Content) {
      return h('span', {}, [
        h(resolveComponent('n-tag'), { type: typeTagType(row.content_type), size: 'small' }, () => typeLabel(row.content_type))
      ]);
    },
  },
  { title: '作者', key: 'author_name', width: 120, minWidth: 80, ellipsis: true },
  { title: '平台', key: 'platform_name', width: 100, minWidth: 70 },
  { title: '项目', key: 'business_line_name', width: 110, minWidth: 80, ellipsis: true },
  { title: '来源关键词', key: 'source_keyword', width: 130, minWidth: 80, ellipsis: true },
  { title: '采集时间', key: 'scraped_at', width: 150, minWidth: 100, ellipsis: true },
];

const actionColumn = reactive({
  width: 120,
  title: '操作',
  key: 'action',
  fixed: 'right' as const,
  render(record: Content) {
    return h(TableAction, {
      style: 'button',
      actions: [
        { label: '详情', onClick: handleView.bind(null, record) },
        { label: '删除', onClick: handleDelete.bind(null, record) },
      ],
    });
  },
});

const loadDataTable = async (res: any) => {
  const params: any = { page: res.page, pageSize: res.pageSize };
  if (filterParams.platform_id) params.platform_id = filterParams.platform_id;
  if (filterParams.business_line_id) params.business_line_id = filterParams.business_line_id;
  if (filterParams.content_type) params.content_type = filterParams.content_type;
  if (filterParams.source_keyword) params.source_keyword = filterParams.source_keyword;
  return await getContentList(params);
};

function handleSearch() {
  actionRef.value?.reload();
}

function handleReset() {
  filterParams.platform_id = undefined;
  filterParams.business_line_id = undefined;
  filterParams.content_type = undefined;
  filterParams.source_keyword = '';
  actionRef.value?.reload();
}

function handleExport() {
  const url = getContentExportUrl({
    platform_id: filterParams.platform_id,
    business_line_id: filterParams.business_line_id,
    content_type: filterParams.content_type,
    source_keyword: filterParams.source_keyword,
  });
  window.open(url, '_blank');
}

function handleView(record: Content) {
  currentContent.value = record;
  showDetailModal.value = true;
}

function handleDelete(record: Content) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除内容「${record.title || record.content_id}」吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteContent(record.id);
        message.success('删除成功');
        actionRef.value?.reload();
      } catch (e) { /* handled by alova */ }
    },
  });
}

onMounted(async () => {
  platformList.value = await getPlatformListRaw();
  businessLineList.value = await getBusinessLineListRaw();
});
</script>

<style lang="less">
.content-detail-modal {
  width: 900px;
  max-height: calc(100vh - 120px);

  .n-card {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 120px);
  }

  .n-card__content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overflow-y: auto;
  }
}
</style>

<style lang="less" scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;

  :deep(.n-select) {
    min-width: 120px;
    flex: 1;
    max-width: 200px;
  }

  :deep(.n-input) {
    min-width: 120px;
    flex: 1;
    max-width: 200px;
  }

  .filter-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
}

.detail-body {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.detail-col {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}

.detail-col-left {
  flex: 0 0 500px;
}

.detail-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.detail-section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.85);
}

.content-scroll-card {
  max-height: 180px;
  overflow-y: auto;
}

.content-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
