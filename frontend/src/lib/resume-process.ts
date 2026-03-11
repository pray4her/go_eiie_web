import api from '@/lib/api';
import { useAuthStore } from '@/contexts/auth-store';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { toast } from 'sonner';
import {
  ResumeProcessJobDetailsResponse,
  ResumeProcessJobUpdatePayload,
  ResumeProcessJobsListResponse,
  ResumeProcessSecondaryResult,
  ResumeProcessUploadResponse,
} from '@/types';

interface ListParams {
  limit?: number;
  offset?: number;
}

export async function uploadResumeProcessFile(files: File | File[]): Promise<number> {
  const formData = new FormData();
  if (Array.isArray(files)) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  } else {
    formData.append('file', files);
  }

  const response = await api.post<ResumeProcessUploadResponse>('/resume-process/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.job_id;
}

export async function fetchResumeProcessJobs(params: ListParams): Promise<ResumeProcessJobsListResponse> {
  let { limit = 20 } = params;
  let { offset = 0 } = params;

  if (limit > 100) limit = 100;
  if (limit < 1) limit = 1;
  if (offset < 0) offset = 0;

  const response = await api.get<ResumeProcessJobsListResponse>('/resume-process/jobs', {
    params: { limit, offset },
  });

  return response.data;
}

export async function fetchResumeProcessJob(jobId: number | string): Promise<ResumeProcessJobDetailsResponse> {
  const response = await api.get<ResumeProcessJobDetailsResponse>(`/resume-process/jobs/${jobId}`);
  return {
    ...response.data,
    initial_result: response.data.initial_result ?? null,
    secondary_results: response.data.secondary_results ?? [],
  };
}

export async function triggerResumeProcessSecondary(jobId: number | string): Promise<void> {
  await api.post(`/resume-process/jobs/${jobId}/trigger-secondary`);
}

export async function fetchResumeProcessSecondaryResults(jobId: number | string): Promise<ResumeProcessSecondaryResult[]> {
  const response = await api.get<{ items: ResumeProcessSecondaryResult[] }>(`/resume-process/jobs/${jobId}/secondary-results`);
  return response.data.items ?? [];
}

export async function downloadResumeProcessExportTemplate(
  jobId: number | string
): Promise<{ blob: Blob; fileName: string }> {
  const response = await api.get(`/resume-process/jobs/${jobId}/export-template`, {
    responseType: 'blob',
  });

  const contentDisposition = (response.headers as Record<string, string | undefined>)['content-disposition'];
  let fileName = `resume_process_${jobId}.xls`;
  if (contentDisposition) {
    const filenameStarMatch = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i);
    const filenameMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
    const raw = (filenameStarMatch?.[1] ?? filenameMatch?.[1] ?? '').trim();
    if (raw) {
      const withoutQuotes = raw.replace(/^"(.+)"$/, '$1').trim();
      const rfc5987Match = withoutQuotes.match(/^([^']*)''(.+)$/);
      const value = rfc5987Match?.[2] ?? withoutQuotes;
      try {
        fileName = decodeURIComponent(value);
      } catch {
        fileName = value;
      }
    }
  }

  fileName = fileName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim();
  if (!fileName) fileName = `resume_process_${jobId}.xls`;

  return { blob: response.data as Blob, fileName };
}

interface ResumeProcessSSEOptions {
  onMessage: (data: ResumeProcessJobUpdatePayload) => void;
  onError?: (error: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  openWhenHidden?: boolean;
}

export function subscribeResumeProcessJob(
  jobId: number | string,
  options: ResumeProcessSSEOptions
): { close: () => void } {
  const controller = new AbortController();
  const keepOpenWhenHidden = options.openWhenHidden ?? true;

  const token = useAuthStore.getState().token;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';
  let baseUrl: URL;
  try {
    baseUrl = new URL(apiBase);
  } catch {
    const baseOrigin = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_API_BASE_URL ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin : 'http://localhost');
    baseUrl = new URL(apiBase, baseOrigin);
  }
  const base = baseUrl.toString().endsWith('/') ? baseUrl.toString() : `${baseUrl.toString()}/`;
  const url = new URL(`resume-process/subscribe/${jobId}`, base);
  if (token) url.searchParams.append('token', token);

  fetchEventSource(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    signal: controller.signal,
    openWhenHidden: keepOpenWhenHidden,
    async onopen(response) {
      if (!response.ok) {
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
          options.onError?.(new Error('Unauthorized'));
          controller.abort();
          return;
        }
        throw new Error(`Failed to connect: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/event-stream')) {
        try {
          const json = (await response.json()) as ResumeProcessJobUpdatePayload;
          options.onOpen?.();
          options.onMessage(json);
        } catch (error) {
          options.onError?.(error);
        } finally {
          controller.abort();
          options.onClose?.();
        }
        return;
      }

      options.onOpen?.();
    },
    onmessage(event) {
      if (event.event && event.event !== 'message') return;
      try {
        const data = JSON.parse(event.data) as ResumeProcessJobUpdatePayload;
        options.onMessage(data);
      } catch {
        return;
      }
    },
    onclose() {
      options.onClose?.();
    },
    onerror(error: unknown) {
      options.onError?.(error);
      throw error as unknown as Error;
    },
  }).catch((error: unknown) => {
    const abortName = (error as { name?: string } | null)?.name;
    if (abortName !== 'AbortError') {
      options.onError?.(error);
    }
  });

  return { close: () => controller.abort() };
}
