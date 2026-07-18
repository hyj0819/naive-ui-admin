import { createAlova } from 'alova';
import VueHook from 'alova/vue';
import adapterFetch from 'alova/fetch';
import { createAlovaMockAdapter } from '@alova/mock';
import { isString } from 'lodash-es';
import mocks from './mocks';
import { useUser } from '@/store/modules/user';
import { ACCESS_TOKEN } from '@/store/mutation-types';
import { storage } from '@/utils/Storage';
import { useGlobSetting, useLocalSetting } from '@/hooks/setting';
import { PageEnum } from '@/enums/pageEnum';
import { ResultEnum } from '@/enums/httpEnum';
import { isUrl } from '@/utils';

const { apiUrl, urlPrefix } = useGlobSetting();

const { useMock, loggerMock } = useLocalSetting();

const mockAdapter = createAlovaMockAdapter([...mocks], {
  // 全局控制是否启用mock接口，默认为true
  enable: useMock,

  // 非模拟请求适配器，用于未匹配mock接口时发送请求
  httpAdapter: adapterFetch(),

  // mock接口响应延迟，单位毫秒
  delay: 1000,

  // 自定义打印mock接口请求信息
  // mockRequestLogger: (res) => {
  //   loggerMock && console.log(`Mock Request ${res.url}`, res);
  // },
  mockRequestLogger: loggerMock,
  onMockError(error, currentMethod) {
    console.error('🚀 ~ onMockError ~ currentMethod:', currentMethod);
    console.error('🚀 ~ onMockError ~ error:', error);
  },
});

export const Alova = createAlova({
  baseURL: apiUrl,
  statesHook: VueHook,
  // 关闭全局请求缓存
  cacheFor: null,
  // 全局缓存配置
  // cacheFor: {
  //   POST: {
  //     mode: 'memory',
  //     expire: 60 * 10 * 1000
  //   },
  //   GET: {
  //     mode: 'memory',
  //     expire: 60 * 10 * 1000
  //   },
  //   HEAD: 60 * 10 * 1000 // 统一设置HEAD请求的缓存模式
  // },
  // 在开发环境开启缓存命中日志
  cacheLogger: process.env.NODE_ENV === 'development',
  requestAdapter: mockAdapter,
  beforeRequest(method) {
    const userStore = useUser();
    const token = userStore.getToken;
    // 添加 token 到请求头 (JWT Bearer)
    if (!method.meta?.ignoreToken && token) {
      method.config.headers['Authorization'] = `Bearer ${token}`;
    }
    // 处理 api 请求前缀
    const isUrlStr = isUrl(method.url as string);
    if (!isUrlStr && urlPrefix) {
      method.url = `${urlPrefix}${method.url}`;
    }
  },
  responded: {
    onSuccess: async (response, method) => {
      // Fetch API 不会对 4xx/5xx 抛错，需手动检测 HTTP 错误状态码
      if (response.status && response.status >= 400) {
        // @ts-ignore
        const Message = window.$message;
        // 解析后端返回的错误信息
        let errorMsg = `请求失败(${response.status})`;
        try {
          const body = await response.json();
          if (Array.isArray(body.detail)) {
            errorMsg = body.detail.map((e: any) => e.msg || e.message).join('; ');
          } else if (typeof body.detail === 'string') {
            errorMsg = body.detail;
          } else if (body.message) {
            errorMsg = body.message;
          }
        } catch { /* 解析失败使用默认提示 */ }

        // 401 未授权
        if (response.status === 401) {
          // 登录请求的 401 表示账号或密码错误，直接提示，不清除登录态/跳转
          if (method.meta?.isLogin) {
            Message?.error(errorMsg || '用户名或密码错误');
            throw new Error(errorMsg || '用户名或密码错误');
          }
          // 其他请求的 401：登录态失效，清除并跳转登录页
          storage.remove(ACCESS_TOKEN);
          const userStore = useUser();
          userStore.setPermissions([]);
          userStore.setMenus([]);
          userStore.setUserInfo({ username: '', email: '' });
          window.location.href = PageEnum.BASE_LOGIN;
          throw new Error('登录已失效，请重新登录');
        }
        Message?.error(errorMsg);
        throw new Error(errorMsg);
      }

      const res = (response.json && (await response.json())) || response.body;

      // 是否返回原生响应头 比如：需要获取响应头时使用该属性
      if (method.meta?.isReturnNativeResponse) {
        return res;
      }
      // 请根据自身情况修改数据结构
      const { message, code, result } = res;
  
      // 不进行任何处理，直接返回
      // 用于需要直接获取 code、result, message 这些信息时开启
      if (method.meta?.isTransformResponse === false) {
        return res.data;
      }
  
      // @ts-ignore
      const Message = window.$message;
      // @ts-ignore
      const Modal = window.$dialog;
  
      const LoginPath = PageEnum.BASE_LOGIN;
      if (ResultEnum.SUCCESS === code) {
        return result;
      }
      // 需要登录
      if (code === 912) {
        Modal?.warning({
          title: '提示',
          content: '登录身份已失效，请重新登录!',
          okText: '确定',
          closable: false,
          maskClosable: false,
          onOk: async () => {
            storage.clear();
            window.location.href = LoginPath;
          },
        });
      } else {
        // 可按需处理错误 一般情况下不是 912 错误，不一定需要弹出 message
        Message?.error(message);
        throw new Error(message);
      }
    },
    onError: async (error, method) => {
      // @ts-ignore
      const Message = window.$message;
      let errorMsg = '请求失败';
      try {
        // 尝试从响应体中解析后端返回的错误信息
        const response = error.response || error;
        if (response && typeof response.json === 'function') {
          const body = await response.json();
          // FastAPI 422 校验错误格式: { detail: [{ msg, loc, ... }] }
          if (Array.isArray(body.detail)) {
            errorMsg = body.detail.map((e: any) => e.msg || e.message).join('; ');
          } else if (typeof body.detail === 'string') {
            errorMsg = body.detail;
          } else if (body.message) {
            errorMsg = body.message;
          }
        } else if (typeof error.message === 'string') {
          errorMsg = error.message;
        }
      } catch {
        // 解析失败使用默认提示
      }
      Message?.error(errorMsg);
      throw error;
    },
  },
});

// 项目，多个不同 api 地址，可导出多个实例
// export const AlovaTwo = createAlova({
//   baseURL: 'http://localhost:9001',
// });
