// 项目中心
import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { AppstoreOutlined } from '@vicons/antd';
import { renderIcon } from '@/utils/index';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/project',
    name: 'Project',
    redirect: '/project/business-lines',
    component: Layout,
    meta: {
      title: '项目中心',
      icon: renderIcon(AppstoreOutlined),
      alwaysShow: true,
      sort: 2,
    },
    children: [
      {
        path: 'business-lines',
        name: 'project_business_lines',
        meta: {
          title: '项目管理',
        },
        component: () => import('@/views/config/business-lines/index.vue'),
      },
      {
        path: 'keywords',
        name: 'project_keywords',
        meta: {
          title: '关键词管理',
        },
        component: () => import('@/views/config/keywords/index.vue'),
      },
      {
        path: 'prompt-templates',
        name: 'project_prompt_templates',
        meta: {
          title: '提示词管理',
        },
        component: () => import('@/views/config/prompt-templates/index.vue'),
      },
      {
        path: ':id',
        name: 'project_detail',
        meta: {
          title: '项目详情',
          hideMenu: true,
          hidden: true,
        },
        component: () => import('@/views/project/detail/index.vue'),
      },
    ],
  },
];

export default routes;
