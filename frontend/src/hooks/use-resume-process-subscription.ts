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
  /** 初次分析状态 */
  jobStatus: ResumeProcessJobStatus | 'idle';
  /** 二次生成状态（SSE 推送的 secondary_status） */
  secondaryStatus: string | 'idle';
  message: string;
  runId?: number;
  error: Error | null;
  connectionStatus: ConnectionStatus;
}

const SECONDARY_TERMINAL_STATUSES = ['completed', 'completed_partial', 'failed'];

function isSecondaryTerminal(status?: string): boolean {
  return status != null && SECONDARY_TERMINAL_STATUSES.includes(status);
}

export function useResumeProcessSubscription({
  jobId,
  enabled = true,
  onStatusUpdate,
}: UseResumeProcessSubscriptionOptions): ResumeProcessSubscriptionState {
  const [state, setState] = useState<ResumeProcessSubscriptionState>({
    jobStatus: 'idle',
    secondaryStatus: 'idle',
    message: '',
    runId: undefined,
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
        const jobStatus = (data.job_status ?? data.status) as ResumeProcessJobStatus | undefined;
        const secondaryStatus = data.secondary_status ?? (data.stage === 'secondary' ? data.status : undefined);
        setState((prev) => ({
          ...prev,
          jobStatus: jobStatus ?? prev.jobStatus,
          secondaryStatus: secondaryStatus ?? prev.secondaryStatus,
          message: data.message ?? '',
          runId: data.run_id ?? prev.runId,
          error: null,
        }));
        onStatusUpdateRef.current?.(data);

        if (data.stage === 'initial' && (data.status === 'completed' || data.status === 'failed')) {
          try {
            connectionRef.current?.close();
          } catch {}
          setState((prev) => ({ ...prev, connectionStatus: 'closed' }));
        } else if (data.stage === 'secondary' && isSecondaryTerminal(data.status)) {
          try {
            connectionRef.current?.close();
          } catch {}
          setState((prev) => ({ ...prev, connectionStatus: 'closed' }));
        } else if (!data.stage && (data.status === 'completed' || data.status === 'failed')) {
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

