import api from '@/lib/api';
import {
  AutoAnnotationJobsListResponse,
  AutoAnnotationJobDetail,
  AutoAnnotationJobListItem,
  AutoAnnotationItem,
} from '@/types';

interface ListParams {
  page?: number;
  page_size?: number;
}

// 后端原始列表 Job 结构（兼容 GORM 默认字段）
interface RawAutoAnnotationJobListItem {
  ID?: number;
  id?: number;
  CreatedAt?: string;
  created_at?: string;
  UpdatedAt?: string;
  updated_at?: string;
  DeletedAt?: string | null;
  user_id: number;
  extraction_parent_file_id: number;
  expert_name: string | null;
  status: string;
  result_zip_path?: string | null;
}

interface RawAutoAnnotationJobsListResponse {
  items: RawAutoAnnotationJobListItem[];
  total: number;
  page: number;
  page_size: number;
  total_page: number;
}

// 后端原始明细结构
interface RawAutoAnnotationItem {
  ID?: number;
  id?: number;
  job_id: number;
  file_id: number;
  original_file_name: string;
  relative_path: string;
  detected_type_prefix: string;
  ocr_file_type: string;
  is_paper: boolean;
  normalized_pdf_path?: string | null;
  annotated_pdf_path?: string | null;
  status: string;
  error?: string | null;
  CreatedAt?: string;
  created_at?: string;
  UpdatedAt?: string;
  updated_at?: string;
  // 其余字段原样透传
  stage1_data?: Record<string, unknown>;
  coordinates?: Record<string, unknown>;
  ocr_raw?: Record<string, unknown>;
  stage2_raw?: Record<string, unknown>;
}

interface RawAutoAnnotationJobDetail {
  job: RawAutoAnnotationJobListItem;
  items: RawAutoAnnotationItem[];
}

// 规范化 Job 字段，统一为前端内部使用的驼峰 + 下划线格式
function normalizeJob(item: RawAutoAnnotationJobListItem): AutoAnnotationJobListItem {
  const id = item.id ?? item.ID ?? 0;
  const created_at = item.created_at ?? item.CreatedAt ?? '';
  const updated_at = item.updated_at ?? item.UpdatedAt ?? created_at;

  return {
    id,
    user_id: item.user_id,
    extraction_parent_file_id: item.extraction_parent_file_id,
    expert_name: item.expert_name ?? null,
    status: item.status as AutoAnnotationJobListItem['status'],
    result_zip_path: item.result_zip_path || null,
    created_at,
    updated_at,
  };
}

// 规范化明细字段
function normalizeItem(item: RawAutoAnnotationItem): AutoAnnotationItem {
  const id = item.id ?? item.ID ?? 0;
  const created_at = item.created_at ?? item.CreatedAt ?? '';
  const updated_at = item.updated_at ?? item.UpdatedAt ?? created_at;

  return {
    id,
    job_id: item.job_id,
    file_id: item.file_id,
    original_file_name: item.original_file_name,
    relative_path: item.relative_path,
    detected_type_prefix: item.detected_type_prefix,
    ocr_file_type: item.ocr_file_type,
    is_paper: item.is_paper,
    normalized_pdf_path: item.normalized_pdf_path ?? null,
    annotated_pdf_path: item.annotated_pdf_path ?? null,
    status: item.status as AutoAnnotationItem['status'],
    error: item.error ?? null,
    created_at,
    updated_at,
    stage1_data: item.stage1_data,
    coordinates: item.coordinates,
    ocr_raw: item.ocr_raw,
    stage2_raw: item.stage2_raw,
  };
}

// 获取自动标注 Job 列表（对后端字段做一层标准化）
export async function fetchAutoAnnotationJobs(
  params: ListParams = {}
): Promise<AutoAnnotationJobsListResponse> {
  const { page = 1 } = params;
  let { page_size = 20 } = params;

  if (page_size > 100) page_size = 100;
  if (page_size < 1) page_size = 1;

  const query: Record<string, string | number> = { page, page_size };

  const response = await api.get<RawAutoAnnotationJobsListResponse>(
    '/auto-annotations/jobs',
    { params: query }
  );

  const raw = response.data;

  return {
    items: (raw.items || []).map(normalizeJob),
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    total_page: raw.total_page,
  };
}

// 获取单个自动标注 Job 详情（对后端字段做一层标准化）
export async function fetchAutoAnnotationJob(
  jobId: string
): Promise<AutoAnnotationJobDetail> {
  const response = await api.get<RawAutoAnnotationJobDetail>(
    `/auto-annotations/jobs/${jobId}`
  );

  const raw = response.data;

  return {
    job: normalizeJob(raw.job),
    items: (raw.items || []).map(normalizeItem),
  };
}

// 构造自动标注结果压缩包下载路径（用于非 axios 下载场景）
export function getAutoAnnotationDownloadPath(jobId: string | number): string {
  return `/api/v1/auto-annotations/jobs/${jobId}/download`;
}

