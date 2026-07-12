// Dashboard - 作为默认首页，重定向到配置中心
import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { DashboardOutlined } from '@vicons/antd';
import { renderIcon } from '@/utils/index';

const routeName = 'dashboard';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/dashboard',
    name: routeName,
    redirect: '/config/platforms',
    component: Layout,
    meta: {
      title: 'Dashboard',
      icon: renderIcon(DashboardOutlined),
      sort: 0,
      hideMenu: true, // 隐藏菜单项
    },
    children: [
      {
        path: 'console',
        name: `${routeName}_console`,
        meta: {
          title: '主控台',
          affix: true,
        },
        component: () => import('@/views/dashboard/console/console.vue'),
      },
      {
        path: 'workplace',
        name: `${routeName}_workplace`,
        meta: {
          title: '工作台',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/workplace/workplace.vue'),
      },
    ],
  },
];

export default routes;