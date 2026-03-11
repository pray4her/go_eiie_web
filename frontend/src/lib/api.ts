import axios from 'axios';
import { useAuthStore } from '../contexts/auth-store';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    // 直接从 store 的 state 中获取 token
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 防抖，避免重复弹出或多次跳转
let isHandlingUnauthorized = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        try {
          useAuthStore.getState().logout();
        } catch {}
        try {
          toast.error('登录信息失效，请重新登录');
        } catch {}
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
