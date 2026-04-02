import axios from 'axios';
import api from '@/lib/api';
import {
  CustomerAnalysisDisplayResponse,
  CustomerAnalysisRunsListResponse,
  CustomerAnalysisTriggerRequest,
  CustomerAnalysisTriggerResponse,
} from '@/types';

interface FetchCustomerAnalysisRunsParams {
  customer_id?: number;
  include_stale?: boolean;
  limit?: number;
  offset?: number;
}

function normalizeDisplayResponse(
  data: CustomerAnalysisDisplayResponse
): CustomerAnalysisDisplayResponse {
  return {
    ...data,
    run: {
      ...data.run,
      include_file_ids: data.run.include_file_ids ?? [],
      exclude_file_ids: data.run.exclude_file_ids ?? [],
      selected_file_ids: data.run.selected_file_ids ?? [],
      summary_json: data.run.summary_json ?? null,
      error_message: data.run.error_message ?? null,
      completed_at: data.run.completed_at ?? null,
    },
    resume_profile: data.resume_profile
      ? {
          ...data.resume_profile,
          primary_resume_file_id: data.resume_profile.primary_resume_file_id ?? null,
          selected_resume_files: data.resume_profile.selected_resume_files ?? [],
          profile_data: data.resume_profile.profile_data ?? null,
          formatted_resume_text: data.resume_profile.formatted_resume_text ?? null,
          error_message: data.resume_profile.error_message ?? null,
          system_prompt_text: data.resume_profile.system_prompt_text ?? null,
          user_prompt_text: data.resume_profile.user_prompt_text ?? null,
          sent_contents: data.resume_profile.sent_contents ?? [],
          history_snapshot: data.resume_profile.history_snapshot ?? [],
          raw_model_response: data.resume_profile.raw_model_response ?? null,
          response_parts: data.resume_profile.response_parts ?? [],
          thought_text: data.resume_profile.thought_text ?? null,
          answer_text: data.resume_profile.answer_text ?? null,
          usage_metadata: data.resume_profile.usage_metadata ?? null,
          provider: data.resume_profile.provider ?? null,
          model_name: data.resume_profile.model_name ?? null,
          model_version: data.resume_profile.model_version ?? null,
          response_id: data.resume_profile.response_id ?? null,
        }
      : null,
    items: (data.items ?? []).map((item) => ({
      ...item,
      result_status: item.result_status ?? null,
      communication_text: item.communication_text ?? null,
      source_file_ids: item.source_file_ids ?? [],
      structured_data: item.structured_data ?? null,
      issue_count: item.issue_count ?? 0,
      error_message: item.error_message ?? null,
      system_prompt_text: item.system_prompt_text ?? null,
      user_prompt_text: item.user_prompt_text ?? null,
      base_history_snapshot: item.base_history_snapshot ?? [],
      sent_contents: item.sent_contents ?? [],
      history_snapshot: item.history_snapshot ?? [],
      raw_model_response: item.raw_model_response ?? null,
      response_parts: item.response_parts ?? [],
      thought_text: item.thought_text ?? null,
      answer_text: item.answer_text ?? null,
      usage_metadata: item.usage_metadata ?? null,
      provider: item.provider ?? null,
      model_name: item.model_name ?? null,
      model_version: item.model_version ?? null,
      response_id: item.response_id ?? null,
    })),
  };
}

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export function isCustomerAnalysisTerminalStatus(status?: string | null): boolean {
  return status === 'completed' || status === 'failed';
}

export async function triggerCustomerAnalysis(
  payload: CustomerAnalysisTriggerRequest
): Promise<CustomerAnalysisTriggerResponse> {
  const response = await api.post<CustomerAnalysisTriggerResponse>(
    '/customer-analyses/trigger',
    payload
  );
  return response.data;
}

export async function fetchCustomerAnalysisRuns(
  params: FetchCustomerAnalysisRunsParams
): Promise<CustomerAnalysisRunsListResponse> {
  const response = await api.get<CustomerAnalysisRunsListResponse>('/customer-analyses/runs', {
    params: {
      customer_id: params.customer_id,
      include_stale: params.include_stale ?? false,
      limit: Math.min(Math.max(params.limit ?? 20, 1), 100),
      offset: Math.max(params.offset ?? 0, 0),
    },
  });

  return {
    total: response.data.total ?? 0,
    items: response.data.items ?? [],
  };
}

export async function fetchCustomerAnalysisRunDisplay(
  runId: number | string
): Promise<CustomerAnalysisDisplayResponse | null> {
  try {
    const response = await api.get<CustomerAnalysisDisplayResponse>(
      `/customer-analyses/runs/${runId}/display`
    );
    return normalizeDisplayResponse(response.data);
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchCustomerAnalysisDisplaySummary(
  customerId: number | string
): Promise<CustomerAnalysisDisplayResponse | null> {
  try {
    const response = await api.get<CustomerAnalysisDisplayResponse>(
      `/customer-analyses/customers/${customerId}/display-summary`
    );
    return normalizeDisplayResponse(response.data);
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}
