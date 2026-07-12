import { Alova } from '@/utils/http/alova/index';

/**
 * @description: 获取用户信息
 */
export function getUserInfo() {
  return Alova.Get<any>('/auth/info', {
    meta: {
      isReturnNativeResponse: true,
    },
  });
}

/**
 * @description: 用户登录
 */
export function login(params: { username: string; password: string }) {
  return Alova.Post<any>(
    '/auth/login',
    params,
    {
      meta: {
        isReturnNativeResponse: true,
      },
    }
  );
}

/**
 * @description: 用户登出
 */
export function logout() {
  return Alova.Post('/auth/logout');
}
