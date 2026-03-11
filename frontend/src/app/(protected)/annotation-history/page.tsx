'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnnotationHistoryTable } from '@/components/features/annotation/annotation-history-table';
import { AnnotationHistoryPagination } from '@/components/features/annotation/annotation-history-pagination';
import { fetchAnnotationHistory } from '@/lib/annotation-history';
import { AnnotationHistoryListResponse } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle, PageDescription } from '@/components/ui/page-header';

export default function AnnotationHistoryPage() {
  const router = useRouter();

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1).withOptions({ shallow: false }));
  const [pageSize, setPageSize] = useQueryState('page_size', parseAsInteger.withDefault(20).withOptions({ shallow: false }));

  const [data, setData] = useState<AnnotationHistoryListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetchAnnotationHistory({
          page: Math.max(page, 1),
          page_size: Math.min(Math.max(pageSize, 1), 100),
        });
        if (!cancelled) setData(resp);
      } catch {
        if (!cancelled) toast.error('获取历史标注记录失败');
      } finally {
        if (!cancelled) setIsLoading(false);
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
            <PageTitle>历史标注记录</PageTitle>
            <PageDescription>查看和管理您的历史标注任务</PageDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/annotation">返回标注页</Link>
          </Button>
        </div>
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>标注记录列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">正在加载...</p>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <AnnotationHistoryTable
                items={data?.items ?? []}
                onView={(fileId) => router.push(`/annotation-history/${fileId}`)}
              />
            </div>
          )}

          <AnnotationHistoryPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={(n) => setPage(Math.max(Math.min(n, Math.max(totalPages, 1)), 1))}
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

