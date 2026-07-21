// 配置中心 - 主要功能菜单
import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { SettingOutlined } from '@vicons/antd';
import { renderIcon } from '@/utils/index';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/config',
    name: 'Config',
    redirect: '/config/platforms',
    component: Layout,
    meta: {
      title: '配置中心',
      icon: renderIcon(SettingOutlined),
      sort: 1,
    },
    children: [
      {
        path: 'platforms',
        name: 'config_platforms',
        meta: {
          title: '应用管理',
        },
        component: () => import('@/views/config/platforms/index.vue'),
      },
      {
        path: 'business-lines',
        name: 'config_business_lines',
        meta: {
          title: '项目管理',
        },
        component: () => import('@/views/config/business-lines/index.vue'),
      },
      {
        path: 'keywords',
        name: 'config_keywords',
        meta: {
          title: '关键词管理',
        },
        component: () => import('@/views/config/keywords/index.vue'),
      },
      {
        path: 'prompt-templates',
        name: 'config_prompt_templates',
        meta: {
          title: '提示词管理',
        },
        component: () => import('@/views/config/prompt-templates/index.vue'),
      },
      {
        path: 'ai-models',
        name: 'config_ai_models',
        meta: {
          title: 'AI模型配置',
        },
        component: () => import('@/views/config/ai-models/index.vue'),
      },
    ],
  },
];

export default routes;