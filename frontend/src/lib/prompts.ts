import axios from 'axios';
import api from '@/lib/api';
import {
  CreatePromptVersionRequest,
  PromptActionResponse,
  PromptListItem,
  PromptMutationResponse,
  PromptRecord,
  PromptRelease,
  PromptResolved,
  PublishPromptReleaseRequest,
} from '@/types';

interface PromptDataEnvelope<T> {
  data?: T;
}

interface FetchPromptListParams {
  prompt_type?: string;
  label?: string;
}

/** 后端可能返回 snake_case（文档示例）或 Go 默认 PascalCase（如 ID、SystemPrompt） */
function asJsonRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickNumber(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  }
  return null;
}

function pickNullableString(obj: Record<string, unknown>, ...keys: string[]): string | null {
  const s = pickString(obj, ...keys);
  if (s === null) return null;
  return s.trim() === '' ? null : s;
}

function pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'boolean') return v;
  }
  return false;
}

function normalizePromptRecord(record: unknown): PromptRecord {
  const r = asJsonRecord(record);
  if (!r) {
    return {
      id: 0,
      name: null,
      prompt_type: '',
      provider: null,
      model_name: null,
      version: 0,
      system_prompt: null,
      user_prompt_template: null,
      json_schema: null,
      created_at: null,
      updated_at: null,
    };
  }

  return {
    id: pickNumber(r, 'id', 'ID'),
    name: pickNullableString(r, 'name', 'Name'),
    prompt_type: pickString(r, 'prompt_type', 'PromptType') ?? '',
    provider: pickNullableString(r, 'provider', 'Provider'),
    model_name: pickNullableString(r, 'model_name', 'modelName', 'ModelName'),
    version: pickNumber(r, 'version', 'Version'),
    system_prompt: pickNullableString(r, 'system_prompt', 'systemPrompt', 'SystemPrompt'),
    user_prompt_template: pickNullableString(
      r,
      'user_prompt_template',
      'userPromptTemplate',
      'UserPromptTemplate'
    ),
    json_schema: pickNullableString(r, 'json_schema', 'jsonSchema', 'JsonSchema', 'JSONSchema'),
    created_at: pickNullableString(r, 'created_at', 'CreatedAt'),
    updated_at: pickNullableString(r, 'updated_at', 'UpdatedAt'),
  };
}

function normalizePromptListItem(item: unknown): PromptListItem {
  const r = asJsonRecord(item);
  if (!r) {
    return {
      prompt_type: '',
      label: '',
      prompt_id: 0,
      version: 0,
      provider: null,
      model_name: null,
      schema_hash: null,
      is_protected: false,
      release_at: null,
      release_by: null,
      description: null,
    };
  }

  return {
    prompt_type: pickString(r, 'prompt_type', 'PromptType') ?? '',
    label: pickString(r, 'label', 'Label') ?? '',
    prompt_id: pickNumber(r, 'prompt_id', 'promptId', 'PromptId'),
    version: pickNumber(r, 'version', 'Version'),
    provider: pickNullableString(r, 'provider', 'Provider'),
    model_name: pickNullableString(r, 'model_name', 'modelName', 'ModelName'),
    schema_hash: pickNullableString(r, 'schema_hash', 'schemaHash', 'SchemaHash'),
    is_protected: pickBool(r, 'is_protected', 'isProtected', 'IsProtected'),
    release_at: pickNullableString(r, 'release_at', 'releaseAt', 'ReleaseAt'),
    release_by: pickNullableString(r, 'release_by', 'releaseBy', 'ReleaseBy'),
    description: pickNullableString(r, 'description', 'Description'),
  };
}

function normalizePromptRelease(item: unknown): PromptRelease {
  const r = asJsonRecord(item);
  if (!r) {
    return {
      prompt_type: '',
      label: '',
      prompt_id: 0,
      is_protected: false,
      description: null,
      release_at: null,
      release_by: null,
    };
  }

  return {
    prompt_type: pickString(r, 'prompt_type', 'PromptType') ?? '',
    label: pickString(r, 'label', 'Label') ?? '',
    prompt_id: pickNumber(r, 'prompt_id', 'promptId', 'PromptId'),
    is_protected: pickBool(r, 'is_protected', 'isProtected', 'IsProtected'),
    description: pickNullableString(r, 'description', 'Description'),
    release_at: pickNullableString(r, 'release_at', 'releaseAt', 'ReleaseAt'),
    release_by: pickNullableString(r, 'release_by', 'releaseBy', 'ReleaseBy'),
  };
}

function normalizePromptResolved(item: unknown): PromptResolved {
  const r = asJsonRecord(item);
  if (!r) {
    return {
      label: 'production',
      schema_hash: null,
      provider: null,
      model_name: null,
      cache_source: null,
      description: null,
      release_at: null,
      release_by: null,
      is_protected: undefined,
      prompt: normalizePromptRecord(null),
    };
  }

  const nestedPrompt = r.prompt ?? r.Prompt;

  const isProtectedRaw = r.is_protected ?? r.isProtected ?? r.IsProtected;
  const is_protected =
    typeof isProtectedRaw === 'boolean' ? isProtectedRaw : undefined;

  return {
    label: pickString(r, 'label', 'Label') ?? 'production',
    schema_hash: pickNullableString(r, 'schema_hash', 'schemaHash', 'SchemaHash'),
    provider: pickNullableString(r, 'provider', 'Provider'),
    model_name: pickNullableString(r, 'model_name', 'modelName', 'ModelName'),
    cache_source: pickNullableString(r, 'cache_source', 'cacheSource', 'CacheSource'),
    description: pickNullableString(r, 'description', 'Description'),
    release_at: pickNullableString(r, 'release_at', 'releaseAt', 'ReleaseAt'),
    release_by: pickNullableString(r, 'release_by', 'releaseBy', 'ReleaseBy'),
    is_protected,
    prompt: normalizePromptRecord(nestedPrompt),
  };
}

function extractMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim()) return data;
  if (!data || typeof data !== 'object') return fallback;

  const record = data as Record<string, unknown>;
  const candidates = [record.message, record.error, record.detail, record.msg];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }

  return fallback;
}

function encodePromptType(promptType: string): string {
  return encodeURIComponent(promptType);
}

export function getPromptErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return extractMessage(error.response?.data, fallback);
  }

  return fallback;
}

export async function fetchPromptList(
  params: FetchPromptListParams = {}
): Promise<PromptListItem[]> {
  const response = await api.get<PromptDataEnvelope<PromptListItem[]>>('/prompts', {
    params: {
      prompt_type: params.prompt_type?.trim() || undefined,
      label: params.label?.trim() || undefined,
    },
  });

  return (response.data.data ?? []).map((item) => normalizePromptListItem(item));
}

export async function createPrompt(
  payload: CreatePromptVersionRequest
): Promise<PromptMutationResponse> {
  const response = await api.post<PromptMutationResponse>('/prompts', payload);
  return {
    message: response.data.message,
    data: normalizePromptRecord(response.data.data),
  };
}

export async function fetchPromptResolved(
  promptType: string,
  label?: string
): Promise<PromptResolved | null> {
  try {
    const response = await api.get<PromptDataEnvelope<PromptResolved>>(
      `/prompts/${encodePromptType(promptType)}`,
      {
        params: {
          label: label?.trim() || undefined,
        },
      }
    );

    return normalizePromptResolved(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function fetchPromptVersions(promptType: string): Promise<PromptRecord[]> {
  const response = await api.get<PromptDataEnvelope<PromptRecord[]>>(
    `/prompts/${encodePromptType(promptType)}/versions`
  );

  return (response.data.data ?? []).map((item) => normalizePromptRecord(item));
}

export async function createPromptVersion(
  promptType: string,
  payload: CreatePromptVersionRequest
): Promise<PromptMutationResponse> {
  const response = await api.post<PromptMutationResponse>(
    `/prompts/${encodePromptType(promptType)}/versions`,
    payload
  );

  return {
    message: response.data.message,
    data: normalizePromptRecord(response.data.data),
  };
}

export async function fetchPromptReleases(promptType: string): Promise<PromptRelease[]> {
  const response = await api.get<PromptDataEnvelope<PromptRelease[]>>(
    `/prompts/${encodePromptType(promptType)}/releases`
  );

  return (response.data.data ?? []).map((item) => normalizePromptRelease(item));
}

export async function publishPromptRelease(
  promptType: string,
  label: string,
  payload: PublishPromptReleaseRequest
): Promise<PromptActionResponse> {
  const response = await api.post<PromptActionResponse>(
    `/prompts/${encodePromptType(promptType)}/releases/${encodeURIComponent(label)}/publish`,
    payload
  );

  return {
    message: response.data.message,
  };
}

export async function deletePromptRelease(
  promptType: string,
  label: string
): Promise<PromptActionResponse> {
  const response = await api.delete<PromptActionResponse>(
    `/prompts/${encodePromptType(promptType)}/releases/${encodeURIComponent(label)}`
  );

  return {
    message: response.data.message,
  };
}

export async function archivePromptType(promptType: string): Promise<PromptActionResponse> {
  const response = await api.delete<PromptActionResponse>(
    `/prompts/${encodePromptType(promptType)}`
  );

  return {
    message: response.data.message,
  };
}
