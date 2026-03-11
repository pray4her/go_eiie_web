'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { PageDescription, PageHeader, PageTitle } from '@/components/ui/page-header';
import { fetchResumeProcessJobs } from '@/lib/resume-process';
import { ResumeProcessJobsListResponse } from '@/types';
import { ResumeProcessUploadForm } from '@/components/features/resume-process/resume-process-upload-form';
import { ResumeProcessJobsTable } from '@/components/features/resume-process/resume-process-jobs-table';
import { ResumeProcessPagination } from '@/components/features/resume-process/resume-process-pagination';

export default function ResumeProcessPage() {
  const router = useRouter();

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1).withOptions({ shallow: false }));
  const [pageSize, setPageSize] = useQueryState('page_size', parseAsInteger.withDefault(20).withOptions({ shallow: false }));

  const [data, setData] = useState<ResumeProcessJobsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const effectivePage = useMemo(() => Math.max(page, 1), [page]);
  const effectivePageSize = useMemo(() => Math.min(Math.max(pageSize, 1), 100), [pageSize]);
  const offset = useMemo(() => (effectivePage - 1) * effectivePageSize, [effectivePage, effectivePageSize]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const resp = await fetchResumeProcessJobs({ limit: effectivePageSize, offset });
        if (!cancelled) setData(resp);
      } catch {
        if (!cancelled) toast.error('获取简历处理任务失败');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [effectivePageSize, offset]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div>
          <PageTitle>简历处理</PageTitle>
          <PageDescription>上传简历进行初次分析，并按需触发二次生成导出模板</PageDescription>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>上传并开始初次分析</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeProcessUploadForm onJobCreated={(jobId) => router.push(`/resume-process/${jobId}`)} isProcessing={false} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">正在加载...</p>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <ResumeProcessJobsTable items={data?.items ?? []} onView={(jobId) => router.push(`/resume-process/${jobId}`)} />
            </div>
          )}

          <ResumeProcessPagination
            page={effectivePage}
            totalPages={totalPages}
            pageSize={effectivePageSize}
            onPageChange={(n) => setPage(Math.max(Math.min(n, totalPages), 1))}
            onPageSizeChange={(n) => {
              const next = Math.min(Math.max(n, 1), 100);
              setPageSize(next);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>
    </Container>
  );
}

