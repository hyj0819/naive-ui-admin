<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="关键词管理">
        管理各项目下的搜索关键词
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
          <n-button type="primary" @click="addKeywordToCurrentBusinessLine">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增关键词
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <!-- 新增/编辑关键词弹窗 -->
    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle" style="width: 700px;">
      <n-form :model="formData" :label-width="100" class="mt-4">
        <n-form-item label="所属项目">
          <n-select 
            v-model:value="formData.business_line_id" 
            placeholder="请选择项目" 
            :options="businessLineOptions" 
            :disabled="!!editId"
          />
        </n-form-item>
        
        <n-alert type="info" title="批量添加提示" :style="{ marginBottom: '16px' }">
          每行一个关键词，或逗号分隔（支持中文逗号）。系统会自动去重。
        </n-alert>
        
        <n-form-item label="关键词" required>
          <n-switch v-model:value="formData.status" :checked-value="1" :unchecked-value="0" />
          <span style="margin-left: 8px; color: #666;">{{ formData.status ? '启用' : '禁用' }}</span>
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="formLoading" @click="submitForm">提交</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 查看详情弹窗 - 显示该项目的关键词列表 -->
    <n-modal 
      v-model:show="showDetailModal" 
      :show-icon="false" 
      preset="dialog" 
      title="关键词详情" 
      style="width: 900px;"
    >
      <n-scrollbar style="max-height: 500px;">
        <!-- 操作按钮栏 -->
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 8px;">
          <n-space>
            <n-button 
              type="success" 
              size="small" 
              @click="batchToggleStatus(1)"
              :disabled="currentKeywords.every(k => k.status === 1)"
            >
              全部启用
            </n-button>
            <n-button 
              type="error" 
              size="small" 
              @click="batchToggleStatus(0)"
              :disabled="currentKeywords.every(k => k.status === 0)"
            >
              全部禁用
            </n-button>
          </n-space>
          <n-divider style="height: 24px; margin: 0 8px;" vertical />
          <span style="font-size: 12px; color: #666;">
            已启用 {{ currentKeywords.filter(k => k.status === 1).length }} / 总数 {{ currentKeywords.length }}
          </span>
        </div>

        <!-- 关键词列表 -->
        <n-list hoverable bordered>
          <n-list-item v-for="keyword in currentKeywords" :key="keyword.id">
            <template #prefix>
              <n-tag 
                :type="keyword.status ? 'success' : 'default'" 
                size="small"
                style="margin-right: 8px;"
              >
                {{ keyword.status ? '启用' : '禁用' }}
              </n-tag>
            </template>
            <n-space vertical>
              <n-space align="center">
                <span style="font-size: 14px;">{{ keyword.keyword }}</span>
                <span style="color: #999; font-size: 12px;">{{ formatDate(keyword.created_at) }}</span>
              </n-space>
              <template #extra>
                <n-space>
                  <n-button 
                    type="primary" 
                    size="small" 
                    @click="toggleKeywordStatus(keyword)"
                  >
                    {{ keyword.status ? '禁用' : '启用' }}
                  </n-button>
                  <n-button type="info" size="small" @click="editKeyword(keyword)">编辑</n-button>
                  <n-button type="error" size="small" @click="handleDeleteKeyword(keyword)">删除</n-button>
                </n-space>
              </template>
            </n-space>
          </n-list-item>
          <n-empty v-if="!currentKeywords || currentKeywords.length === 0" description="暂无关键词" />
        </n-list>
      </n-scrollbar>
      <template #action>
        <n-space justify="end">
          <n-button type="info" @click="showDetailModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, computed, nextTick, onMounted } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import { getKeywordList, createKeyword, batchCreateKeywords, updateKeyword, deleteKeyword, type Keyword, type CreateKeywordRequest, type UpdateKeywordRequest, getBusinessLineKeywordsSummary, type BusinessLineKeywordSummary } from '@/api/config/keywords';
import { getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const showModal = ref(false);
const showDetailModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增关键词');
const editId = ref<number | null>(null);
const businessLineList = ref<BusinessLine[]>([]);
const currentKeywords = ref<Keyword[]>([]);

const businessLineOptions = computed(() => {
  return businessLineList.value.map(bl => ({ label: `${bl.platform_name}-${bl.name}`, value: bl.id }));
});

const columns = [
  {
    title: '所属项目',
    key: 'business_line_name',
    width: 200,
  },
  {
    title: '平台',
    key: 'platform_name',
    width: 120,
  },
  {
    title: '关键词总数',
    key: 'total_count',
    width: 100,
    render(row: BusinessLineKeywordSummary) {
      return `${row.total_count}`;
    },
  },
  {
    title: '启用的数量',
    key: 'active_count',
    width: 100,
    render(row: BusinessLineKeywordSummary) {
      return h('span', [
        h('n-tag', {
          type: 'success',
          size: 'small',
        }, { default: () => `${row.active_count}` })
      ]);
    },
  },
];

const actionColumn = reactive({
  width: 100,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: BusinessLineKeywordSummary) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '详情',
          onClick: handleViewDetails.bind(null, record),
          type: 'default', // Default 色
        },
      ],
    });
  },
});

const formData = reactive({
  business_line_id: null as number | null,
  keyword: '',
  keywordsText: '',
  priority: 0,
  status: 1,
});

// 加载表格数据 - 使用聚合查询（当前使用临时方案：前端聚合）
const loadDataTable = async (res: any) => {
  // 如果没有后端聚合接口，则使用旧接口并前端聚合
  const result = await getKeywordList(res);
  
  // 前端聚合逻辑
  const grouped = new Map<number, BusinessLineKeywordSummary>();
  
  result.list.forEach((kw: Keyword) => {
    if (!grouped.has(kw.business_line_id)) {
      grouped.set(kw.business_line_id, {
        id: kw.business_line_id,
        business_line_id: kw.business_line_id,
        business_line_name: kw.business_line_name,
        platform_name: kw.business_line_name.split('-')[0], // 简单处理
        total_count: 0,
        active_count: 0,
        keywords: [],
      });
    }
    const summary = grouped.get(kw.business_line_id)!;
    summary.total_count++;
    if (kw.status === 1) summary.active_count++;
    if (!summary.keywords!.some(k => k.id === kw.id)) {
      summary.keywords!.push(kw);
    }
  });
  
  return {
    list: Array.from(grouped.values()),
    total: result.itemCount || result.list.length,
  };
};

onMounted(async () => {
  businessLineList.value = await getBusinessLineListRaw();
});

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 新增关键词到当前项目（点击"详情"后在详情弹窗中添加）
function addKeywordToCurrentBusinessLine() {
  editId.value = null;
  modalTitle.value = '新增关键词';
  Object.assign(formData, { 
    business_line_id: null, 
    keyword: '', 
    keywordsText: '', 
    priority: 0, 
    status: 1 
  });
  showModal.value = true;
}

// 查看详情
function handleViewDetails(record: BusinessLineKeywordSummary) {
  currentKeywords.value = record.keywords || [];
  showDetailModal.value = true;
}

// 单个关键词的启用/禁用切换
async function toggleKeywordStatus(keyword: Keyword) {
  try {
    const newStatus = keyword.status === 1 ? 0 : 1;
    await updateKeyword(keyword.id, { status: newStatus });
    message.success(`关键词「${keyword.keyword}」已${newStatus === 1 ? '启用' : '禁用'}`);
    // 更新本地数据
    keyword.status = newStatus;
    // 刷新表格数据
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  }
}

// 批量切换状态
async function batchToggleStatus(status: number) {
  const keywordsToToggle = currentKeywords.value.filter(k => k.status !== status);
  if (keywordsToToggle.length === 0) {
    message.warning('所有关键词已是该状态');
    return;
  }

  dialog.warning({
    title: '批量操作确认',
    content: `确定要${status === 1 ? '启用' : '禁用'}以下 ${keywordsToToggle.length} 个关键词吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const promises = keywordsToToggle.map(async (kw) => {
          await updateKeyword(kw.id, { status });
          kw.status = status;
        });
        await Promise.all(promises);
        message.success(`成功${status === 1 ? '启用' : '禁用'}了 ${keywordsToToggle.length} 个关键词`);
        await actionRef.value?.reload();
      } catch (error) {
        // alova 全局处理器已展示错误信息
      }
    },
  });
}

// 编辑关键词（在详情页中调用）
function editKeyword(keyword: Keyword) {
  editId.value = keyword.id;
  modalTitle.value = '编辑关键词';
  Object.assign(formData, {
    business_line_id: keyword.business_line_id,
    keyword: keyword.keyword,
    keywordsText: '',
    priority: 0,
    status: keyword.status
  });
  showDetailModal.value = false;
  showModal.value = true;
}

// 删除关键词（在详情页中调用）
async function handleDeleteKeyword(keyword: Keyword) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除关键词「${keyword.keyword}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteKeyword(keyword.id);
        message.success('删除成功');
        // 刷新当前项目的关键词列表
        if (showDetailModal.value) {
          const currentRecord = columns.find(col => col.key === 'business_line_id') as any;
          // TODO: 重新加载详情数据
        }
        await nextTick();
        await actionRef.value?.reload();
      } catch (error) {
        // alova 全局处理器已展示错误信息
      }
    },
  });
}

async function submitForm() {
  if (!formData.business_line_id) {
    message.warning('请选择所属项目');
    return;
  }
  formLoading.value = true;
  try {
    if (editId.value) {
      // 编辑模式：单条更新
      await updateKeyword(editId.value, { 
        keyword: formData.keywordsText.split(/[,，]/)[0], // 只更新第一个词
        status: formData.status 
      });
      message.success('更新成功');
    } else {
      // 新增模式：批量创建
      const keywords = formData.keywordsText
        .split(/[,，]+/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
      // 去重
      const uniqueKeywords = [...new Set(keywords)];
      if (uniqueKeywords.length === 0) {
        message.warning('请输入至少一个关键词');
        formLoading.value = false;
        return;
      }
      const result = await batchCreateKeywords({
        business_line_id: formData.business_line_id,
        keywords: uniqueKeywords,
        status: formData.status,
      });
      let msg = `成功新增 ${result.created_count} 个关键词`;
      if (result.skipped && result.skipped.length > 0) {
        msg += `，${result.skipped.length} 个重复已跳过`;
      }
      message.success(msg);
    }
    showModal.value = false;
    await nextTick();
    await actionRef.value?.reload();
  } catch (error) {
    // alova 全局处理器已展示错误信息
  } finally {
    formLoading.value = false;
  }
}
</script>

