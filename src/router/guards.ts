import { PageEnum } from '@/enums/pageEnum';
import { ErrorPageRoute } from '@/router/base';
import { constantRouter, asyncRoutes } from '@/router/index';
import { useAsyncRoute } from '@/store/modules/asyncRoute';
import { useUser } from '@/store/modules/user';
import { ACCESS_TOKEN } from '@/store/mutation-types';
import { storage } from '@/utils/Storage';
import type { RouteRecordRaw } from 'vue-router';
import { isNavigationFailure, Router } from 'vue-router';
import { RedirectName } from './constant';

const LOGIN_PATH = PageEnum.BASE_LOGIN;

const whitePathList = [LOGIN_PATH]; // no redirect whitelist

export function createRouterGuards(router: Router) {
  const userStore = useUser();
  const asyncRouteStore = useAsyncRoute();
  router.beforeEach(async (to, from, next) => {
    const Loading = window['$loading'] || null;
    Loading && Loading.start();
    if (from.path === LOGIN_PATH && to.name === 'errorPage') {
      next(PageEnum.BASE_HOME);
      return;
    }

    // Whitelist can be directly entered
    if (whitePathList.includes(to.path as PageEnum)) {
      next();
      return;
    }

    const token = storage.get(ACCESS_TOKEN);

    if (!token) {
      // You can access without permissions. You need to set the routing meta.ignoreAuth to true
      if (to.meta.ignoreAuth) {
        next();
        return;
      }
      // redirect login page
      const redirectData: { path: string; replace: boolean; query?: Recordable<string> } = {
        path: LOGIN_PATH,
        replace: true,
      };
      if (to.path) {
        redirectData.query = {
          ...redirectData.query,
          redirect: to.path,
        };
      }
      next(redirectData);
      return;
    }

    // 如果动态路由已经添加过，直接通过（避免重复添加）
    // 注意：退出登录后 token 会被清除，下次访问会跳转到登录页
    if (asyncRouteStore.getIsDynamicRouteAdded) {
      next();
      return;
    }

    // 如果是从登录页过来，或者 token 还在但路由未添加，说明是首次访问或登录成功
    const isFromLoginPage = from.path === LOGIN_PATH || from.name === 'Login';

    try {
      const userInfo = await userStore.getInfo();

      const routes = await asyncRouteStore.generateRoutes(userInfo);

      // 如果之前已经添加过动态路由，需要先移除（用于登录后重新添加）
      if (asyncRouteStore.getIsDynamicRouteAdded) {
        // 获取已添加的所有路由
        const allRoutes = router.getRoutes();
        // 移除动态添加的路由，只保留常量路由
        allRoutes.forEach((route) => {
          const isDynamic = !constantRouter.some(c => c.name === route.name);
          if (isDynamic && route.name) {
            router.removeRoute(route.name);
          }
        });
      }

      // 动态添加可访问路由表
      routes.forEach((item) => {
        router.addRoute(item as unknown as RouteRecordRaw);
      });

      //添加404
      const isErrorPage = router.getRoutes().findIndex((item) => item.name === ErrorPageRoute.name);
      if (isErrorPage === -1) {
        router.addRoute(ErrorPageRoute as unknown as RouteRecordRaw);
      }

      const redirectPath = (from.path === LOGIN_PATH ? to.path : (from.query.redirect || to.path)) as string;
      const redirect = decodeURIComponent(redirectPath);
      const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect };
      asyncRouteStore.setDynamicRouteAdded(true);
      next(nextData);
    } catch (error) {
      // 获取用户信息失败（如 token 过期/无效），清除登录态并跳转登录页
      console.error('获取用户信息失败:', error);
      storage.remove(ACCESS_TOKEN);
      asyncRouteStore.setDynamicRouteAdded(false);
      next({ path: LOGIN_PATH, replace: true, query: { redirect: to.path } });
    }
    Loading && Loading.finish();
  });

  router.afterEach((to, _, failure) => {
    document.title = (to?.meta?.title as string) || document.title;
    if (isNavigationFailure(failure)) {
      //console.log('failed navigation', failure)
    }
    const asyncRouteStore = useAsyncRoute();
    // 在这里设置需要缓存的组件名称
    const keepAliveComponents = asyncRouteStore.keepAliveComponents;
    const currentComName: any = to.matched.find((item) => item.name == to.name)?.name;
    if (currentComName && !keepAliveComponents.includes(currentComName) && to.meta?.keepAlive) {
      // 需要缓存的组件
      keepAliveComponents.push(currentComName);
    } else if (!to.meta?.keepAlive || to.name == RedirectName) {
      // 不需要缓存的组件
      const index = asyncRouteStore.keepAliveComponents.findIndex((name) => name == currentComName);
      if (index != -1) {
        keepAliveComponents.splice(index, 1);
      }
    }
    asyncRouteStore.setKeepAliveComponents(keepAliveComponents);
    const Loading = window['$loading'] || null;
    Loading && Loading.finish();
  });

  router.onError((error) => {
    console.log(error, '路由错误');
  });
}
