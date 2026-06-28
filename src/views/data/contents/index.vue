<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="内容数据">
        管理从社交媒体上抓取的帖子和内容
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
          <n-button type="primary" @click="addContent">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增内容
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle">
      <n-form :model="formData" :label-width="100" class="mt-4">
        <n-form-item label="所属平台">
          <n-select v-model:value="formData.platform_id" placeholder="请选择平台" :options="platformOptions" />
        </n-form-item>
        <n-form-item label="所属业务线">
          <n-select v-model:value="formData.business_line_id" placeholder="请选择业务线" :options="businessLineOptions" />
        </n-form-item>
        <n-form-item label="内容类型">
          <n-select v-model:value="formData.content_type" placeholder="请选择内容类型" :options="contentTypeOptions" />
        </n-form-item>
        <n-form-item label="内容ID">
          <n-input v-model:value="formData.content_id" placeholder="请输入内容ID" />
        </n-form-item>
        <n-form-item label="内容链接">
          <n-input v-model:value="formData.content_url" placeholder="请输入内容URL" />
        </n-form-item>
        <n-form-item label="标题">
          <n-input v-model:value="formData.title" placeholder="请输入标题" />
        </n-form-item>
        <n-form-item label="作者">
          <n-input v-model:value="formData.author_name" placeholder="请输入作者名称" />
        </n-form-item>
        <n-form-item label="来源关键词">
          <n-input v-model:value="formData.source_keyword" placeholder="请输入来源关键词" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button type="info" ghost @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="formLoading" @click="submitForm">提交</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined } from '@vicons/antd';
import { getContentList, createContent, deleteContent, type Content, type CreateContentRequest } from '@/api/contents';
import { getPlatformList, getPlatformListRaw, type Platform } from '@/api/config/platforms';
import { getBusinessLineList, getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const message = useMessage();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增内容');
const platformList = ref<Platform[]>([]);
const businessLineList = ref<BusinessLine[]>([]);

const platformOptions = computed(() => {
  return platformList.value.map(p => ({ label: p.name, value: p.id }));
});

const businessLineOptions = computed(() => {
  return businessLineList.value.map(bl => ({ label: `${bl.platform_name}-${bl.name}`, value: bl.id }));
});

const contentTypeOptions = [
  { label: '帖子', value: 'post' },
  { label: '评论', value: 'comment' },
  { label: '视频', value: 'video' },
  { label: '图片', value: 'image' },
];

const columns = [
  {
    title: '所属平台',
    key: 'platform_name',
    width: 120,
  },
  {
    title: '所属业务线',
    key: 'business_line_name',
    width: 150,
  },
  {
    title: '内容类型',
    key: 'content_type',
    width: 100,
    render(row: Content) {
      const typeMap: Record<string, string> = {
        post: '帖子',
        comment: '评论',
        video: '视频',
        image: '图片',
      };
      return typeMap[row.content_type] || row.content_type;
    },
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: true,
    width: 200,
  },
  {
    title: '作者',
    key: 'author_name',
    width: 120,
  },
  {
    title: '来源关键词',
    key: 'source_keyword',
    width: 120,
  },
  {
    title: '抓取时间',
    key: 'scraped_at',
    width: 160,
  },
];

const actionColumn = reactive({
  width: 150,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: Content) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '查看',
          onClick: handleView.bind(null, record),
        },
        {
          label: '删除',
          onClick: handleDelete.bind(null, record),
        },
      ],
    });
  },
});

const formData = reactive<CreateContentRequest>({
  platform_id: 0,
  business_line_id: 0,
  content_type: '',
  content_id: '',
  content_url: '',
  title: '',
  author_name: '',
  source_keyword: '',
});

const loadDataTable = async (res: any) => {
  return await getContentList(res);
};

onMounted(async () => {
  platformList.value = await getPlatformListRaw();
  businessLineList.value = await getBusinessLineListRaw();
});

function addContent() {
  modalTitle.value = '新增内容';
  Object.assign(formData, { platform_id: 0, business_line_id: 0, content_type: '', content_id: '', content_url: '', title: '', author_name: '', source_keyword: '' });
  showModal.value = true;
}

function handleView(record: Content) {
  message.info(`查看内容: ${record.title}`);
}

async function submitForm() {
  formLoading.value = true;
  try {
    await createContent(formData);
    message.success('创建成功');
    showModal.value = false;
    actionRef.value.reload();
  } catch (error) {
    message.error('操作失败');
  } finally {
    formLoading.value = false;
  }
}

async function handleDelete(record: Content) {
  try {
    await deleteContent(record.id);
    message.success('删除成功');
    actionRef.value.reload();
  } catch (error) {
    message.error('删除失败');
  }
}
</script>

<style lang="less" scoped></style>