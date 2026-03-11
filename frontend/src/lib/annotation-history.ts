import api from '@/lib/api';
import { AnnotationHistoryListResponse, AnnotationHistoryDetail } from '@/types';

interface ListParams {
  page?: number;
  page_size?: number;
}

export async function fetchAnnotationHistory(
  params: ListParams = {}
): Promise<AnnotationHistoryListResponse> {
  const { page = 1 } = params;
  let { page_size = 20 } = params;

  if (page_size > 100) page_size = 100;
  if (page_size < 1) page_size = 1;

  const query: Record<string, string | number> = { page, page_size };

  const response = await api.get<AnnotationHistoryListResponse>('/ocr-extract/history', {
    params: query,
  });

  return response.data;
}

export async function fetchAnnotationHistoryDetail(
  fileId: number
): Promise<AnnotationHistoryDetail> {
  const response = await api.get<AnnotationHistoryDetail>(`/ocr-extract/history/${fileId}`);
  return response.data;
}

