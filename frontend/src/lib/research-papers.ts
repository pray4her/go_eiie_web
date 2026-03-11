import api from '@/lib/api';
import {
  ResearchPaperJob,
  ResearchPaperJobDetail,
  ResearchPaperMetadata,
} from '@/types';

// 后端原始 Job 结构（兼容 GORM 默认字段）
interface RawResearchPaperJob {
  ID: number;
  CreatedAt: string;
  UpdatedAt?: string;
  user_id: number;
  expert_name: string;
  file_id: number;
  status: string;
  annotated_pdf_path: string;
  error: string;
}

// 后端原始元数据结构
interface RawResearchPaperMetadata {
  ID: number;
  job_id: number;
  title_zh: string;
  title_en: string;
  journal_name: string;
  volume_issue_year: string;
  author_order: string;
  start_page: string;
  end_page: string;
  anchors: {
    title_en_anchor: string;
    expert_anchor: string;
    journal_anchor: string;
  };
}

interface RawResearchPaperJobDetail {
  job: RawResearchPaperJob;
  papers: RawResearchPaperMetadata[];
}

// 规范化 Job 字段
function normalizeJob(item: RawResearchPaperJob): ResearchPaperJob {
  return {
    id: item.ID,
    user_id: item.user_id,
    expert_name: item.expert_name,
    file_id: item.file_id,
    status: item.status as ResearchPaperJob['status'],
    annotated_pdf_path: item.annotated_pdf_path,
    error: item.error,
    created_at: item.CreatedAt,
    updated_at: item.UpdatedAt,
  };
}

// 规范化元数据字段
function normalizeMetadata(item: RawResearchPaperMetadata): ResearchPaperMetadata {
  return {
    id: item.ID,
    job_id: item.job_id,
    title_zh: item.title_zh,
    title_en: item.title_en,
    journal_name: item.journal_name,
    volume_issue_year: item.volume_issue_year,
    author_order: item.author_order,
    start_page: item.start_page,
    end_page: item.end_page,
    anchors: item.anchors,
  };
}

/**
 * 上传论文并启动任务
 */
export async function uploadResearchPaper(file: File, expertName: string): Promise<{ message: string; job_id: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('expert_name', expertName);

  const response = await api.post<{ message: string; job_id: number }>(
    '/research-papers/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * 获取任务列表
 */
export async function fetchResearchPaperJobs(): Promise<ResearchPaperJob[]> {
  const response = await api.get<RawResearchPaperJob[]>('/research-papers/jobs');
  return (response.data || []).map(normalizeJob);
}

/**
 * 获取任务详情
 */
export async function fetchResearchPaperJobDetail(id: number | string): Promise<ResearchPaperJobDetail> {
  const response = await api.get<RawResearchPaperJobDetail>(`/research-papers/jobs/${id}`);
  const raw = response.data;

  return {
    job: normalizeJob(raw.job),
    papers: (raw.papers || []).map(normalizeMetadata),
  };
}

/**
 * 删除任务
 */
export async function deleteResearchPaperJob(id: number | string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/research-papers/jobs/${id}`);
  return response.data;
}

/**
 * 获取标注 PDF 的下载链接 (方式 A：推荐方式，通过任务 ID 下载)
 */
export function getAnnotatedPdfUrl(jobId: number | string): string {
  if (!jobId) return '';
  return `/api/v1/research-papers/jobs/${jobId}/download`;
}

/**
 * 通过路径下载 (方式 B：兼容方式)
 */
export function getAnnotatedPdfUrlByPath(path: string): string {
  if (!path) return '';
  // 如果路径已经是完整 URL 或以 /api 开头，直接返回
  if (path.startsWith('http') || path.startsWith('/api')) {
    return path;
  }
  return `/api/v1/research-papers/download?path=${encodeURIComponent(path)}`;
}

