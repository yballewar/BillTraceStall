import axios from 'axios';
import { clearAuth, getAccessToken } from './storage';
import { emitUnauthorized } from './authEvents';

const resolvedBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://billtracestall.billtraceinfotech.com/api/v1';

export const api = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 60000,
});

let unauthorizedHandled = false;

api.interceptors.request.use(async (config) => {
  if (__DEV__) {
    console.log('API', (config.baseURL ?? resolvedBaseUrl) + '/' + String(config.url ?? '').replace(/^\/+/, ''));
  }
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const baseURL = error?.config?.baseURL ?? resolvedBaseUrl;
    const url = String(error?.config?.url ?? '');
    const full = baseURL.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (__DEV__) {
      console.log('API_ERROR', full, status ?? 'NO_STATUS', data ?? error?.message ?? 'UNKNOWN');
    }
    if (status === 401 && !unauthorizedHandled) {
      unauthorizedHandled = true;
      await clearAuth();
      emitUnauthorized();
      setTimeout(() => {
        unauthorizedHandled = false;
      }, 1000);
    }
    return Promise.reject(error);
  }
);
