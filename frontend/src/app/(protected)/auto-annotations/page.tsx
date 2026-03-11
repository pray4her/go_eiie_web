'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Container } from '@/components/ui/container';
import {
  PageHeader,
  PageTitle,
  PageDescription,
} from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AutoAnnotationJobsListResponse } from '@/types';
import { fetchAutoAnnotationJobs } from '@/lib/auto-annotations';
import { toast } from 'sonner';
import { AutoAnnotationJobsTable } from '@/components/features/auto-annotations/auto-annotation-jobs-table';
import { AnnotationHistoryPagination } from '@/components/features/annotation/annotation-history-pagination';

export default function AutoAnnotationsPage() {
  const router = useRouter();

  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );
  const [pageSize, setPageSize] = useQueryState(
    'page_size',
    parseAsInteger.withDefault(20).withOptions({ shallow: false })
  );

  const [data, setData] = useState<AutoAnnotationJobsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetchAutoAnnotationJobs({
          page: Math.max(page, 1),
          page_size: Math.min(Math.max(pageSize, 1), 100),
        });
        if (!cancelled) setData(resp);
      } catch {
        if (!cancelled) {
          toast.error('获取自动标注历史失败');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  const totalPages = data?.total_page ?? 0;

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>自动标注历史</PageTitle>
            <PageDescription>
              查看压缩包自动标注任务的进度与结果压缩包。
            </PageDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">返回信息提取</Link>
          </Button>
        </div>
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>自动标注任务列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">正在加载...</p>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <AutoAnnotationJobsTable
                items={data?.items ?? []}
                onView={(jobId) =>
                  router.push(`/auto-annotations/${encodeURIComponent(jobId)}`)
                }
              />
            </div>
          )}

          <AnnotationHistoryPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={(n) =>
              setPage(Math.max(Math.min(n, Math.max(totalPages, 1)), 1))
            }
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


