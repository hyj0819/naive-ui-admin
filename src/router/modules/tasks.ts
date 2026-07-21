// 任务中心
import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { PlayCircleOutlined } from '@vicons/antd';
import { renderIcon } from '@/utils/index';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/tasks',
    name: 'Tasks',
    redirect: '/tasks/list',
    component: Layout,
    meta: {
      title: '任务中心',
      icon: renderIcon(PlayCircleOutlined),
      sort: 2,
    },
    children: [
      {
        path: 'list',
        name: 'task_list',
        meta: {
          title: '任务列表',
        },
        component: () => import('@/views/tasks/list/index.vue'),
      },
      {
        path: 'create',
        name: 'task_create',
        meta: {
          title: '创建任务',
          hideMenu: true,
        },
        component: () => import('@/views/tasks/create/index.vue'),
      },
      {
        path: ':id/report',
        name: 'task_report',
        meta: {
          title: '任务报告',
          hideMenu: true,
        },
        component: () => import('@/views/tasks/report/index.vue'),
      },
      {
        path: ':id',
        name: 'task_detail',
        meta: {
          title: '任务详情',
          hideMenu: true,
        },
        component: () => import('@/views/tasks/detail/index.vue'),
      },
    ],
  },
];

export default routes;