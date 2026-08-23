// 统计分析
import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { BarChartOutlined } from '@vicons/antd';
import { renderIcon } from '@/utils/index';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/stats',
    name: 'Stats',
    redirect: '/stats/overview',
    component: Layout,
    meta: {
      title: '统计分析',
      icon: renderIcon(BarChartOutlined),
      sort: 5,
    },
    children: [
      {
        path: 'overview',
        name: 'stats_overview',
        meta: {
          title: '数据概览',
        },
        component: () => import('@/views/stats/overview/index.vue'),
      },
      {
        path: 'pipeline',
        name: 'stats_pipeline',
        meta: {
          title: '转化漏斗',
        },
        component: () => import('@/views/stats/pipeline/index.vue'),
      },
      {
        path: 'trend',
        name: 'stats_trend',
        meta: {
          title: '趋势分析',
        },
        component: () => import('@/views/stats/trend/index.vue'),
      },
    ],
  },
];

export default routes;