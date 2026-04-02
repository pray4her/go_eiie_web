'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle } from '@/components/ui/page-header';
import { PageLoadingCard } from '@/components/ui/page-loading';
import { CustomerAnalysisSummary } from '@/components/features/customer-analyses/customer-analysis-summary';
import {
  fetchCustomerAnalysisRunDisplay,
  isCustomerAnalysisTerminalStatus,
} from '@/lib/customer-analyses';
import { CustomerAnalysisDisplayResponse } from '@/types';

export default function CustomerAnalysisRunDetailsPage() {
  const params = useParams<{ runId: string }>();
  const runId = params?.runId as string;

  const [data, setData] = useState<CustomerAnalysisDisplayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetchCustomerAnalysisRunDisplay(runId);
        if (!cancelled) {
          setData(response);
          setIsPolling(Boolean(response && !isCustomerAnalysisTerminalStatus(response.run.status)));
        }
      } catch {
        if (!cancelled) toast.error('获取客户分析明细失败');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (runId) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [runId]);

  useEffect(() => {
    if (!runId || !data || isCustomerAnalysisTerminalStatus(data.run.status)) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const id = window.setInterval(async () => {
      try {
        const response = await fetchCustomerAnalysisRunDisplay(runId);
        setData(response);
        if (!response || isCustomerAnalysisTerminalStatus(response.run.status)) {
          window.clearInterval(id);
          setIsPolling(false);
        }
      } catch {
        window.clearInterval(id);
        setIsPolling(false);
      }
    }, 3000);

    return () => window.clearInterval(id);
  }, [data, runId]);

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex items-center justify-between gap-3">
          <PageTitle>客户分析 Run 详情</PageTitle>
          <div className="flex items-center gap-2">
            {data ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/customer-analyses?customer_id=${data.run.customer_id}`}>返回客户总览</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/customer-analyses">返回列表</Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      {isLoading ? (
        <PageLoadingCard message="正在加载 Run 详情…" />
      ) : !data ? (
        <Card>
          <CardHeader>
            <CardTitle>提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">未找到该客户分析 run。</p>
          </CardContent>
        </Card>
      ) : (
        <CustomerAnalysisSummary data={data} isPolling={isPolling} />
      )}
    </Container>
  );
}
