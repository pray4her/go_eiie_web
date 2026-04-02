'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CustomerAnalysisDisplayItem,
  CustomerAnalysisDisplayResponse,
  CustomerAnalysisResumeProfile,
} from '@/types';
import {
  CustomerAnalysisExecutionBadge,
  CustomerAnalysisResultBadge,
  CustomerAnalysisStaleBadge,
} from '@/components/features/customer-analyses/customer-analysis-badges';
import {
  CustomerAnalysisAnswerCard,
  CustomerAnalysisThoughtCollapsible,
} from '@/components/features/customer-analyses/customer-analysis-markdown';

interface CustomerAnalysisSummaryProps {
  data: CustomerAnalysisDisplayResponse;
  isPolling?: boolean;
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

const preBodyClass =
  'max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm';

function hasMeaningfulText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function ConversationOutput({
  thoughtText,
  answerText,
  answerCardVariant = 'default',
}: {
  thoughtText?: string | null;
  answerText?: string | null;
  answerCardVariant?: 'default' | 'embedded';
}) {
  const thought = thoughtText?.trim() ?? '';
  const answer = answerText?.trim() ?? '';

  return (
    <div className="space-y-5">
      {thought ? <CustomerAnalysisThoughtCollapsible text={thought} /> : null}
      {answer ? (
        <CustomerAnalysisAnswerCard text={answer} title="回答" variant={answerCardVariant} />
      ) : null}
    </div>
  );
}

function ResumeDebugDetails({ profile }: { profile: CustomerAnalysisResumeProfile }) {
  const sentLen = profile.sent_contents?.length ?? 0;
  const histLen = profile.history_snapshot?.length ?? 0;
  const partsLen = profile.response_parts?.length ?? 0;
  const usageKeys = profile.usage_metadata ? Object.keys(profile.usage_metadata).length : 0;
  const hasRaw = profile.raw_model_response != null;

  if (
    !hasMeaningfulText(profile.system_prompt_text) &&
    !hasMeaningfulText(profile.user_prompt_text) &&
    sentLen === 0 &&
    histLen === 0 &&
    !hasRaw &&
    partsLen === 0 &&
    usageKeys === 0
  ) {
    return null;
  }

  return (
    <details className="rounded-lg border p-3">
      <summary className="cursor-pointer text-sm font-medium">调试信息</summary>
      <div className="mt-3 space-y-4">
        {hasMeaningfulText(profile.system_prompt_text) ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">System prompt</p>
            <pre className={preBodyClass}>{profile.system_prompt_text}</pre>
          </div>
        ) : null}
        {hasMeaningfulText(profile.user_prompt_text) ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">User prompt</p>
            <pre className={preBodyClass}>{profile.user_prompt_text}</pre>
          </div>
        ) : null}
        {sentLen > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">sent_contents</p>
            <JsonBlock value={profile.sent_contents} />
          </div>
        ) : null}
        {histLen > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">history_snapshot</p>
            <JsonBlock value={profile.history_snapshot} />
          </div>
        ) : null}
        {hasRaw ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">raw_model_response</p>
            <JsonBlock value={profile.raw_model_response} />
          </div>
        ) : null}
        {partsLen > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">response_parts</p>
            <JsonBlock value={profile.response_parts} />
          </div>
        ) : null}
        {usageKeys > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">usage_metadata</p>
            <JsonBlock value={profile.usage_metadata} />
          </div>
        ) : null}
      </div>
    </details>
  );
}

function CategoryDebugDetails({ item }: { item: CustomerAnalysisDisplayItem }) {
  const sentLen = item.sent_contents?.length ?? 0;
  const histLen = item.history_snapshot?.length ?? 0;
  const baseLen = item.base_history_snapshot?.length ?? 0;
  const partsLen = item.response_parts?.length ?? 0;
  const usageKeys = item.usage_metadata ? Object.keys(item.usage_metadata).length : 0;
  const hasRaw = item.raw_model_response != null;

  if (
    !hasMeaningfulText(item.system_prompt_text) &&
    !hasMeaningfulText(item.user_prompt_text) &&
    sentLen === 0 &&
    histLen === 0 &&
    baseLen === 0 &&
    !hasRaw &&
    partsLen === 0 &&
    usageKeys === 0
  ) {
    return null;
  }

  return (
    <details className="rounded-lg border p-3">
      <summary className="cursor-pointer text-sm font-medium">调试信息</summary>
      <div className="mt-3 space-y-4">
        {hasMeaningfulText(item.system_prompt_text) ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">System prompt</p>
            <pre className={preBodyClass}>{item.system_prompt_text}</pre>
          </div>
        ) : null}
        {hasMeaningfulText(item.user_prompt_text) ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">User prompt</p>
            <pre className={preBodyClass}>{item.user_prompt_text}</pre>
          </div>
        ) : null}
        {baseLen > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">base_history_snapshot</p>
            <JsonBlock value={item.base_history_snapshot} />
          </div>
        ) : null}
        {sentLen > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">sent_contents</p>
            <JsonBlock value={item.sent_contents} />
          </div>
        ) : null}
        {histLen > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">history_snapshot</p>
            <JsonBlock value={item.history_snapshot} />
          </div>
        ) : null}
        {hasRaw ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">raw_model_response</p>
            <JsonBlock value={item.raw_model_response} />
          </div>
        ) : null}
        {partsLen > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">response_parts</p>
            <JsonBlock value={item.response_parts} />
          </div>
        ) : null}
        {usageKeys > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">usage_metadata</p>
            <JsonBlock value={item.usage_metadata} />
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function CustomerAnalysisSummary({
  data,
  isPolling = false,
}: CustomerAnalysisSummaryProps) {
  const { run, overview, resume_profile: resumeProfile, items } = data;

  return (
    <div className="space-y-6">
      {run.is_stale ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex flex-wrap items-center gap-2">
            <CustomerAnalysisStaleBadge isStale />
            <span>当前展示的是过期结果，建议按客户号重新分析。</span>
          </div>
          {run.stale_reason ? <p className="mt-2">{run.stale_reason}</p> : null}
        </div>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">运行概览</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <CustomerAnalysisExecutionBadge status={run.status} />
            <CustomerAnalysisStaleBadge isStale={run.is_stale} />
            {isPolling && !['completed', 'failed'].includes(run.status) ? (
              <Badge variant="secondary">轮询更新中</Badge>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div>
              <p className="text-sm text-muted-foreground">客户号</p>
              <p className="font-medium">{overview.customer_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Run ID</p>
              <p className="font-mono">{run.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已选文件</p>
              <p className="font-medium">{overview.selected_file_count}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">类别数</p>
              <p className="font-medium">{overview.category_count}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已完成类别</p>
              <p className="font-medium">{overview.completed_count}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">失败类别</p>
              <p className="font-medium">{overview.failed_count}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">创建时间</p>
              <p>{new Date(run.created_at).toLocaleString('zh-CN')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">完成时间</p>
              <p>{run.completed_at ? new Date(run.completed_at).toLocaleString('zh-CN') : '-'}</p>
            </div>
          </div>

          {run.error_message ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {run.error_message}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">简历画像</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {!resumeProfile ? (
            <p className="text-sm text-muted-foreground">当前 run 没有简历画像结果。</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                <CustomerAnalysisExecutionBadge status={resumeProfile.status} />
                {resumeProfile.primary_resume_file_id ? (
                  <Badge variant="outline">主简历文件 ID：{resumeProfile.primary_resume_file_id}</Badge>
                ) : null}
                {resumeProfile.selected_resume_files.length > 0 ? (
                  <Badge variant="outline">
                    合并简历：{resumeProfile.selected_resume_files.join(', ')}
                  </Badge>
                ) : null}
                {resumeProfile.model_name ? (
                  <Badge variant="secondary">
                    {resumeProfile.provider ? `${resumeProfile.provider} · ` : ''}
                    {resumeProfile.model_name}
                    {resumeProfile.model_version ? ` (${resumeProfile.model_version})` : ''}
                  </Badge>
                ) : null}
              </div>

              {resumeProfile.error_message ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {resumeProfile.error_message}
                </div>
              ) : null}

              {hasMeaningfulText(resumeProfile.thought_text) ||
              hasMeaningfulText(resumeProfile.answer_text) ? (
                <ConversationOutput
                  thoughtText={resumeProfile.thought_text}
                  answerText={resumeProfile.answer_text}
                />
              ) : resumeProfile.formatted_resume_text ? (
                <CustomerAnalysisAnswerCard
                  text={resumeProfile.formatted_resume_text}
                  title="格式化简历文本（历史）"
                />
              ) : null}

              {resumeProfile.profile_data &&
              !hasMeaningfulText(resumeProfile.thought_text) &&
              !hasMeaningfulText(resumeProfile.answer_text) ? (
                <details className="rounded-lg border p-4">
                  <summary className="cursor-pointer text-sm font-medium">查看结构化画像（历史）</summary>
                  <div className="mt-4">
                    <JsonBlock value={resumeProfile.profile_data} />
                  </div>
                </details>
              ) : null}

              {!hasMeaningfulText(resumeProfile.thought_text) &&
              !hasMeaningfulText(resumeProfile.answer_text) &&
              !resumeProfile.formatted_resume_text &&
              !resumeProfile.profile_data &&
              !resumeProfile.error_message ? (
                <p className="text-sm text-muted-foreground">暂无简历模型输出。</p>
              ) : null}

              <ResumeDebugDetails profile={resumeProfile} />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">类别分析结果</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">当前 run 还没有类别分析结果。</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {items.map((item) => {
                const hasConversation =
                  hasMeaningfulText(item.thought_text) || hasMeaningfulText(item.answer_text);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/40 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug text-foreground">{item.display_name}</h3>
                        <p className="mt-1.5 text-xs text-muted-foreground break-all">
                          {item.rule_code} · {item.category_key}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <CustomerAnalysisExecutionBadge status={item.status} />
                        {item.result_status ? (
                          <CustomerAnalysisResultBadge resultStatus={item.result_status} />
                        ) : null}
                        {item.issue_count > 0 ? (
                          <Badge variant="outline">问题数 {item.issue_count}</Badge>
                        ) : null}
                        {item.model_name ? (
                          <Badge variant="secondary" className="max-w-[12rem] truncate">
                            {item.provider ? `${item.provider} · ` : ''}
                            {item.model_name}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col space-y-4">
                      {hasConversation ? (
                        <ConversationOutput
                          thoughtText={item.thought_text}
                          answerText={item.answer_text}
                          answerCardVariant="embedded"
                        />
                      ) : item.communication_text ? (
                        <CustomerAnalysisAnswerCard
                          text={item.communication_text}
                          title="沟通文案（历史）"
                          variant="embedded"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">暂无模型输出。</p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {item.source_file_ids.length > 0 ? (
                          item.source_file_ids.map((fileId) => (
                            <Badge key={fileId} variant="outline">
                              文件 ID {fileId}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">无关联文件 ID</span>
                        )}
                      </div>

                      {item.error_message ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {item.error_message}
                        </div>
                      ) : null}

                      {item.structured_data ? (
                        <details className="rounded-lg border p-3">
                          <summary className="cursor-pointer text-sm font-medium">
                            展开结构化明细（历史）
                          </summary>
                          <div className="mt-3">
                            <JsonBlock value={item.structured_data} />
                          </div>
                        </details>
                      ) : null}

                      <CategoryDebugDetails item={item} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
