'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AutoAnnotationJobDetail } from '@/types';
import { fetchAutoAnnotationJob } from '@/lib/auto-annotations';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { AutoAnnotationZipDownloadButton } from '@/components/features/auto-annotations/auto-annotation-zip-download-button';
import { AutoAnnotationItemsTable } from '@/components/features/auto-annotations/auto-annotation-items-table';
import { PageLoadingCard } from '@/components/ui/page-loading';

export default function AutoAnnotationJobDetailPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId as string;

  const [data, setData] = useState<AutoAnnotationJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const resp = await fetchAutoAnnotationJob(jobId);
        if (!cancelled) {
          setData(resp);
        }
      } catch {
        if (!cancelled) {
          toast.error('获取自动标注任务详情失败');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (jobId) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  // 可选：如有需要，这里可以基于用户操作触发刷新，而不是持续轮询

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex items-center justify-between">
          <PageTitle>自动标注任务详情</PageTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/auto-annotations')}
          >
            返回列表
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <PageLoadingCard className="mt-6" message="正在加载任务详情…" />
      ) : !data ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">未找到该自动标注任务。</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>任务概览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Job ID：</span>
                  <span className="font-mono">{data.job.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">父文件 ID：</span>
                  <span>{data.job.extraction_parent_file_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">专家姓名：</span>
                  <span>{data.job.expert_name || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">状态：</span>
                  <StatusBadge status={data.job.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">创建时间：</span>
                  <span>
                    {new Date(data.job.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">更新时间：</span>
                  <span>
                    {new Date(data.job.updated_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>

              {/*
                新的心智：不依赖 Job.status / result_zip_path 判断“就绪”，
                而是根据 items 中是否已有至少一个 annotated_pdf_path。
              */}
              {data.items.some(
                (item) => !!item.annotated_pdf_path && item.status !== 'failed'
              ) && (
                <div className="pt-2">
                  <AutoAnnotationZipDownloadButton jobId={data.job.id} />
                </div>
              )}

              <p className="mt-2 text-xs text-muted-foreground">
                提示：同一个物理文件如果被识别为多种证明类型，会在下方明细中出现多条记录。
                若为论文类文件（合并后的总论文 PDF），会以“论文（合并结果）”标记。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>子文件标注明细</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <AutoAnnotationItemsTable items={data.items} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Container>
  );
}


