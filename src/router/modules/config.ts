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
        path: 'ai-models',
        name: 'config_ai_models',
        meta: {
          title: '模型配置',
        },
        component: () => import('@/views/config/ai-models/index.vue'),
      },
    ],
  },
];

export default routes;