// 数据中心
import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { DatabaseOutlined } from '@vicons/antd';
import { renderIcon } from '@/utils/index';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/data',
    name: 'Data',
    redirect: '/data/contacts',
    component: Layout,
    meta: {
      title: '数据中心',
      icon: renderIcon(DatabaseOutlined),
      sort: 2, // 排在任务中心之后
    },
    children: [
      {
        path: 'contacts',
        name: 'data_contacts',
        meta: {
          title: '触达用户',
        },
        component: () => import('@/views/data/contacts/index.vue'),
      },
      {
        path: 'contents',
        name: 'data_contents',
        meta: {
          title: '内容数据',
        },
        component: () => import('@/views/data/contents/index.vue'),
      },
    ],
  },
];

export default routes;
