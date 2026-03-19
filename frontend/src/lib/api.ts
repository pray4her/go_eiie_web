import axios from 'axios';
import { useAuthStore } from '../contexts/auth-store';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

const AUTH_ROUTE_PATTERNS = [/\/auth\/login(?:\/)?$/i, /\/auth\/register(?:\/)?$/i];
const PROTECTED_ACTION_PATTERNS = [
  /\/files\/upload(?:\/)?$/i,
  /\/ocr-extract\/upload(?:\/)?$/i,
  /\/research-papers\/upload(?:\/)?$/i,
  /\/resume-process\/upload(?:\/)?$/i,
  /\/resume-process\/jobs\/[^/]+\/trigger-secondary(?:\/)?$/i,
  /\/writing\/generate(?:\/)?$/i,
  /\/images\/generate(?:\/)?$/i,
  /\/external-resumes\/generate(?:\/)?$/i,
];

function normalizeRequestUrl(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function extractErrorText(data: unknown): string {
  if (typeof data === 'string') return data;
  if (!data || typeof data !== 'object') return '';

  const record = data as Record<string, unknown>;
  const candidates = [record.message, record.error, record.msg, record.detail];
  const errors = Array.isArray(record.errors) ? record.errors : [];

  return [...candidates, ...errors]
    .filter((item): item is string => typeof item === 'string')
    .join(' ')
    .toLowerCase();
}

function isAuthRoute(url: string): boolean {
  return AUTH_ROUTE_PATTERNS.some((pattern) => pattern.test(url));
}

function isProtectedActionRoute(url: string): boolean {
  return PROTECTED_ACTION_PATTERNS.some((pattern) => pattern.test(url));
}

function shouldTreatAsUnauthorized(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const url = normalizeRequestUrl((error as { config?: { url?: string } })?.config?.url);

  if (status === 401) return true;
  if (status !== 400 || !url || isAuthRoute(url)) return false;

  const errorText = extractErrorText((error as { response?: { data?: unknown } })?.response?.data);
  const hasAuthHint = /(unauth|unauthori|auth|token|bearer|登录|登陆|未登录|未认证|认证|凭证|身份)/i.test(errorText);

  return hasAuthHint || isProtectedActionRoute(url);
}

function handleUnauthorizedRedirect() {
  if (isHandlingUnauthorized) return;

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
    if (shouldTreatAsUnauthorized(error)) {
      handleUnauthorizedRedirect();
    }
    return Promise.reject(error);
  }
);

export default api;
