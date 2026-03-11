import api from '@/lib/api';
import { ExternalResumeJobDetails, ExternalResumeJobsListResponse, JobStatus } from '@/types';

interface ListParams {
  page?: number;
  page_size?: number;
  status?: JobStatus | '';
}

export async function fetchExternalResumeJobs(params: ListParams): Promise<ExternalResumeJobsListResponse> {
  const { page = 1 } = params;
  let { page_size = 20 } = params;
  const status = params.status ?? '';

  if (page_size > 100) page_size = 100;
  if (page_size < 1) page_size = 1;

  const query: Record<string, string | number> = { page, page_size };
  if (status) query.status = status;

  const response = await api.get<ExternalResumeJobsListResponse>('/external-resumes/jobs', {
    params: query,
  });

  return response.data;
}

export async function fetchExternalResumeJob(jobId: string): Promise<ExternalResumeJobDetails> {
  const response = await api.get<ExternalResumeJobDetails>(`/external-resumes/jobs/${jobId}`);
  return response.data;
}

export function getExternalResumeDownloadPath(jobId: string): string {
  return `/api/v1/external-resumes/jobs/${jobId}/download`;
}


