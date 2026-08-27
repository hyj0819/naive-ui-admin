import { defineStore } from 'pinia';
import { store } from '@/store';
import { ACCESS_TOKEN, CURRENT_USER, IS_SCREENLOCKED } from '@/store/mutation-types';
import { ResultEnum } from '@/enums/httpEnum';

import { getUserInfo as getUserInfoApi, login } from '@/api/system/user';
import { storage } from '@/utils/Storage';
import { useAsyncRoute } from './asyncRoute';
import { useTabsViewStore } from './tabsView';

export type UserInfoType = {
  id?: number;
  username: string;
  real_name?: string;
  email: string;
  avatar?: string;
  roles?: any[];
};

export interface IUserState {
  token: string;
  username: string;
  welcome: string;
  avatar: string;
  permissions: string[];
  menus: string[];
  info: UserInfoType;
}

export const useUserStore = defineStore({
  id: 'app-user',
  state: (): IUserState => ({
    token: storage.get(ACCESS_TOKEN, ''),
    username: '',
    welcome: '',
    avatar: '',
    permissions: [],
    menus: [],
    info: storage.get(CURRENT_USER, {}),
  }),
  getters: {
    getToken(): string {
      return this.token;
    },
    getAvatar(): string {
      return this.avatar;
    },
    getNickname(): string {
      return this.username;
    },
    getPermissions(): string[] {
      return this.permissions;
    },
    getMenus(): string[] {
      return this.menus;
    },
    getUserInfo(): UserInfoType {
      return this.info;
    },
  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setAvatar(avatar: string) {
      this.avatar = avatar;
    },
    setPermissions(permissions: string[]) {
      this.permissions = permissions;
    },
    setMenus(menus: string[]) {
      this.menus = menus;
    },
    setUserInfo(info: UserInfoType) {
      this.info = info;
    },
    // 登录
    async login(params: any) {
      const response = await login(params);
      const { result, code } = response;
      if (code === ResultEnum.SUCCESS) {
        const accessToken = result.access_token;
        const ex = 7 * 24 * 60 * 60;
        storage.set(ACCESS_TOKEN, accessToken, ex);
        storage.set(CURRENT_USER, result.user, ex);
        storage.set(IS_SCREENLOCKED, false);
        this.setToken(accessToken);
        this.setUserInfo(result.user);
        
        // 登出时清理了旧的 router store 状态，这里需要恢复
        const asyncRouteStore = useAsyncRoute();
        const tabsViewStore = useTabsViewStore();
        
        // 登录成功时，清除上次遗留的动态路由标记和 keepAlive 缓存
        asyncRouteStore.setDynamicRouteAdded(false);
        asyncRouteStore.setKeepAliveComponents([]);
        
        // 存储权限和菜单
        if (result.user?.menus) {
          this.setMenus(result.user.menus);
        }
        if (result.user?.roles) {
          this.setPermissions(result.user.roles.map((r: any) => r.role_code));
        }
      }
      return response;
    },

    // 获取用户信息
    async getInfo() {
      const data = await getUserInfoApi();
      const { result } = data;
      if (result) {
        if (result.menus && result.menus.length) {
          this.setMenus(result.menus);
        }
        if (result.roles && result.roles.length) {
          this.setPermissions(result.roles.map((r: any) => r.role_code));
        }
        this.setUserInfo(result);
        this.setAvatar(result.avatar || '');
        return result;
      }
    },

    // 登出
    async logout() {
      this.setPermissions([]);
      this.setMenus([]);
      this.setUserInfo({ username: '', email: '' });
      storage.remove(ACCESS_TOKEN);
      storage.remove(CURRENT_USER);
      
      // 清除动态添加的路由相关状态
      const asyncRouteStore = useAsyncRoute();
      const tabsViewStore = useTabsViewStore();
      
      asyncRouteStore.setDynamicRouteAdded(false);
      asyncRouteStore.setRouters([]);
      asyncRouteStore.setMenus([]);
      asyncRouteStore.setKeepAliveComponents([]);
      
      tabsViewStore.closeAllTabs();
    },
  },
});

// Need to be used outside the setup
export function useUser() {
  return useUserStore(store);
}
