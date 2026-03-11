'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnnotationHistoryDetail } from '@/types';
import { fetchAnnotationHistoryDetail } from '@/lib/annotation-history';
import { toast } from 'sonner';
import { AnnotationHistoryDetails } from '@/components/features/annotation/annotation-history-details';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle } from '@/components/ui/page-header';

export default function AnnotationHistoryDetailPage() {
  const router = useRouter();
  const params = useParams<{ fileId: string }>();
  const fileId = params?.fileId ? Number(params.fileId) : null;

  const [data, setData] = useState<AnnotationHistoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!fileId) {
        setIsLoading(false);
        return;
      }
      try {
        const resp = await fetchAnnotationHistoryDetail(fileId);
        if (!cancelled) setData(resp);
      } catch {
        if (!cancelled) toast.error('获取标注详情失败');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex items-center justify-between">
          <PageTitle>标注详情</PageTitle>
          <Button variant="outline" size="sm" onClick={() => router.push('/annotation-history')}>
            返回列表
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">正在加载...</CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardHeader>
            <CardTitle>提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">未找到该标注记录。</p>
          </CardContent>
        </Card>
      ) : (
        <AnnotationHistoryDetails data={data} />
      )}
    </Container>
  );
}

