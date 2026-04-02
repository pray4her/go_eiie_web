'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { PageDescription, PageHeader, PageTitle } from '@/components/ui/page-header';
import { AnnotationHistoryPagination } from '@/components/features/annotation/annotation-history-pagination';
import { ListLoadingPlaceholder, PageLoadingCard } from '@/components/ui/page-loading';
import { CustomerAnalysisHistoryTable } from '@/components/features/customer-analyses/customer-analysis-history-table';
import { CustomerAnalysisSummary } from '@/components/features/customer-analyses/customer-analysis-summary';
import { CustomerAnalysisTriggerForm } from '@/components/features/customer-analyses/customer-analysis-trigger-form';
import {
  fetchCustomerAnalysisDisplaySummary,
  fetchCustomerAnalysisRunDisplay,
  fetchCustomerAnalysisRuns,
  isCustomerAnalysisTerminalStatus,
  triggerCustomerAnalysis,
} from '@/lib/customer-analyses';
import {
  CustomerAnalysisDisplayResponse,
  CustomerAnalysisRunsListResponse,
} from '@/types';

function parseCustomerIdInput(value: string): number | null {
  if (!value.trim()) return null;
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value.trim());
}

function parseFileIdsInput(value: string): number[] | null {
  if (!value.trim()) return [];

  const pieces = value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (pieces.length === 0) return [];
  if (pieces.some((item) => !/^\d+$/.test(item))) return null;

  return Array.from(new Set(pieces.map((item) => Number(item))));
}

export default function CustomerAnalysesPage() {
  const router = useRouter();

  const [customerIdQuery, setCustomerIdQuery] = useQueryState(
    'customer_id',
    parseAsString.withDefault('').withOptions({ shallow: false })
  );
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );
  const [pageSize, setPageSize] = useQueryState(
    'page_size',
    parseAsInteger.withDefault(20).withOptions({ shallow: false })
  );

  const [customerIdInput, setCustomerIdInput] = useState(customerIdQuery);
  const [includeFileIdsInput, setIncludeFileIdsInput] = useState('');
  const [excludeFileIdsInput, setExcludeFileIdsInput] = useState('');
  const [summary, setSummary] = useState<CustomerAnalysisDisplayResponse | null>(null);
  const [history, setHistory] = useState<CustomerAnalysisRunsListResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [pollingRunId, setPollingRunId] = useState<number | null>(null);

  useEffect(() => {
    setCustomerIdInput(customerIdQuery);
  }, [customerIdQuery]);

  const parsedCustomerId = useMemo(
    () => parseCustomerIdInput(customerIdQuery),
    [customerIdQuery]
  );
  const effectivePage = useMemo(() => Math.max(page, 1), [page]);
  const effectivePageSize = useMemo(() => Math.min(Math.max(pageSize, 1), 100), [pageSize]);
  const offset = useMemo(
    () => (effectivePage - 1) * effectivePageSize,
    [effectivePage, effectivePageSize]
  );
  const totalPages = Math.max(1, Math.ceil((history?.total ?? 0) / effectivePageSize));

  const loadSummary = useCallback(
    async (customerId: number) => {
      setIsLoadingSummary(true);
      try {
        const data = await fetchCustomerAnalysisDisplaySummary(customerId);
        setSummary(data);
        if (data && !isCustomerAnalysisTerminalStatus(data.run.status)) {
          setPollingRunId(data.run.id);
        } else {
          setPollingRunId(null);
        }
      } catch {
        toast.error('获取客户分析总览失败');
      } finally {
        setIsLoadingSummary(false);
      }
    },
    []
  );

  const loadHistory = useCallback(
    async (customerId: number) => {
      setIsLoadingHistory(true);
      try {
        const data = await fetchCustomerAnalysisRuns({
          customer_id: customerId,
          include_stale: true,
          limit: effectivePageSize,
          offset,
        });
        setHistory(data);
      } catch {
        toast.error('获取客户分析历史失败');
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [effectivePageSize, offset]
  );

  useEffect(() => {
    if (!parsedCustomerId) {
      setSummary(null);
      setHistory(null);
      setPollingRunId(null);
      return;
    }

    loadSummary(parsedCustomerId);
    loadHistory(parsedCustomerId);
  }, [loadHistory, loadSummary, parsedCustomerId]);

  useEffect(() => {
    if (!pollingRunId || !parsedCustomerId) return;

    const id = window.setInterval(async () => {
      try {
        const data = await fetchCustomerAnalysisRunDisplay(pollingRunId);
        if (!data) {
          window.clearInterval(id);
          setPollingRunId(null);
          return;
        }

        setSummary(data);
        if (isCustomerAnalysisTerminalStatus(data.run.status)) {
          window.clearInterval(id);
          setPollingRunId(null);
          loadHistory(parsedCustomerId);
        }
      } catch {
        window.clearInterval(id);
        setPollingRunId(null);
        toast.error('轮询客户分析状态失败，请稍后手动刷新');
      }
    }, 3000);

    return () => window.clearInterval(id);
  }, [loadHistory, parsedCustomerId, pollingRunId]);

  const commitCustomerId = async (): Promise<number | null> => {
    const parsed = parseCustomerIdInput(customerIdInput);
    if (!parsed) {
      toast.error('请输入正确的客户号');
      return null;
    }

    await setCustomerIdQuery(String(parsed));
    return parsed;
  };

  const handleLoadSummary = async () => {
    const customerId = await commitCustomerId();
    if (!customerId) return;

    setPage(1);
    await loadSummary(customerId);
    await loadHistory(customerId);
  };

  const handleTrigger = async () => {
    const customerId = await commitCustomerId();
    if (!customerId) return;

    const includeFileIds = parseFileIdsInput(includeFileIdsInput);
    const excludeFileIds = parseFileIdsInput(excludeFileIdsInput);

    if (!includeFileIds || !excludeFileIds) {
      toast.error('文件 ID 请输入逗号分隔的数字');
      return;
    }

    setIsTriggering(true);
    try {
      const result = await triggerCustomerAnalysis({
        customer_id: customerId,
        include_file_ids: includeFileIds.length > 0 ? includeFileIds : undefined,
        exclude_file_ids: excludeFileIds.length > 0 ? excludeFileIds : undefined,
      });

      toast.success('已提交客户分析任务', {
        description: `Run #${result.run_id} 已创建，正在轮询最新状态。`,
      });

      const runDisplay = await fetchCustomerAnalysisRunDisplay(result.run_id);
      setSummary(runDisplay);
      setPollingRunId(result.run_id);
      setPage(1);
      await loadHistory(customerId);
    } catch {
      toast.error('触发客户分析失败');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <PageTitle>客户沟通需求分析</PageTitle>
            <PageDescription>
              按客户号触发异步分析，查看对话式分析结果（思考/回答）与历史 run。
            </PageDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">返回信息提取</Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>按客户号触发或查询</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerAnalysisTriggerForm
              customerId={customerIdInput}
              includeFileIds={includeFileIdsInput}
              excludeFileIds={excludeFileIdsInput}
              isLoadingSummary={isLoadingSummary}
              isTriggering={isTriggering}
              onCustomerIdChange={setCustomerIdInput}
              onIncludeFileIdsChange={setIncludeFileIdsInput}
              onExcludeFileIdsChange={setExcludeFileIdsInput}
              onLoadSummary={handleLoadSummary}
              onTrigger={handleTrigger}
            />
          </CardContent>
        </Card>

        {!customerIdQuery ? (
          <EmptyState
            title="输入客户号以开始"
            description="可以先加载该客户最新稳定结果，也可以直接触发新的分析 run。"
          />
        ) : isLoadingSummary ? (
          <PageLoadingCard message="正在加载客户分析结果…" />
        ) : !summary ? (
          <EmptyState
            title="尚未生成分析结果"
            description="该客户号当前没有稳定展示结果，可以直接触发新的分析任务。"
            action={
              <Button onClick={handleTrigger} disabled={isTriggering}>
                {isTriggering ? '触发中...' : '开始分析'}
              </Button>
            }
          />
        ) : (
          <>
            <CustomerAnalysisSummary
              data={summary}
              isPolling={pollingRunId === summary.run.id}
            />

            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>历史 Run</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/customer-analyses/runs/${summary.run.id}`)}
                >
                  查看当前 Run 明细页
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingHistory ? (
                  <ListLoadingPlaceholder message="正在加载历史记录…" withTableSkeleton />
                ) : (
                  <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                    <CustomerAnalysisHistoryTable
                      items={history?.items ?? []}
                      onView={(runId) => router.push(`/customer-analyses/runs/${runId}`)}
                    />
                  </div>
                )}

                <AnnotationHistoryPagination
                  page={effectivePage}
                  totalPages={totalPages}
                  pageSize={effectivePageSize}
                  onPageChange={(nextPage) => setPage(Math.max(Math.min(nextPage, totalPages), 1))}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(Math.min(Math.max(nextPageSize, 1), 100));
                    setPage(1);
                  }}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Container>
  );
}
