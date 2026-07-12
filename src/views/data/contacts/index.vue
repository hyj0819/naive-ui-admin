<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="触达用户">
        管理社交媒体上识别到的潜在客户和影响者
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <!-- 筛选栏 -->
      <n-space vertical :size="12">
        <n-space align="center">
          <n-select v-model:value="filterParams.platform_id" placeholder="平台" clearable :options="platformOptions" style="width: 140px" />
          <n-select v-model:value="filterParams.business_line_id" placeholder="业务线" clearable :options="businessLineOptions" style="width: 160px" />
          <n-select v-model:value="filterParams.contact_status" placeholder="触达状态" clearable :options="contactStatusOptions" style="width: 130px" />
          <n-input v-model:value="filterParams.keyword" placeholder="搜索用户名" clearable style="width: 160px" @keyup.enter="handleSearch" />
          <n-button type="primary" @click="handleSearch">搜索</n-button>
          <n-button @click="handleReset">重置</n-button>
          <n-button @click="handleExport">
            <template #icon><n-icon><DownloadOutlined /></n-icon></template>
            导出CSV
          </n-button>
        </n-space>

        <!-- 批量操作 -->
        <n-space v-if="checkedRowKeys.length > 0" align="center">
          <n-text>已选 {{ checkedRowKeys.length }} 项</n-text>
          <n-button size="small" type="info" @click="handleBatchUpdate('contacted')">批量标记为已联系</n-button>
          <n-button size="small" type="success" @click="handleBatchUpdate('converted')">批量标记为已转化</n-button>
        </n-space>

        <!-- 表格 -->
        <BasicTable
          :columns="columns"
          :request="loadDataTable"
          :row-key="(row) => row.id"
          ref="actionRef"
          :actionColumn="actionColumn"
          :row-selection="{ type: 'checkbox', onChange: onChecked }"
        />
      </n-space>
    </n-card>

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="showDrawer" :width="480" placement="right">
      <n-drawer-content title="用户详情" closable>
        <template v-if="currentContact">
          <n-descriptions label-placement="left" bordered :column="1">
            <n-descriptions-item label="用户名">{{ currentContact.username || '-' }}</n-descriptions-item>
            <n-descriptions-item label="平台用户ID">{{ currentContact.platform_user_id }}</n-descriptions-item>
            <n-descriptions-item label="平台">{{ currentContact.platform_name }}</n-descriptions-item>
            <n-descriptions-item label="业务线">{{ currentContact.business_line_name }}</n-descriptions-item>
            <n-descriptions-item label="主页链接">
              <n-a v-if="currentContact.profile_url" :href="currentContact.profile_url" target="_blank">{{ currentContact.profile_url }}</n-a>
              <span v-else>-</span>
            </n-descriptions-item>
            <n-descriptions-item label="是否作者">{{ currentContact.is_author ? '是' : '否' }}</n-descriptions-item>
            <n-descriptions-item label="触达状态">
              <n-tag :type="statusTagType(currentContact.contact_status)" size="small">
                {{ statusLabel(currentContact.contact_status) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="触达次数">{{ currentContact.contact_attempts }}</n-descriptions-item>
            <n-descriptions-item label="最后触达">{{ currentContact.last_contact_at || '-' }}</n-descriptions-item>
            <n-descriptions-item label="备注">{{ currentContact.notes || '-' }}</n-descriptions-item>
            <n-descriptions-item label="创建时间">{{ currentContact.created_at }}</n-descriptions-item>
          </n-descriptions>

          <!-- 触达历史 -->
          <n-divider>触达历史</n-divider>
          <n-timeline v-if="interactions.length > 0">
            <n-timeline-item
              v-for="item in interactions"
              :key="item.id"
              :type="interactionTimelineType(item.interaction_type)"
              :title="interactionLabel(item.interaction_type)"
              :content="item.detail || ''"
              :time="item.created_at"
            />
          </n-timeline>
          <n-empty v-else description="暂无触达历史" />
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, computed, onMounted, resolveComponent } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { DownloadOutlined } from '@vicons/antd';
import {
  getContactList, deleteContact,
  batchUpdateContacts, getContactInteractions, getContactExportUrl,
  type Contact, type ContactInteraction
} from '@/api/contacts';
import { getPlatformListRaw, type Platform } from '@/api/config/platforms';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const platformList = ref<Platform[]>([]);
const businessLineList = ref<BusinessLine[]>([]);
const checkedRowKeys = ref<number[]>([]);
const showDrawer = ref(false);
const currentContact = ref<Contact | null>(null);
const interactions = ref<ContactInteraction[]>([]);

const filterParams = reactive({
  platform_id: undefined as number | undefined,
  business_line_id: undefined as number | undefined,
  contact_status: undefined as string | undefined,
  keyword: '',
});

const platformOptions = computed(() => platformList.value.map(p => ({ label: p.name, value: p.id })));
const businessLineOptions = computed(() => businessLineList.value.map(bl => ({ label: `${bl.platform_name}-${bl.name}`, value: bl.id })));

const contactStatusOptions = [
  { label: '未触达', value: 'pending' },
  { label: '已触达', value: 'contacted' },
  { label: '已回复', value: 'replied' },
  { label: '已转化', value: 'converted' },
];

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '未触达', contacted: '已触达', replied: '已回复', converted: '已转化' };
  return map[status] || status;
}

function statusTagType(status: string): 'default' | 'info' | 'success' | 'warning' {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning'> = { pending: 'default', contacted: 'info', replied: 'warning', converted: 'success' };
  return map[status] || 'default';
}

function interactionLabel(type: string) {
  const map: Record<string, string> = { message_sent: '发送私信', comment_replied: '回复评论', scraped: '爬虫采集', ai_analyzed: 'AI分析' };
  return map[type] || type;
}

function interactionTimelineType(type: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = { message_sent: 'info', comment_replied: 'warning', scraped: 'default', ai_analyzed: 'success' };
  return map[type] || 'default';
}

const columns = [
  { title: '用户名', key: 'username', width: 130, ellipsis: true },
  { title: '平台', key: 'platform_name', width: 100 },
  { title: '业务线', key: 'business_line_name', width: 120 },
  {
    title: '触达状态', key: 'contact_status', width: 100,
    render(row: Contact) {
      return h('span', {}, [
        h(resolveComponent('n-tag'), { type: statusTagType(row.contact_status), size: 'small' }, () => statusLabel(row.contact_status))
      ]);
    },
  },
  { title: '触达次数', key: 'contact_attempts', width: 90 },
  { title: '最后触达', key: 'last_contact_at', width: 150, render(row: Contact) { return row.last_contact_at || '-'; } },
  { title: '创建时间', key: 'created_at', width: 150 },
];

const actionColumn = reactive({
  width: 160,
  title: '操作',
  key: 'action',
  fixed: 'right' as const,
  render(record: Contact) {
    return h(TableAction, {
      style: 'button',
      actions: [
        { label: '详情', onClick: handleDetail.bind(null, record) },
        { label: '删除', onClick: handleDelete.bind(null, record) },
      ],
    });
  },
});

const loadDataTable = async (res: any) => {
  const params: any = { page: res.page, pageSize: res.pageSize };
  if (filterParams.platform_id) params.platform_id = filterParams.platform_id;
  if (filterParams.business_line_id) params.business_line_id = filterParams.business_line_id;
  if (filterParams.contact_status) params.contact_status = filterParams.contact_status;
  if (filterParams.keyword) params.keyword = filterParams.keyword;
  return await getContactList(params);
};

function onChecked(rowKeys: number[]) {
  checkedRowKeys.value = rowKeys;
}

function handleSearch() {
  actionRef.value?.reload();
}

function handleReset() {
  filterParams.platform_id = undefined;
  filterParams.business_line_id = undefined;
  filterParams.contact_status = undefined;
  filterParams.keyword = '';
  actionRef.value?.reload();
}

function handleExport() {
  const url = getContactExportUrl({
    platform_id: filterParams.platform_id,
    business_line_id: filterParams.business_line_id,
    contact_status: filterParams.contact_status,
    keyword: filterParams.keyword,
  });
  window.open(url, '_blank');
}

function handleBatchUpdate(status: string) {
  dialog.warning({
    title: '批量操作确认',
    content: `确定要将选中的 ${checkedRowKeys.value.length} 个用户标记为「${statusLabel(status)}」吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await batchUpdateContacts(checkedRowKeys.value, status);
        message.success('批量更新成功');
        checkedRowKeys.value = [];
        actionRef.value?.reload();
      } catch (e) { /* handled by alova */ }
    },
  });
}

async function handleDetail(record: Contact) {
  currentContact.value = record;
  showDrawer.value = true;
  try {
    const res = await getContactInteractions(record.id);
    interactions.value = (res as any)?.result || res || [];
  } catch {
    interactions.value = [];
  }
}

function handleDelete(record: Contact) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户「${record.username || record.platform_user_id}」吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteContact(record.id);
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

<style lang="less" scoped></style>
