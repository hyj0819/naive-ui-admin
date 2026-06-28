<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="创建任务">
        创建爬虫或私信任务
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <n-form :model="formData" :label-width="120" class="mt-4">
        <n-form-item label="任务类型">
          <n-select v-model:value="formData.task_type" placeholder="请选择任务类型" :options="taskTypeOptions" />
        </n-form-item>
        <n-form-item label="所属业务线">
          <n-select v-model:value="formData.business_line_id" placeholder="请选择业务线" :options="businessLineOptions" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="formData.status" placeholder="请选择状态" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="总项数">
          <n-input-number v-model:value="formData.total_items" :min="0" />
        </n-form-item>
      </n-form>
      <div class="mt-8 flex justify-end">
        <n-space>
          <n-button type="info" ghost @click="goBack">取消</n-button>
          <n-button type="primary" :loading="loading" @click="submitForm">创建任务</n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import { createTask, type CreateTaskRequest } from '@/api/tasks';
import { getBusinessLineList, getBusinessLineListRaw, type BusinessLine } from '@/api/config/businessLines';

const router = useRouter();
const message = useMessage();
const loading = ref(false);
const businessLineList = ref<BusinessLine[]>([]);

const taskTypeOptions = [
  { label: '爬虫任务', value: 'scrape' },
  { label: '私信任务', value: 'message' },
  { label: '分析任务', value: 'analyze' },
];

const statusOptions = [
  { label: '待执行', value: 'pending' },
  { label: '执行中', value: 'running' },
];

const businessLineOptions = computed(() => {
  return businessLineList.value.map(bl => ({ label: `${bl.platform_name}-${bl.name}`, value: bl.id }));
});

const formData = reactive<CreateTaskRequest>({
  task_type: '',
  business_line_id: 0,
  status: 'pending',
  total_items: 0,
});

onMounted(async () => {
  businessLineList.value = await getBusinessLineListRaw();
});

function goBack() {
  router.push('/tasks/list');
}

async function submitForm() {
  loading.value = true;
  try {
    await createTask(formData);
    message.success('任务创建成功');
    router.push('/tasks/list');
  } catch (error) {
    message.error('创建失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="less" scoped></style>