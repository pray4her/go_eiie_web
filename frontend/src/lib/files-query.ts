import api from "@/lib/api";
import { ApiFile, FilesQueryResponse } from "@/types";

type FilesSortBy = "created_at" | "updated_at" | "last_activity_at";
type FilesSortOrder = "asc" | "desc";
type FilesScope = "parent" | "child" | "all";

interface FilesQueryParams {
  page?: number;
  page_size?: number;
  scope?: FilesScope;
  task_type?: string;
  processing_status?: string;
  customer_id?: number;
  keyword?: string;
  created_from?: string;
  created_to?: string;
  sort_by?: FilesSortBy;
  sort_order?: FilesSortOrder;
}

export async function fetchFilesQuery(params: FilesQueryParams): Promise<FilesQueryResponse> {
  const { page = 1 } = params;
  let { page_size = 20 } = params;

  if (page_size > 100) page_size = 100;
  if (page_size < 1) page_size = 1;

  const query: Record<string, string | number> = {
    page: Math.max(page, 1),
    page_size,
  };

  if (params.scope) query.scope = params.scope;
  if (params.task_type) query.task_type = params.task_type;
  if (params.processing_status) query.processing_status = params.processing_status;
  if (typeof params.customer_id === "number") query.customer_id = params.customer_id;
  if (params.keyword) query.keyword = params.keyword;
  if (params.created_from) query.created_from = params.created_from;
  if (params.created_to) query.created_to = params.created_to;
  if (params.sort_by) query.sort_by = params.sort_by;
  if (params.sort_order) query.sort_order = params.sort_order;

  const response = await api.get<FilesQueryResponse>("/files/query", {
    params: query,
  });

  return response.data;
}

export function mapFilesQueryItemToApiFile(item: FilesQueryResponse["items"][number]): ApiFile {
  return {
    ID: item.id,
    CreatedAt: item.created_at,
    UpdatedAt: item.updated_at,
    DeletedAt: null,
    UserID: 0,
    OriginalFileName: item.original_file_name,
    FileName: item.file_name,
    FilePath: "",
    StoragePath: "",
    FileSize: item.file_size,
    ContentType: item.content_type,
    FileType: item.file_type,
    UploadStatus: item.upload_status,
    ProcessingStatus: item.processing_status,
    ClassificationResult: null,
    ParentFileID: item.parent_file_id,
    TaskType: item.task_type,
  };
}
