import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '../contexts/auth-store';
import { toast } from 'sonner';

interface SSEOptions<T> {
  onMessage: (data: T) => void;
  onError?: (error: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onPing?: () => void;
  retryMs?: number;           // default 5000
  openWhenHidden?: boolean;   // default true
}

export function createSSEConnection<T>(
  url: string,
  options: SSEOptions<T>
): { close: () => void } {
  const { onMessage, onError, onOpen, onClose, onPing } = options;
  const keepOpenWhenHidden = options.openWhenHidden ?? true;
  const controller = new AbortController();

  const token = useAuthStore.getState().token;
  // 兼容相对路径：当 url 为 "/api/..." 时，需提供基准 origin
  let urlWithToken: URL;
  try {
    urlWithToken = new URL(url);
  } catch {
    const baseOrigin = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_API_BASE_URL ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin : 'http://localhost');
    urlWithToken = new URL(url, baseOrigin);
  }
  if (token) {
    urlWithToken.searchParams.append('token', token);
  }

  fetchEventSource(urlWithToken.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    signal: controller.signal,
    openWhenHidden: keepOpenWhenHidden,

    async onopen(response) {
      if (response.ok) {
        onOpen?.();
        return;
      }
      if (response.status === 401 || response.status === 403) {
        try {
          useAuthStore.getState().logout();
        } catch {}
        try {
          toast.error('登录信息失效，请重新登录');
        } catch {}
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        onError?.(new Error('Unauthorized'));
        controller.abort(); // stop retries on auth failure
        return;
      }
      throw new Error(`Failed to connect: ${response.status}`);
    },

    onmessage(event) {
      // Only parse default message events; ignore heartbeats and other custom events
      if (event.event && event.event !== 'message' && event.event !== 'cancelled') {
        if (event.event === 'ping') {
          onPing?.();
        }
        return;
      }
      try {
        const data = JSON.parse(event.data) as T;
        // If event is cancelled, we might need to ensure the data has status cancelled if not present
        if (event.event === 'cancelled') {
             const dataObj = data as Record<string, unknown>;
             if (dataObj.status === undefined) {
               dataObj.status = 'cancelled';
             }
        }
        onMessage(data);
      } catch {
        // Non-JSON events or malformed payloads should not spam errors
        // Keep silent to avoid unnecessary toasts; still allow debugging if needed
        // console.debug('Ignored non-JSON SSE payload:', event.data);
      }
    },

    onclose() {
      onClose?.();
    },

    onerror(error: unknown) {
      onError?.(error);
      // Rethrow to let fetch-event-source handle retry logic
      throw error as unknown as Error;
    },
  }).catch((error: unknown) => {
    const abortName = (error as { name?: string } | null)?.name;
    if (abortName !== 'AbortError') {
      onError?.(error);
    }
  });

  return {
    close: () => {
      controller.abort();
    },
  };
}
