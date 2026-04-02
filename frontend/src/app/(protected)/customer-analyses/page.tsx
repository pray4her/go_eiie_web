'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { PageDescription, PageHeader, PageTitle } from '@/components/ui/page-header';
import { AnnotationHistoryPagination } from '@/components/features/annotation/annotation-history-pagination';
import { ListLoadingPlaceholder, PageLoadingCard } from '@/components/ui/page-loading';
import {
  CustomerAnalysisFileTasksTable,
  CustomerListRow,
} from '@/components/features/customer-analyses/customer-analysis-file-tasks-table';
import { CustomerAnalysisSummary } from '@/components/features/customer-analyses/customer-analysis-summary';
import { CustomerAnalysisTriggerForm } from '@/components/features/customer-analyses/customer-analysis-trigger-form';
import {
  fetchCustomerAnalysisDisplaySummary,
  fetchCustomerAnalysisRunDisplay,
  isCustomerAnalysisTerminalStatus,
  triggerCustomerAnalysis,
} from '@/lib/customer-analyses';
import { fetchFilesQuery } from '@/lib/files-query';
import {
  CustomerAnalysisDisplayResponse,
  FilesQueryResponse,
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
  const [customerIdQuery, setCustomerIdQuery] = useQueryState(
    'customer_id',
    parseAsString.withDefault('').withOptions({ shallow: false })
  );
  const [filesPage, setFilesPage] = useQueryState(
    'files_page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );
  const [filesPageSize, setFilesPageSize] = useQueryState(
    'files_page_size',
    parseAsInteger.withDefault(20).withOptions({ shallow: false })
  );

  const [customerIdInput, setCustomerIdInput] = useState(customerIdQuery);
  const [includeFileIdsInput, setIncludeFileIdsInput] = useState('');
  const [excludeFileIdsInput, setExcludeFileIdsInput] = useState('');
  const [summary, setSummary] = useState<CustomerAnalysisDisplayResponse | null>(null);
  const [fileTasks, setFileTasks] = useState<FilesQueryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingFileTasks, setIsLoadingFileTasks] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [pollingRunId, setPollingRunId] = useState<number | null>(null);

  useEffect(() => {
    setCustomerIdInput(customerIdQuery);
  }, [customerIdQuery]);

  const parsedCustomerId = useMemo(
    () => parseCustomerIdInput(customerIdQuery),
    [customerIdQuery]
  );
  const effectiveFilesPage = useMemo(() => Math.max(filesPage, 1), [filesPage]);
  const effectiveFilesPageSize = useMemo(
    () => Math.min(Math.max(filesPageSize, 1), 100),
    [filesPageSize]
  );
  const totalFileTaskPages = Math.max(fileTasks?.total_page ?? 1, 1);

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

  const loadFileTasks = useCallback(
    async (customerId?: number, options?: { page?: number; pageSize?: number }) => {
      const currentPage = Math.max(options?.page ?? effectiveFilesPage, 1);
      const currentPageSize = Math.min(
        Math.max(options?.pageSize ?? effectiveFilesPageSize, 1),
        100
      );

      setIsLoadingFileTasks(true);
      try {
        const data = await fetchFilesQuery({
          customer_id: customerId,
          page: currentPage,
          page_size: currentPageSize,
          scope: 'parent',
          task_type: 'package_extraction',
          processing_status: 'classified,extracting,completed,completed_partial',
          sort_by: 'created_at',
          sort_order: 'desc',
        });
        setFileTasks(data);

        if (data.total_page > 0 && currentPage > data.total_page) {
          setFilesPage(data.total_page);
        }
      } catch {
        toast.error('获取文件任务列表失败');
      } finally {
        setIsLoadingFileTasks(false);
      }
    },
    [effectiveFilesPage, effectiveFilesPageSize, setFilesPage]
  );

  useEffect(() => {
    if (!parsedCustomerId) {
      setSummary(null);
      setPollingRunId(null);
    }
    if (parsedCustomerId) {
      loadSummary(parsedCustomerId);
    }
  }, [loadSummary, parsedCustomerId]);

  useEffect(() => {
    loadFileTasks();
  }, [loadFileTasks, effectiveFilesPage, effectiveFilesPageSize]);

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
          loadFileTasks();
        }
      } catch {
        window.clearInterval(id);
        setPollingRunId(null);
        toast.error('轮询客户分析状态失败，请稍后手动刷新');
      }
    }, 3000);

    return () => window.clearInterval(id);
  }, [loadFileTasks, parsedCustomerId, pollingRunId]);

  const loadByCustomerId = useCallback(
    async (customerId: number, options?: { resetFilesPage?: boolean }) => {
      const shouldResetFilesPage = options?.resetFilesPage ?? false;
      const nextPage = shouldResetFilesPage ? 1 : effectiveFilesPage;

      if (shouldResetFilesPage) {
        await setFilesPage(1);
      }

      if (customerId !== parsedCustomerId) {
        await setCustomerIdQuery(String(customerId));
        setCustomerIdInput(String(customerId));
        return;
      }

      await loadSummary(customerId);
      await loadFileTasks(undefined, { page: nextPage });
    },
    [
      effectiveFilesPage,
      loadFileTasks,
      loadSummary,
      parsedCustomerId,
      setCustomerIdQuery,
      setFilesPage,
    ]
  );

  const commitCustomerId = (): number | null => {
    const parsed = parseCustomerIdInput(customerIdInput);
    if (!parsed) {
      toast.error('请输入正确的客户号');
      return null;
    }

    setCustomerIdInput(String(parsed));
    return parsed;
  };

  const handleLoadSummary = async () => {
    const customerId = commitCustomerId();
    if (!customerId) return;

    await loadByCustomerId(customerId, { resetFilesPage: true });
  };

  const handleTrigger = async () => {
    const customerId = commitCustomerId();
    if (!customerId) return;
    if (customerId !== parsedCustomerId) {
      await setCustomerIdQuery(String(customerId));
    }

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
      setFilesPage(1);
      await loadFileTasks(undefined, { page: 1 });
    } catch {
      toast.error('触发客户分析失败');
    } finally {
      setIsTriggering(false);
    }
  };

  const customerRows = useMemo<CustomerListRow[]>(() => {
    const items = fileTasks?.items ?? [];
    const grouped = new Map<number, CustomerListRow>();

    for (const item of items) {
      if (!item.customer_id) continue;
      const existing = grouped.get(item.customer_id);
      if (!existing) {
        grouped.set(item.customer_id, {
          customerId: item.customer_id,
          expertName: item.expert_name || '',
          latestStatus: item.processing_status,
          latestFileName: item.original_file_name,
          latestCreatedAt: item.created_at,
          filesCount: 1,
        });
        continue;
      }

      grouped.set(item.customer_id, {
        ...existing,
        filesCount: existing.filesCount + 1,
      });
    }

    return Array.from(grouped.values());
  }, [fileTasks]);

  const handleViewCustomer = async (item: CustomerListRow) => {
    await loadByCustomerId(item.customerId, { resetFilesPage: true });
  };

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <PageTitle>客户沟通需求分析</PageTitle>
            <PageDescription>
              页面自动展示已分类客户列表，点击客户号即可加载最新结果；无结果时可直接开始分析。
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

        <Card>
          <CardHeader>
            <CardTitle>已分类客户列表</CardTitle>
            <p className="text-sm text-muted-foreground">
              按时间倒序展示 package_extraction 已分类任务对应的客户与专家信息，点击“加载结果”后自动沿用原有“加载最新结果”逻辑。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingFileTasks ? (
              <ListLoadingPlaceholder message="正在加载客户列表…" withTableSkeleton />
            ) : (
              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <CustomerAnalysisFileTasksTable items={customerRows} onView={handleViewCustomer} />
              </div>
            )}

            <AnnotationHistoryPagination
              page={effectiveFilesPage}
              totalPages={totalFileTaskPages}
              pageSize={effectiveFilesPageSize}
              onPageChange={(nextPage) =>
                setFilesPage(Math.max(Math.min(nextPage, totalFileTaskPages), 1))
              }
              onPageSizeChange={(nextPageSize) => {
                setFilesPageSize(Math.min(Math.max(nextPageSize, 1), 100));
                setFilesPage(1);
              }}
            />
          </CardContent>
        </Card>

        {!customerIdQuery ? (
          <EmptyState
            title="请选择客户号"
            description="点击上方任一客户行即可加载该客户最新分析结果。"
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
          <CustomerAnalysisSummary
            data={summary}
            isPolling={pollingRunId === summary.run.id}
          />
        )}
      </div>
    </Container>
  );
}
