'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { ResumeProcessExportButton } from '@/components/features/resume-process/resume-process-export-button';
import { ResumeProcessImportantColumnsNotice } from '@/components/features/resume-process/resume-process-important-columns-notice';
import { ResumeProcessSecondaryParsedTable } from '@/components/features/resume-process/resume-process-secondary-parsed-table';
import { useResumeProcessSubscription } from '@/hooks/use-resume-process-subscription';
import { extractResumeProcessError, fetchResumeProcessJob, triggerResumeProcessSecondary } from '@/lib/resume-process';
import { normalizeResumeProcessText, parseSecondaryNOFieldsFromManyTexts } from '@/lib/resume-process-secondary-parser';
import { ResumeProcessJobDetailsResponse, ResumeProcessInitialResult } from '@/types';

function getInitialMarkdownText(initial: ResumeProcessInitialResult | null): string {
  if (!initial) return '';
  const parsed = initial.parsed_result;
  if (typeof parsed === 'string') return parsed;
  if (parsed && typeof parsed === 'object') {
    const maybeText = (parsed as { text?: unknown }).text;
    if (typeof maybeText === 'string') return maybeText;
  }
  return initial.raw_response ?? '';
}

function shouldRenderAsPre(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  const hasMarkdownSyntax = /(^|\n)\s{0,3}#{1,6}\s|\*\*|`{3,}|(^|\n)\s*[-*]\s|(^|\n)\s*\d+\.\s/.test(normalized);
  const hasManyLines = normalized.split('\n').length >= 6;
  if (hasMarkdownSyntax) return false;
  return hasManyLines;
}

function MarkdownBlock({ text }: { text: string }) {
  if (!text) return <p className="text-muted-foreground">暂无内容</p>;
  const normalized = normalizeResumeProcessText(text);

  if (shouldRenderAsPre(normalized)) {
    return <pre className="whitespace-pre-wrap text-sm">{normalized}</pre>;
  }

  return (
    <div className="text-sm">
      <ReactMarkdown
        components={{
          h2: ({ ...props }) => <h2 className="text-base font-semibold my-2" {...props} />,
          h3: ({ ...props }) => <h3 className="text-sm font-semibold my-2" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
          li: ({ ...props }) => <li className="mb-1" {...props} />,
          p: ({ ...props }) => <p className="mb-2" {...props} />,
          strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
          hr: ({ ...props }) => <hr className="my-2 border-border" {...props} />,
          a: ({ ...props }) => <a className="underline" target="_blank" rel="noreferrer" {...props} />,
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

export default function ResumeProcessJobDetailsPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId as string;

  const [data, setData] = useState<ResumeProcessJobDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggeringSecondary, setIsTriggeringSecondary] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<number | null>(null);

  const refreshThrottleRef = useRef<number | null>(null);

  const load = useCallback(
    async (runId?: number | null) => {
      const resp = await fetchResumeProcessJob(jobId, runId);
      setData(resp);
      if (resp.secondary_run?.id != null) {
        setCurrentRunId(resp.secondary_run.id);
      }
      return resp;
    },
    [jobId]
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setIsLoading(true);
      try {
        const resp = await load();
        if (cancelled) return;
        setData(resp);
      } catch {
        if (!cancelled) toast.error('获取任务详情失败');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    if (jobId) init();
    return () => {
      cancelled = true;
    };
  }, [jobId, load]);

  const subscription = useResumeProcessSubscription({
    jobId,
    enabled: Boolean(jobId),
    onStatusUpdate: () => {
      if (refreshThrottleRef.current) window.clearTimeout(refreshThrottleRef.current);
      refreshThrottleRef.current = window.setTimeout(() => {
        load().catch(() => {});
      }, 600);
    },
  });

  const initialMarkdown = useMemo(() => getInitialMarkdownText(data?.initial_result ?? null), [data?.initial_result]);

  const secondaryStatus = data?.job.secondary_status ?? 'idle';
  const isSecondaryInProgress = ['pending', 'processing', 'retrying'].includes(secondaryStatus);
  const canTriggerSecondary = useMemo(() => {
    if (!data?.initial_result) return false;
    if (data.initial_result.status !== 'completed') return false;
    if (data.job.status !== 'completed') return false;
    return !isSecondaryInProgress;
  }, [data?.initial_result, data?.job.status, isSecondaryInProgress]);

  const hasAnySecondaryCompleted = useMemo(
    () => (data?.secondary_results ?? []).some((r) => r.status === 'completed'),
    [data?.secondary_results]
  );

  const isSecondaryAllCompleted = useMemo(() => {
    const run = data?.secondary_run;
    if (run) return run.status === 'completed';
    const results = data?.secondary_results ?? [];
    if (results.length === 0) return false;
    return results.every((r) => r.status === 'completed');
  }, [data?.secondary_run, data?.secondary_results]);

  const secondaryButtonLabel = useMemo(() => {
    if (isSecondaryInProgress) return '生成中';
    if (['completed_partial', 'failed'].includes(secondaryStatus)) return '重试失败项';
    return '二次生成';
  }, [secondaryStatus, isSecondaryInProgress]);

  const secondaryParsed = useMemo(() => {
    const texts = (data?.secondary_results ?? []).map((r) => r.generated_text || '');
    return parseSecondaryNOFieldsFromManyTexts(texts);
  }, [data?.secondary_results]);

  async function handleTriggerSecondary() {
    if (!jobId) return;
    setIsTriggeringSecondary(true);
    try {
      const { run_id } = await triggerResumeProcessSecondary(jobId);
      toast.success('已触发二次生成', { description: '开始进行二次生成，请稍候...' });
      setCurrentRunId(run_id);
      await load(run_id);
    } catch (err) {
      const { message, retryAfter } = extractResumeProcessError(err);
      const desc = retryAfter != null ? `请在 ${retryAfter} 秒后重试` : undefined;
      toast.error('触发失败', { description: desc ?? message });
    } finally {
      setIsTriggeringSecondary(false);
    }
  }

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex items-center justify-between">
          <PageTitle>简历处理详情</PageTitle>
          <div className="flex items-center gap-2">
            {hasAnySecondaryCompleted ? (
              <ResumeProcessExportButton jobId={jobId} runId={currentRunId ?? undefined} compact />
            ) : null}
            <Button variant="outline" size="sm" onClick={() => router.push('/resume-process')}>
              返回列表
            </Button>
          </div>
        </div>
      </PageHeader>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            正在加载...
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardHeader>
            <CardTitle>提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">未找到该任务。</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>任务信息</CardTitle>
              <CardDescription>
                连接: {subscription.connectionStatus === 'connecting' && '正在连接...'}
                {subscription.connectionStatus === 'connected' && '已连接'}
                {subscription.connectionStatus === 'error' && '连接错误'}
                {subscription.connectionStatus === 'closed' && '已关闭'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">任务ID</p>
                  <p className="font-mono text-sm">{String(data.job.id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">初次分析</p>
                  <StatusBadge status={data.job.status} />
                </div>
                {data.job.secondary_status ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">二次生成</p>
                    <StatusBadge status={data.job.secondary_status} />
                  </div>
                ) : null}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">创建时间</p>
                  <p className="text-sm">{new Date(data.job.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">更新时间</p>
                  <p className="text-sm">{new Date(data.job.updated_at).toLocaleString()}</p>
                </div>
              </div>
              {data.job.error_message ? (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{data.job.error_message}</p>
                </div>
              ) : null}
              {data.job.secondary_error_message ? (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">{data.job.secondary_error_message}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>初次分析结果</CardTitle>
                  <CardDescription>
                    {data.initial_result ? (
                      <>
                        状态: <StatusBadge status={data.initial_result.status === 'error' ? 'failed' : data.initial_result.status === 'completed' ? 'completed' : 'processing'} />
                      </>
                    ) : (
                      '暂无初次分析结果'
                    )}
                  </CardDescription>
                </div>
                {canTriggerSecondary || isSecondaryInProgress ? (
                  <Button
                    onClick={handleTriggerSecondary}
                    disabled={isTriggeringSecondary || isSecondaryInProgress}
                    size="sm"
                  >
                    {isTriggeringSecondary ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        正在触发...
                      </>
                    ) : (
                      secondaryButtonLabel
                    )}
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {data.initial_result?.status === 'error' ? (
                <p className="text-destructive text-sm">{data.initial_result.error_message || '初次分析失败'}</p>
              ) : data.initial_result ? (
                <div className="bg-muted p-4 rounded-lg">
                  <MarkdownBlock text={initialMarkdown} />
                </div>
              ) : (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>正在等待初次分析结果...</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    二次生成结果
                    {isSecondaryAllCompleted && (
                      <span className="text-xs font-normal px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        已全部完成
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isSecondaryAllCompleted ? (
                      <span className="text-green-600 font-medium italic">二次生成内容已全部生成完成</span>
                    ) : isSecondaryInProgress ? (
                      <span className="flex items-center text-amber-600">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {secondaryStatus === 'retrying' ? '自动重试中...' : '正在生成中...'}
                      </span>
                    ) : data.secondary_run ? (
                      <span>
                        当前批次 Run #{data.secondary_run.id} · 成功 {data.secondary_run.completed_prompts} /{' '}
                        {data.secondary_run.total_prompts}
                        {data.secondary_run.failed_prompt_ids?.length
                          ? ` · 失败: [${data.secondary_run.failed_prompt_ids.join(', ')}]`
                          : ''}
                      </span>
                    ) : (
                      '二次生成完成后可导出 Excel 模板'
                    )}
                  </CardDescription>
                </div>
                {hasAnySecondaryCompleted ? (
                  <ResumeProcessExportButton jobId={jobId} runId={currentRunId ?? undefined} />
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSecondaryAllCompleted && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  二次生成内容已全部生成完成。
                </div>
              )}
              <ResumeProcessImportantColumnsNotice />
              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <ResumeProcessSecondaryParsedTable items={secondaryParsed} />
              </div>
              {!(data.secondary_results ?? []).length && (
                <p className="text-muted-foreground">暂无二次生成结果。完成初次分析后，可点击“继续二次生成”。</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Container>
  );
}
