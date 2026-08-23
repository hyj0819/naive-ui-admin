<template>
  <div>
    <div class="n-layout-page-header">
      <n-card :bordered="false" title="参数管理">
        管理系统运行参数，包括风控策略、AI 配置等，修改后实时生效
      </n-card>
    </div>
    <n-card :bordered="false" class="mt-4 proCard">
      <!-- 分组 Tab -->
      <n-tabs v-model:value="activeGroup" type="line" @update:value="loadConfigs">
        <n-tab v-for="group in groups" :key="group.value" :name="group.value">
          {{ group.label }}
        </n-tab>
      </n-tabs>

      <!-- 参数表格 -->
      <div class="mt-4">
        <n-data-table
          :columns="columns"
          :data="configs"
          :loading="loading"
          :bordered="true"
          size="small"
          :row-key="(row: SystemConfig) => row.id"
        />
      </div>

      <!-- 底部保存按钮 -->
      <div class="mt-4 flex justify-end" v-if="dirtyKeys.size > 0">
        <n-space>
          <n-text depth="3">已修改 {{ dirtyKeys.size }} 项</n-text>
          <n-button @click="handleDiscard">放弃修改</n-button>
          <n-button type="primary" @click="handleSave" :loading="saving">保存修改</n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, h, onMounted } from 'vue';
import { useMessage, NInput, NInputNumber, NSwitch } from 'naive-ui';
import {
  getSystemConfigs,
  getConfigGroups,
  updateSystemConfig,
  type SystemConfig,
  type ConfigGroup,
} from '@/api/system/configs';

const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const activeGroup = ref('risk_control');
const groups = ref<ConfigGroup[]>([]);
const configs = ref<SystemConfig[]>([]);
const originalValues = ref<Record<number, string>>({});
const dirtyKeys = ref<Set<number>>(new Set());

const columns = [
  {
    title: '参数标签',
    key: 'label',
    width: 200,
    render(row: SystemConfig) {
      return h('span', { style: { fontWeight: '500' } }, row.label || row.config_key);
    },
  },
  {
    title: '参数键',
    key: 'config_key',
    width: 220,
    render(row: SystemConfig) {
      return h('code', { style: { fontSize: '12px', color: '#666' } }, row.config_key);
    },
  },
  {
    title: '当前值',
    key: 'config_value',
    width: 200,
    render(row: SystemConfig) {
      const isDirty = dirtyKeys.value.has(row.id);
      // boolean 类型：开关控件
      if (row.value_type === 'boolean') {
        const boolVal = row.config_value === 'true';
        return h(NSwitch, {
          value: boolVal,
          size: 'small',
          onUpdateValue: (val: boolean) => {
            const newVal = String(val);
            if (newVal !== originalValues.value[row.id]) {
              dirtyKeys.value.add(row.id);
              dirtyKeys.value = new Set(dirtyKeys.value);
            } else {
              dirtyKeys.value.delete(row.id);
              dirtyKeys.value = new Set(dirtyKeys.value);
            }
            row.config_value = newVal;
          },
        });
      }
      // number 类型：数字输入框
      if (row.value_type === 'number') {
        return h(NInputNumber, {
          value: Number(row.config_value),
          size: 'small',
          style: { width: '160px' },
          status: isDirty ? 'warning' : undefined,
          onUpdateValue: (val: number | null) => {
            const newVal = String(val ?? '');
            if (newVal !== originalValues.value[row.id]) {
              dirtyKeys.value.add(row.id);
              dirtyKeys.value = new Set(dirtyKeys.value);
            } else {
              dirtyKeys.value.delete(row.id);
              dirtyKeys.value = new Set(dirtyKeys.value);
            }
            row.config_value = newVal;
          },
        });
      }
      // string 类型：文本输入框
      return h(NInput, {
        value: row.config_value,
        size: 'small',
        style: { width: '160px' },
        status: isDirty ? 'warning' : undefined,
        onUpdateValue: (val: string) => {
          if (val !== originalValues.value[row.id]) {
            dirtyKeys.value.add(row.id);
            dirtyKeys.value = new Set(dirtyKeys.value);
          } else {
            dirtyKeys.value.delete(row.id);
            dirtyKeys.value = new Set(dirtyKeys.value);
          }
          row.config_value = val;
        },
      });
    },
  },
  {
    title: '说明',
    key: 'description',
    ellipsis: { tooltip: true },
    render(row: SystemConfig) {
      return row.description || '-';
    },
  },
  {
    title: '更新时间',
    key: 'updated_at',
    width: 170,
  },
];

async function loadGroups() {
  try {
    const result = await getConfigGroups();
    groups.value = result || [];
    if (groups.value.length > 0 && !groups.value.find(g => g.value === activeGroup.value)) {
      activeGroup.value = groups.value[0].value;
    }
  } catch (e) {
    console.error('加载分组失败', e);
  }
}

async function loadConfigs() {
  loading.value = true;
  dirtyKeys.value.clear();
  try {
    const result = await getSystemConfigs({ config_group: activeGroup.value });
    configs.value = result || [];
    // 保存原始值用于对比
    originalValues.value = {};
    configs.value.forEach(c => {
      originalValues.value[c.id] = c.config_value;
    });
  } catch (e) {
    message.error('加载参数失败');
  } finally {
    loading.value = false;
  }
}

function handleDiscard() {
  // 恢复原始值
  configs.value.forEach(c => {
    if (originalValues.value[c.id] !== undefined) {
      c.config_value = originalValues.value[c.id];
    }
  });
  dirtyKeys.value.clear();
  dirtyKeys.value = new Set(dirtyKeys.value);
  message.info('已放弃修改');
}

async function handleSave() {
  saving.value = true;
  try {
    const updates: { id: number; config_value: string }[] = [];
    dirtyKeys.value.forEach(id => {
      const config = configs.value.find(c => c.id === id);
      if (config) {
        updates.push({ id: config.id, config_value: config.config_value });
      }
    });

    for (const item of updates) {
      await updateSystemConfig(item.id, { config_value: item.config_value });
    }

    message.success(`已保存 ${updates.length} 项修改`);
    // 刷新数据
    await loadConfigs();
  } catch (e) {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadGroups();
  await loadConfigs();
});
</script>

<style lang="less" scoped>
</style>
