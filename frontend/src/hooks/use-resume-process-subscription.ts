'use client';

import { useEffect, useRef, useState } from 'react';
import { ResumeProcessJobStatus, ResumeProcessJobUpdatePayload } from '@/types';
import { subscribeResumeProcessJob } from '@/lib/resume-process';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

interface UseResumeProcessSubscriptionOptions {
  jobId: number | string | null;
  enabled?: boolean;
  onStatusUpdate?: (payload: ResumeProcessJobUpdatePayload) => void;
}

interface ResumeProcessSubscriptionState {
  status: ResumeProcessJobStatus | 'idle';
  message: string;
  resultUrl?: string;
  error: Error | null;
  connectionStatus: ConnectionStatus;
}

export function useResumeProcessSubscription({
  jobId,
  enabled = true,
  onStatusUpdate,
}: UseResumeProcessSubscriptionOptions): ResumeProcessSubscriptionState {
  const [state, setState] = useState<ResumeProcessSubscriptionState>({
    status: 'idle',
    message: '',
    resultUrl: undefined,
    error: null,
    connectionStatus: 'idle',
  });

  const connectionRef = useRef<{ close: () => void } | null>(null);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  onStatusUpdateRef.current = onStatusUpdate;

  useEffect(() => {
    if (!enabled || !jobId) {
      setState((prev) => ({ ...prev, connectionStatus: 'idle' }));
      return;
    }

    setState((prev) => ({ ...prev, connectionStatus: 'connecting', error: null }));

    const connection = subscribeResumeProcessJob(jobId, {
      onOpen: () => {
        setState((prev) => ({ ...prev, connectionStatus: 'connected' }));
      },
      onMessage: (data) => {
        setState((prev) => ({
          ...prev,
          status: data.status,
          message: data.message ?? '',
          resultUrl: data.result_url,
          error: null,
        }));
        onStatusUpdateRef.current?.(data);

        if (data.status === 'completed' || data.status === 'failed') {
          try {
            connectionRef.current?.close();
          } catch {}
          setState((prev) => ({ ...prev, connectionStatus: 'closed' }));
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
        setState((prev) => ({ ...prev, connectionStatus: 'closed' }));
      },
    });

    connectionRef.current = connection;

    return () => {
      try {
        connection.close();
      } catch {}
    };
  }, [enabled, jobId]);

  return state;
}

