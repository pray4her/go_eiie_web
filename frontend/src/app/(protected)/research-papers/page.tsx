'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { PageHeader, PageTitle, PageDescription } from '@/components/ui/page-header';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchPaperUploadForm } from '@/components/features/research-papers/research-paper-upload-form';
import { ResearchPaperJobsTable } from '@/components/features/research-papers/research-paper-jobs-table';
import { ResearchPaperDetailsDialog } from '@/components/features/research-papers/research-paper-details-dialog';
import {
  fetchResearchPaperJobs,
  fetchResearchPaperJobDetail,
  deleteResearchPaperJob,
} from '@/lib/research-papers';
import { ResearchPaperJob, ResearchPaperJobDetail } from '@/types';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResearchPaperAnnotationPage() {
  const [jobs, setJobs] = useState<ResearchPaperJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobDetail, setJobDetail] = useState<ResearchPaperJobDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  // 用来存储定时器引用
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadJobs = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const data = await fetchResearchPaperJobs();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('获取任务列表失败');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadJobs(true);
    setIsRefreshing(false);
    toast.success('列表已更新');
  };

  // 轮询逻辑：如果存在正在处理的任务，则每 5 秒刷新一次
  useEffect(() => {
    const hasActiveJobs = jobs.some((job) =>
      ['pending', 'extracting', 'annotating'].includes(job.status)
    );

    if (hasActiveJobs) {
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(() => {
          loadJobs(true);
        }, 5000);
      }
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [jobs, loadJobs]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleViewDetail = async (id: number) => {
    try {
      setSelectedJobId(id);
      setIsDetailOpen(true);
      const detail = await fetchResearchPaperJobDetail(id);
      setJobDetail(detail);
    } catch (error) {
      console.error('Failed to fetch job detail:', error);
      toast.error('获取任务详情失败');
      setIsDetailOpen(false);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm('确定要删除这个任务及其所有关联数据吗？')) return;

    setIsDeletingId(id);
    try {
      await deleteResearchPaperJob(id);
      toast.success('任务已删除');
      setJobs((prev) => prev.filter((job) => job.id !== id));
      if (selectedJobId === id) {
        setIsDetailOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      toast.error('删除任务失败');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleUploadSuccess = () => {
    loadJobs(true);
  };

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <PageTitle>论文自动标注</PageTitle>
        <PageDescription>上传论文 PDF 并指定专家姓名，AI 将自动提取元数据并在 PDF 中生成红框标注。</PageDescription>
      </PageHeader>

      <div className="mt-8 space-y-8">
        <Section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">新建标注任务</CardTitle>
            </CardHeader>
            <CardContent>
              <ResearchPaperUploadForm onUploadSuccess={handleUploadSuccess} />
            </CardContent>
          </Card>
        </Section>

        <Section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">任务历史</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新列表
            </Button>
          </div>

          <ResearchPaperJobsTable
            items={jobs}
            onView={handleViewDetail}
            onDelete={handleDeleteJob}
            isDeleting={isDeletingId}
          />
        </Section>
      </div>

      <ResearchPaperDetailsDialog
        detail={jobDetail}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </Container>
  );
}

