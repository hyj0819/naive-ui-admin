import { defineStore } from 'pinia';
import { store } from '@/store';
import designSetting from '@/settings/designSetting';

const { darkTheme, appTheme, appThemeList } = designSetting;

const DESIGN_SETTING_KEY = 'DESIGN_SETTING';

// 从 localStorage 读取用户保存的设置
function loadLocalDesignSetting(): Partial<DesignSettingState> {
  try {
    const raw = localStorage.getItem(DESIGN_SETTING_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return {};
}

const saved = loadLocalDesignSetting();

interface DesignSettingState {
  //深色主题
  darkTheme: boolean;
  //系统风格
  appTheme: string;
  //系统内置风格
  appThemeList: string[];
}

export const useDesignSettingStore = defineStore({
  id: 'app-design-setting',
  state: (): DesignSettingState => ({
    darkTheme: saved.darkTheme ?? darkTheme,
    appTheme: saved.appTheme ?? appTheme,
    appThemeList,
  }),
  getters: {
    getDarkTheme(): boolean {
      return this.darkTheme;
    },
    getAppTheme(): string {
      return this.appTheme;
    },
    getAppThemeList(): string[] {
      return this.appThemeList;
    },
  },
  actions: {},
});

// Need to be used outside the setup
export function useDesignSetting() {
  return useDesignSettingStore(store);
}
