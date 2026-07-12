import { defineStore } from 'pinia';
import projectSetting from '@/settings/projectSetting';
import type { IHeaderSetting, IMenuSetting, IMultiTabsSetting, ICrumbsSetting } from '/#/config';

const {
  navMode,
  navTheme,
  isMobile,
  headerSetting,
  showFooter,
  menuSetting,
  multiTabsSetting,
  crumbsSetting,
  permissionMode,
  isPageAnimate,
  pageAnimateType,
} = projectSetting;

const PROJECT_SETTING_KEY = 'PROJECT_SETTING';

// 从 localStorage 读取用户保存的设置
function loadLocalProjectSetting(): Partial<ProjectSettingState> {
  try {
    const raw = localStorage.getItem(PROJECT_SETTING_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return {};
}

const savedProject = loadLocalProjectSetting();

interface ProjectSettingState {
  navMode: string; //导航模式
  navTheme: string; //导航风格
  headerSetting: IHeaderSetting; //顶部设置
  showFooter: boolean; //页脚
  menuSetting: IMenuSetting; //多标签
  multiTabsSetting: IMultiTabsSetting; //多标签
  crumbsSetting: ICrumbsSetting; //面包屑
  permissionMode: string; //权限模式
  isPageAnimate: boolean; //是否开启路由动画
  pageAnimateType: string; //路由动画类型
  isMobile: boolean; // 是否处于移动端模式
}

export const useProjectSettingStore = defineStore({
  id: 'app-project-setting',
  state: (): ProjectSettingState => ({
    navMode: savedProject.navMode ?? navMode,
    navTheme: savedProject.navTheme ?? navTheme,
    isMobile: savedProject.isMobile ?? isMobile,
    headerSetting: savedProject.headerSetting ?? headerSetting,
    showFooter: savedProject.showFooter ?? showFooter,
    menuSetting: savedProject.menuSetting ?? menuSetting,
    multiTabsSetting: savedProject.multiTabsSetting ?? multiTabsSetting,
    crumbsSetting: savedProject.crumbsSetting ?? crumbsSetting,
    permissionMode: savedProject.permissionMode ?? permissionMode,
    isPageAnimate: savedProject.isPageAnimate ?? isPageAnimate,
    pageAnimateType: savedProject.pageAnimateType ?? pageAnimateType,
  }),
  getters: {
    getNavMode(): string {
      return this.navMode;
    },
    getNavTheme(): string {
      return this.navTheme;
    },
    getIsMobile(): boolean {
      return this.isMobile;
    },
    getHeaderSetting(): object {
      return this.headerSetting;
    },
    getShowFooter(): boolean {
      return this.showFooter;
    },
    getMenuSetting(): object {
      return this.menuSetting;
    },
    getMultiTabsSetting(): object {
      return this.multiTabsSetting;
    },
    getCrumbsSetting(): object {
      return this.crumbsSetting;
    },
    getPermissionMode(): string {
      return this.permissionMode;
    },
    getIsPageAnimate(): boolean {
      return this.isPageAnimate;
    },
    getPageAnimateType(): string {
      return this.pageAnimateType;
    },
  },
  actions: {
    setNavTheme(value: string): void {
      this.navTheme = value;
    },
    setIsMobile(value: boolean): void {
      this.isMobile = value;
    },
  },
});
