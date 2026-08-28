<template>
  <n-grid cols="2 s:2 m:2 l:3 xl:3 2xl:3" responsive="screen">
    <n-grid-item :span="2">
      <n-form
        ref="formRef"
        label-placement="left"
        :label-width="80"
        :model="formData"
        :rules="rules"
      >
        <n-form-item label="用户名">
          <n-input v-model:value="formData.username" disabled />
        </n-form-item>

        <n-form-item label="真实姓名" path="real_name">
          <n-input v-model:value="formData.real_name" placeholder="请输入真实姓名" />
        </n-form-item>

        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="formData.email" placeholder="请输入邮箱地址" />
        </n-form-item>

        <n-form-item label="状态">
          <n-switch v-model:value="formData.statusBool">
            <template #checked>启用</template>
            <template #unchecked>禁用</template>
          </n-switch>
        </n-form-item>

        <div style="margin-top: 20px;">
          <n-space>
            <n-button type="primary" :loading="loading" @click="handleSave">保存修改</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-grid-item>

    <!-- 账户信息卡片 -->
    <n-grid-item :span="4">
      <n-card :bordered="false" class="info-card">
        <template #header>
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
            <n-icon size="18" color="#666"><UserOutlined /></n-icon>
            <span>账户信息</span>
          </div>
        </template>

        <n-descriptions label-placement="left" :column="1" size="small">
          <n-descriptions-item label="创建时间">
            {{ createdAt || ' - ' }}
          </n-descriptions-item>
          <n-descriptions-item label="最后登录">
            {{ lastLoginAt || ' - ' }}
          </n-descriptions-item>
        </n-descriptions>

        <n-alert type="info" :bordered="false" style="margin-top: 12px; font-size: 12px;">
          💡 提示：修改用户名、密码等信息需要联系系统管理员
        </n-alert>
      </n-card>
    </n-grid-item>
  </n-grid>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { UserOutlined } from '@vicons/antd';
import { useUserStore } from '@/store/modules/user';
import { updateUser } from '@/api/users';

defineOptions({ name: 'BasicSetting' });

const userStore = useUserStore();
const message = useMessage();
const formRef = ref();
const loading = ref(false);

// 验证规则
const rules = {
  real_name: {
    required: true,
    message: '请输入真实姓名',
    trigger: 'blur',
  },
  email: {
    required: true,
    type: 'email',
    message: '请输入有效的邮箱地址',
    trigger: 'blur',
  },
};

// 表单数据
const formData = reactive({
  username: '',
  real_name: '',
  email: '',
  statusBool: true,
});

// 格式化日期
const createdAt = ref('');
const lastLoginAt = ref('');

function formatDate(dateStr: string | null) {
  if (!dateStr) return '未设置';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 加载用户信息
function loadUserInfo() {
  const userInfo = userStore.info;
  if (userInfo) {
    formData.username = userInfo.username || '';
    formData.real_name = userInfo.real_name || '';
    formData.email = userInfo.email || '';
    formData.statusBool = userInfo.status === 1;
    
    // 设置日期显示
    createdAt.value = formatDate(userInfo.created_at);
    lastLoginAt.value = formatDate(userInfo.last_login_at);
  }
}

// 保存到后端
async function handleSave() {
  try {
    await formRef.value?.validate();
    loading.value = true;
    
    await updateUser(userStore.info!.id!, {
      real_name: formData.real_name,
      email: formData.email,
      status: formData.statusBool ? 1 : 0,
    });
    
    message.success('个人信息保存成功！');
    
    // 刷新用户 store
    await userStore.getInfo();
    
    // 更新本地 data
    formData.real_name = userStore.info!.real_name || '';
    formData.email = userStore.info!.email || '';
  } catch (error: any) {
    console.error('保存失败:', error);
  } finally {
    loading.value = false;
  }
}

// 重置表单
function handleReset() {
  loadUserInfo();
  message.info('已重置为原始值');
}

onMounted(() => {
  loadUserInfo();
});
</script>

<style lang="less" scoped>
.info-card {
  height: fit-content;
  border-radius: 8px;
}

::v-deep(.n-form-item-label) {
  color: #666;
  font-weight: 500;
}

::v-deep(.n-form-item) {
  margin-bottom: 24px;
}
</style>
