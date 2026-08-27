<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="应用配置">
        管理社交媒体应用配置
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
          <n-button type="primary" @click="addPlatform">
            <template #icon>
              <n-icon>
                <PlusOutlined />
              </n-icon>
            </template>
            新增应用
          </n-button>
        </template>
      </BasicTable>
    </n-card>

    <n-modal v-model:show="showModal" :show-icon="false" preset="dialog" :title="modalTitle">
      <n-form :model="formData" :label-width="100" class="mt-4">
          <n-form-item label="应用名称">
            <n-input v-model:value="formData.name" placeholder="请输入应用名称" />
          </n-form-item>
          <n-form-item label="应用描述">
            <n-input v-model:value="formData.description" type="textarea" placeholder="请输入应用描述" />
          </n-form-item>
          <n-form-item label="应用图标">
            <div class="icon-upload-area">
              <n-upload
                :show-file-list="false"
                :custom-request="handleIconUpload"
                accept=".png,.jpg,.jpeg,.svg,.webp"
              >
                <div class="icon-preview" v-if="iconPreviewUrl || formData.icon">
                  <n-image
                    :src="iconPreviewUrl || formData.icon"
                    width="64"
                    height="64"
                    object-fit="cover"
                    style="border-radius: 8px"
                  />
                  <div class="icon-mask">
                    <span>更换图标</span>
                  </div>
                </div>
                <div class="icon-upload-btn" v-else>
                  <n-icon size="24"><PlusOutlined /></n-icon>
                  <span>上传图标</span>
                </div>
              </n-upload>
            </div>
          </n-form-item>
          <n-form-item label="触达方式">
            <n-select
              v-model:value="formData.reach_strategy"
              :options="reachStrategyOptions"
              placeholder="选择默认触达方式"
            />
            <n-alert type="info" :bordered="false" class="mt-1" style="font-size: 12px; padding: 8px;">
              <template #icon>
                <n-icon><InfoCircleOutlined /></n-icon>
              </template>
              系统创建触达任务时会自动使用此默认方式
            </n-alert>
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
import { reactive, ref, h, nextTick } from 'vue';
import { useMessage, useDialog, type UploadCustomRequestOptions } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { PlusOutlined, InfoCircleOutlined } from '@vicons/antd';
import { getPlatformList, createPlatform, updatePlatform, deletePlatform, uploadPlatformIcon, type Platform, type CreatePlatformRequest, type UpdatePlatformRequest } from '@/api/config/platforms';

const message = useMessage();
const dialog = useDialog();
const actionRef = ref();
const showModal = ref(false);
const formLoading = ref(false);
const modalTitle = ref('新增应用');
const editId = ref<number | null>(null);

const columns = [
  {
    title: '应用图标',
    key: 'icon',
    width: 80,
    render(row: Platform) {
      const src = row.icon || '/uploads/platforms/default.png';
      return h('img', {
        src,
        style: {
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          objectFit: 'cover',
        },
      });
    },
  },
  {
    title: '应用编码',
    key: 'code',
    width: 120,
  },
  {
    title: '应用名称',
    key: 'name',
    width: 150,
  },
  {
    title: '应用描述',
    key: 'description',
    width: 200,
  },
  {
    title: '触达方式',
    key: 'reach_strategy',
    width: 110,
    render(row: Platform) {
      const map: Record<string, string> = { dm: '私信', comment_reply: '评论回复' };
      return map[row.reach_strategy] || row.reach_strategy || '私信';
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: Platform) {
      return row.status ? '启用' : '禁用';
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
  },
];

const actionColumn = reactive({
  width: 200,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: Platform) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '编辑',
          onClick: handleEdit.bind(null, record),
          type: 'primary', // Primary 色
        },
        {
          label: '删除',
          onClick: handleDelete.bind(null, record),
          type: 'error', // Error 色
        },
      ],
    });
  },
});

const formData = reactive<CreatePlatformRequest & UpdatePlatformRequest>({
  name: '',
  description: '',
  icon: '',
  reach_strategy: 'dm',
  status: 1,
});

const reachStrategyOptions = [
  { label: '私信', value: 'dm' },
  { label: '评论回复', value: 'comment_reply' },
];

const iconPreviewUrl = ref('');
const iconUploading = ref(false);

const loadDataTable = async (res: any) => {
  return await getPlatformList(res);
};

function addPlatform() {
  editId.value = null;
  modalTitle.value = '新增应用';
  Object.assign(formData, { name: '', description: '', icon: '', reach_strategy: 'dm', status: 1 });
  iconPreviewUrl.value = '';
  showModal.value = true;
}

function handleEdit(record: Platform) {
  editId.value = record.id;
  modalTitle.value = '编辑应用';
  Object.assign(formData, { name: record.name, description: record.description || '', icon: record.icon || '', reach_strategy: record.reach_strategy || 'dm', status: record.status });
  iconPreviewUrl.value = '';
  showModal.value = true;
}

async function handleIconUpload(options: UploadCustomRequestOptions) {
  const { file } = options;
  if (!file.file) return;
  iconUploading.value = true;
  try {
    const res = await uploadPlatformIcon(file.file);
    formData.icon = res.url;
    iconPreviewUrl.value = URL.createObjectURL(file.file);
    options.onFinish();
  } catch (e) {
    options.onError();
  } finally {
    iconUploading.value = false;
  }
}

async function submitForm() {
  formLoading.value = true;
  try {
    if (editId.value) {
      await updatePlatform(editId.value, formData);
      message.success('更新成功');
    } else {
      await createPlatform(formData as CreatePlatformRequest);
      message.success('创建成功');
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

function handleDelete(record: Platform) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除应用「${record.name}」吗？删除后不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deletePlatform(record.id);
        message.success('删除成功');
        await nextTick();
        await actionRef.value?.reload();
      } catch (error) {
        // alova 全局处理器已展示错误信息
      }
    },
  });
}
</script>

<style lang="less" scoped>
.icon-upload-area {
  .icon-preview {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;

    .icon-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
      color: #fff;
      font-size: 12px;
    }

    &:hover .icon-mask {
      opacity: 1;
    }
  }

  .icon-upload-btn {
    width: 64px;
    height: 64px;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #999;
    gap: 2px;
    transition: border-color 0.2s;

    span {
      font-size: 11px;
    }

    &:hover {
      border-color: var(--primary-color, #18a058);
      color: var(--primary-color, #18a058);
    }
  }
}
</style>