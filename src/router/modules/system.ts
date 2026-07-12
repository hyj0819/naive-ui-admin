// 系统管理
import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { ToolOutlined } from '@vicons/antd';
import { renderIcon } from '@/utils/index';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/system',
    name: 'System',
    redirect: '/system/accounts',
    component: Layout,
    meta: {
      title: '系统管理',
      icon: renderIcon(ToolOutlined),
      sort: 5,
    },
    children: [
      {
        path: 'accounts',
        name: 'system_accounts',
        meta: {
          title: '账号配置',
        },
        component: () => import('@/views/system/accounts/index.vue'),
      },
      {
        path: 'users',
        name: 'system_users',
        meta: {
          title: '用户管理',
        },
        component: () => import('@/views/system/users/index.vue'),
      },
      {
        path: 'roles',
        name: 'system_roles',
        meta: {
          title: '角色管理',
        },
        component: () => import('@/views/system/roles/index.vue'),
      },
      {
        path: 'operation-logs',
        name: 'system_operation_logs',
        meta: {
          title: '操作日志',
        },
        component: () => import('@/views/system/operation-logs/index.vue'),
      },
    ],
  },
];

export default routes;