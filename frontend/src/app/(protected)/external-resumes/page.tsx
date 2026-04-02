'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalResumeFilters } from '@/components/features/external-resumes/external-resume-filters';
import { ExternalResumePagination } from '@/components/features/external-resumes/external-resume-pagination';
import { ExternalResumeTable } from '@/components/features/external-resumes/external-resume-table';
import { fetchExternalResumeJobs } from '@/lib/external-resumes';
import { ExternalResumeJobsListResponse, JobStatus } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle, PageDescription } from '@/components/ui/page-header';
import { ListLoadingPlaceholder } from '@/components/ui/page-loading';

export default function ExternalResumesPage() {
  const router = useRouter();

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1).withOptions({ shallow: false }));
  const [pageSize, setPageSize] = useQueryState('page_size', parseAsInteger.withDefault(20).withOptions({ shallow: false }));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''));

  const [data, setData] = useState<ExternalResumeJobsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const effectiveStatus = useMemo<JobStatus | ''>(() => {
    const allowed = new Set(['', 'pending', 'processing', 'completed', 'failed']);
    return allowed.has(status) ? (status as JobStatus | '') : '';
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetchExternalResumeJobs({ page: Math.max(page, 1), page_size: Math.min(Math.max(pageSize, 1), 100), status: effectiveStatus });
        if (!cancelled) setData(resp);
      } catch {
        if (!cancelled) toast.error('获取外发简历任务失败');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, pageSize, effectiveStatus]);

  const totalPages = data?.total_pages ?? 0;

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>外发简历历史</PageTitle>
            <PageDescription>分页、筛选与下载</PageDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/generate-resume">返回生成页</Link></Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>筛选</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExternalResumeFilters status={effectiveStatus} onChange={(next) => { setStatus(next || null); setPage(1); }} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <ListLoadingPlaceholder message="正在加载任务列表…" withTableSkeleton />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <ExternalResumeTable
                items={data?.items ?? []}
                onView={(jobId) => router.push(`/external-resumes/${jobId}`)}
              />
            </div>
          )}

          <ExternalResumePagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={(n) => setPage(Math.max(Math.min(n, Math.max(totalPages, 1)), 1))}
            onPageSizeChange={(n) => { const next = Math.min(Math.max(n, 1), 100); setPageSize(next); setPage(1); }}
          />
        </CardContent>
      </Card>
    </Container>
  );
}


