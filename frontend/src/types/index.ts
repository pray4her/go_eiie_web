// in src/types/index.ts

export type ProcessingStatus =
  | 'queued'
  | 'pending'
  | 'preprocessing'
  | 'processing'
  | 'classifying'
  | 'classified'
  | 'extracting'
  | 'completed'
  | 'failed'
  | 'process_failed'
  | 'unsupported';

export interface ApiFile {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  UserID: number;
  OriginalFileName: string;
  FileName: string;
  FilePath: string;
  StoragePath: string;
  FileSize: number;
  ContentType: string;
  FileType: string;
  UploadStatus: string;
  ProcessingStatus: ProcessingStatus;
  ClassificationResult: string | null;
  ParentFileID: number | null;
  TaskType?: string;
}

export interface ClassificationResult {
  category?: string;
  folder_category?: string;
  file_name?: string;
  analysis_trace?: string | Record<string, unknown> | unknown[] | null;
  [key: string]: unknown;
}

export interface ApiSubFile {
  file_id: number;
  original_file_name: string;
  upload_status: string;
  processing_status: ProcessingStatus;
  has_classification_result: boolean;
  classification_result?: ClassificationResult;
  file_type?: string;
  folder_category?: string;
  classified_file_name?: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'failed_partial';

export interface GenerationResult {
  id: number;
  created_at: string;
  updated_at: string;
  prompt_name: string;
  status: JobStatus;
  generated_content: string;
  error_message: string;
  grounding_metadata: Record<string, unknown> | null;
}

export interface GenerationJob {
  id: number;
  user_id?: number;
  username?: string;
  proposal_file?: {
    id: number;
    original_file_name: string;
  };
  resume_file?: {
    id: number;
    original_file_name: string;
  };
  status: JobStatus;
  createdAt: string; 
  updated_at?: string;
  result?: string;
  results?: GenerationResult[];
}

export interface ImageGenerationJob {
  id: number;
  status: JobStatus;
  created_at: string;
  updated_at?: string;
  result_url?: string;
  error_message?: string;
}

export interface ImageJobUpdatePayload {
  status: 'completed' | 'failed';
  message: string;
  result_url?: string;
}

export interface ExternalResumeJob {
  id: string;
  status: JobStatus;
  message?: string;
  result_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface ExternalResumeJobUpdatePayload {
  status: JobStatus;
  message?: string;
  result_url?: string;
}

// 文件提取 SSE 负载类型
export type FileExtractionSSEPayload =
  | {
      parent_file_id: number;
      status: 'progress';
      child_file_id: number;
    }
  | {
      parent_file_id: number;
      status: 'completed';
    }
  | {
      parent_file_id: number;
      status: 'cancelled';
    };

// ========== Writing (200字生成) SSE 增量状态 ==========
export interface WritingJobUpdatePayload {
  job_id: number;
  status: JobStatus;
  message?: string;
  result_url?: string;
}

// ========== External Resume (history list & details) ==========
export interface ExternalResumeJobListItem {
  id: number;
  job_id: string | number;
  status: JobStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  generated_docx_file_id?: number | null;
  source_file_name?: string;
}

export interface ExternalResumeJobsListResponse {
  items: ExternalResumeJobListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ========== External Resume Details (structured result) ==========
export interface SummaryAndWarnings {
  has_gaps?: boolean;
  gap_details?: string | null;
  has_overlaps?: boolean;
  analysis_notes?: string;
  overlap_details?: string | null;
}

export interface TimelineEntry {
  country?: string;
  major_zh?: string;
  degree_zh?: string;
  date_range?: string;
  entry_type: 'Education' | 'Work' | string;
  institution_name_zh?: string;
  position_zh?: string;
}

export interface ProfessionalExperience {
  summary_and_warnings?: SummaryAndWarnings;
  professional_timeline?: TimelineEntry[];
}

export interface ResearchDirection {
  direction_name?: string;
  details?: string[];
}

export interface ResearchProfile {
  analysis?: string;
  summary_statement?: string;
  research_directions?: ResearchDirection[];
}

export interface HonorOrTitle {
  year?: string | number;
  honor_name_zh?: string;
  issuing_organization?: string;
}

export interface AcademicPartTimeRole {
  role_title?: string;
  organization_name?: string;
}

export interface HonorsAndRoles {
  honors_and_titles?: HonorOrTitle[];
  academic_part_time_roles?: AcademicPartTimeRole[];
}

export interface PatentsInfo {
  summary?: string;
  analysis?: string;
  has_patents?: boolean;
}

export interface ProjectsInfo {
  summary?: string;
  analysis?: string;
  has_projects?: boolean;
  recent_projects?: string[];
}

export interface PublicationsInfo {
  analysis?: string;
  recent_papers?: string[];
  has_publications?: boolean;
}

export interface AcademicAchievements {
  patents?: PatentsInfo;
  projects?: ProjectsInfo;
  publications?: PublicationsInfo;
}

export interface ExpertSummary {
  analysis?: string;
  phd_education?: {
    country?: string;
    institution?: string;
    graduation_year?: number;
    qs_ranking?: number;
  };
  current_employment?: {
    country?: string;
    position?: string;
    institution_description?: string;
  };
  identity_and_birth?: {
    is_guess?: boolean;
    birth_year?: number;
    birth_country?: string;
    is_chinese_descendant?: boolean;
  };
}

export interface BasicSummary {
  expert_summary?: ExpertSummary;
}

export interface ExternalResumeJobDetails extends ExternalResumeJobListItem {
  professional_experience?: ProfessionalExperience;
  research_profile?: ResearchProfile;
  honors_and_roles?: HonorsAndRoles;
  academic_achievements?: AcademicAchievements;
  basic_summary?: BasicSummary;
}

// 学位类型定义
export type DegreeType = 'bachelor' | 'master' | 'doctor';

// 学位过滤接口
export interface DegreeFilterSettings {
  excludedDegrees: DegreeType[];
}

// 生成任务请求接口（带学位过滤）
export interface GenerationRequest {
  proposal_file?: File;
  resume_file?: File;
  excluded_degrees?: string; // 前端使用逗号分隔的字符串发送
}

// ========== Annotation (标注模块) ==========
export interface AnnotationUploadResponse {
  queued: QueuedAnnotationTask[];
}

export interface QueuedAnnotationTask {
  task_id: string;
  file_id: number;
  sse: string;
  trace_id: string;
}

export interface AnnotationStatusMessage {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
}

// ========== Annotation History (历史标注) ==========
export interface AnnotationHistoryItem {
  file_id: number;
  file_name: string;
  original_name: string;
  file_type: string;
  has_annotated_pdf: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnotationHistoryListResponse {
  items: AnnotationHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_page: number;
}

export interface AnnotationHistoryDetail {
  file_id: number;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  content_type: string;
  has_annotated_pdf: boolean;
  data?: Record<string, unknown>;
  coordinates?: Record<string, unknown>;
  ocr_raw?: Record<string, unknown>;
  stage2_raw?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ========== Auto Annotation (自动标注 Job 与明细) ==========

// 自动标注 Job 状态
export type AutoAnnotationJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'partial';

// 自动标注 Job 列表项
export interface AutoAnnotationJobListItem {
  id: number;
  user_id: number;
  extraction_parent_file_id: number;
  expert_name: string | null;
  status: AutoAnnotationJobStatus;
  result_zip_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutoAnnotationJobsListResponse {
  items: AutoAnnotationJobListItem[];
  total: number;
  page: number;
  page_size: number;
  total_page: number;
}

// 自动标注子项状态
export type AutoAnnotationItemStatus = 'pending' | 'running' | 'completed' | 'failed';

// 自动标注单个文件明细
export interface AutoAnnotationItem {
  id: number;
  job_id: number;
  file_id: number;
  original_file_name: string;
  relative_path: string;
  detected_type_prefix: string;
  ocr_file_type: string;
  is_paper: boolean;
  normalized_pdf_path: string | null;
  annotated_pdf_path: string | null;
  status: AutoAnnotationItemStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
  // 预留的后端附加数据字段
  stage1_data?: Record<string, unknown>;
  coordinates?: Record<string, unknown>;
  ocr_raw?: Record<string, unknown>;
  stage2_raw?: Record<string, unknown>;
}

// 自动标注 Job 详情（包含 Job 元信息和所有子项）
export interface AutoAnnotationJobDetail {
  job: AutoAnnotationJobListItem;
  items: AutoAnnotationItem[];
}

// ========== Research Paper Auto Annotation (论文自动标注) ==========

export type ResearchPaperJobStatus =
  | 'pending'
  | 'extracting'
  | 'annotating'
  | 'completed'
  | 'failed';

export interface ResearchPaperJob {
  id: number;
  user_id: number;
  expert_name: string;
  file_id: number;
  status: ResearchPaperJobStatus;
  annotated_pdf_path: string;
  error: string;
  created_at: string;
  updated_at?: string;
}

export interface ResearchPaperMetadata {
  id: number;
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

export interface ResearchPaperJobDetail {
  job: ResearchPaperJob;
  papers: ResearchPaperMetadata[];
}

// ========== Resume Process (简历处理模块) ==========

export type ResumeProcessJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'completed_partial'
  | 'secondary_completed';

export interface ResumeProcessJob {
  id: number;
  user_id: number;
  source_file_id: number;
  status: ResumeProcessJobStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ResumeProcessInitialResult {
  job_id: number;
  raw_response: string;
  parsed_result: Record<string, unknown> | { text: string } | string | null;
  status: 'processing' | 'completed' | 'error';
  error_message: string | null;
}

export interface ResumeProcessSecondaryResult {
  id: number;
  job_id: number;
  prompt_id: number;
  generated_text: string;
  status: 'processing' | 'completed' | 'error';
  error_message: string | null;
}

export interface ResumeProcessUploadResponse {
  message: string;
  job_id: number;
}

export interface ResumeProcessJobsListResponse {
  total: number;
  items: ResumeProcessJob[];
}

export interface ResumeProcessJobDetailsResponse {
  job: ResumeProcessJob;
  initial_result: ResumeProcessInitialResult | null;
  secondary_results: ResumeProcessSecondaryResult[];
}

export interface ResumeProcessJobUpdatePayload {
  job_id: number;
  status: ResumeProcessJobStatus;
  message?: string;
  result_url?: string;
}
