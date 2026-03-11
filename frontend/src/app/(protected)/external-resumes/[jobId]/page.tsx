'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalResumeJobDetails } from '@/types';
import { fetchExternalResumeJob } from '@/lib/external-resumes';
import { toast } from 'sonner';
import { ExternalResumeDetails } from '@/components/features/external-resumes/external-resume-details';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle } from '@/components/ui/page-header';

export default function ExternalResumeDetailsPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId as string;

  const [data, setData] = useState<ExternalResumeJobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const resp = await fetchExternalResumeJob(jobId);
        if (!cancelled) setData(resp);
      } catch {
        if (!cancelled) toast.error('获取任务详情失败');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    if (jobId) load();
    return () => { cancelled = true; };
  }, [jobId]);

  // optional light polling while processing
  useEffect(() => {
    if (!data) return;
    if (data.status === 'pending' || data.status === 'processing') {
      const id = setInterval(async () => {
        try {
          const refreshed = await fetchExternalResumeJob(jobId);
          setData(refreshed);
        } catch {
          /* swallow to keep polling */
        }
      }, 5000);
      return () => clearInterval(id);
    }
  }, [data, jobId]);

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex items-center justify-between">
          <PageTitle>外发简历详情</PageTitle>
          <Button variant="outline" size="sm" onClick={() => router.push('/external-resumes')}>返回列表</Button>
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
            <p className="text-destructive">未找到该任务。</p>
          </CardContent>
        </Card>
      ) : (
        <ExternalResumeDetails data={data} />
      )}
    </Container>
  );
}


