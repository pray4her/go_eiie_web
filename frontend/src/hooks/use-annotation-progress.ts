'use client';

import { useEffect, useRef, useState } from 'react';
import { AnnotationStatusMessage } from '@/types';
import { createSSEConnection } from '@/lib/sse';
import { useAuthStore } from '@/contexts/auth-store';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

interface UseAnnotationProgressOptions {
  fileId: number | null;
  enabled?: boolean;
  onStatusUpdate?: (status: AnnotationStatusMessage) => void;
}

interface AnnotationProgressState {
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  error: Error | null;
  connectionStatus: ConnectionStatus;
}

export function useAnnotationProgress({
  fileId,
  enabled = true,
  onStatusUpdate,
}: UseAnnotationProgressOptions): AnnotationProgressState {
  const [state, setState] = useState<AnnotationProgressState>({
    status: 'idle',
    message: '',
    error: null,
    connectionStatus: 'idle',
  });
  const connectionRef = useRef<{ close: () => void } | null>(null);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const { token } = useAuthStore();

  // 使用 ref 持有回调，避免因为回调标识变化导致副作用重复执行
  onStatusUpdateRef.current = onStatusUpdate;

  useEffect(() => {
    if (!enabled || !fileId || !token) {
      setState((prev) => ({
        ...prev,
        connectionStatus: 'idle',
      }));
      return;
    }

    const sseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/ocr-extract/subscribe-annotation/${fileId}`;
    setState((prev) => ({
      ...prev,
      connectionStatus: 'connecting',
    }));

    const connection = createSSEConnection<AnnotationStatusMessage>(sseUrl, {
      onOpen: () => {
        setState((prev) => ({
          ...prev,
          connectionStatus: 'connected',
        }));
      },
      onMessage: (data) => {
        setState((prev) => ({
          ...prev,
          status: data.status,
          message: data.message,
          error: null,
        }));
        onStatusUpdateRef.current?.(data);

        // 如果状态为 completed 或 failed，自动关闭连接
        if (data.status === 'completed' || data.status === 'failed') {
          connectionRef.current?.close();
          setState((prev) => ({
            ...prev,
            connectionStatus: 'closed',
          }));
        }
      },
      onError: (error) => {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error('SSE connection failed'),
          connectionStatus: 'error',
        }));
      },
      onClose: () => {
        setState((prev) => ({
          ...prev,
          connectionStatus: 'closed',
        }));
      },
      onPing: () => {
        // 心跳保持连接
      },
    });

    connectionRef.current = connection;

    return () => {
      connection.close();
    };
  }, [fileId, token, enabled]);

  return state;
}

