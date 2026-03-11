'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { GenerationJob, GenerationResult, JobStatus, WritingJobUpdatePayload } from '@/types';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { JobResultsToc } from './job-results-toc';
import { cn } from '@/lib/utils';
import { createSSEConnection } from '@/lib/sse';

interface JobDetailsProps {
  jobId: string;
}

export function JobDetails({ jobId }: JobDetailsProps) {
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'closed'>('idle');
  const connectionRef = useRef<{ close: () => void } | null>(null);
  const refreshThrottleRef = useRef<number | null>(null);
  const shouldStopRef = useRef(false);

  const fetchJobDetails = useCallback(async () => {
    try {
      const response = await api.get(`/writing/jobs/${jobId}`);
      const fetchedJobData = response.data;

      const hasFailedTask = fetchedJobData.results?.some((r: GenerationResult) => r.status === 'failed');
      const hasPartialFailed = fetchedJobData.results?.some((r: GenerationResult) => r.status === 'failed') && fetchedJobData.results?.some((r: GenerationResult) => r.status === 'completed');
      const isProcessing = fetchedJobData.results?.some((r: GenerationResult) => r.status === 'pending' || r.status === 'processing');

      let overallStatus: JobStatus = 'completed';
      if (hasFailedTask && hasPartialFailed) {
        overallStatus = 'failed_partial';
      } else if (hasFailedTask && !hasPartialFailed) {
        overallStatus = 'failed';
      } else if (isProcessing) {
        overallStatus = 'processing';
      }

      const fetchedJob: GenerationJob = {
        id: fetchedJobData.job_id,
        createdAt: fetchedJobData.created_at,
        results: fetchedJobData.results,
        status: overallStatus,
      };

      setJob(fetchedJob);
      setIsLoading(false);

      return overallStatus;
    } catch (error) {
      console.error(`Failed to fetch job ${jobId}`, error);
      toast.error('获取任务详情失败。');
      setIsLoading(false);
      return 'failed' as JobStatus;
    }
  }, [jobId]);

  // 初始化加载 + 建立 SSE 订阅
  useEffect(() => {
    shouldStopRef.current = false;

    // 首帧加载
    fetchJobDetails();

    // 建立 SSE 订阅
    setConnectionStatus('connecting');
    const sseUrl = `/api/v1/writing/subscribe/${jobId}`;
    const connection = createSSEConnection<WritingJobUpdatePayload>(sseUrl, {
      onOpen: () => setConnectionStatus('connected'),
      onMessage: () => {
        // 节流触发详情刷新
        if (refreshThrottleRef.current) {
          window.clearTimeout(refreshThrottleRef.current);
        }
        refreshThrottleRef.current = window.setTimeout(() => {
          fetchJobDetails().then((status) => {
            if (status === 'completed' || status === 'failed' || status === 'failed_partial') {
              try { connection.close(); } catch {}
              setConnectionStatus('closed');
              shouldStopRef.current = true;
            }
          });
        }, 600);
      },
      onError: () => setConnectionStatus((prev) => (prev === 'error' ? prev : 'error')),
      onClose: () => setConnectionStatus('closed'),
    });

    connectionRef.current = connection;

    return () => {
      try { connection.close(); } catch {}
      connectionRef.current = null;
      setConnectionStatus('closed');
    };
  }, [fetchJobDetails, jobId]);
  
  const renderContent = () => {
    if (isLoading && !job) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-4">正在加载任务详情...</p>
        </div>
      );
    }

    if (!job) {
      return <p className="text-center text-red-500">无法加载任务信息。</p>;
    }

    const categoryOrder = [
      '学士200字',
      '硕士200字',
      '博士200字',
      '工作职责贡献200字',
      '项目职责贡献200字',
      '荣誉奖项200字',
      '专利200字',
    ];

    // 只显示实际生成的结果，并按照预定义的顺序排序
    const sortedResults = job.results
      ? [...job.results]
          .filter(result => result.status === 'completed' || result.status === 'failed' || result.status === 'processing' || result.status === 'pending')
          .sort((a, b) => {
            const indexA = categoryOrder.indexOf(a.prompt_name);
            const indexB = categoryOrder.indexOf(b.prompt_name);
            // 如果在categoryOrder中找不到，则放到最后
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          })
      : [];

    const overallStatus = job.status;
    const showToc = sortedResults && sortedResults.length > 1;

    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-y-8',
          showToc && 'lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-12 lg:gap-y-0'
        )}
      >
        <div className="min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>任务详情</CardTitle>
              <CardDescription>
                查看内容生成任务的实时状态与最终结果。
                <span className="ml-2 text-xs">
                  连接: {connectionStatus === 'connecting' && '正在连接...'}
                  {connectionStatus === 'connected' && '已连接'}
                  {connectionStatus === 'error' && '连接错误'}
                  {connectionStatus === 'closed' && '已关闭'}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">任务ID</p>
                  <p className="font-mono text-sm">{job.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">创建时间</p>
                  <p className="text-sm">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">整体状态</p>
                  <StatusBadge status={overallStatus} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">生成结果</h3>
                {sortedResults && sortedResults.length > 0 ? (
                  sortedResults.map((result) => (
                    <Card key={result.id} id={`result-${result.id}`} className="scroll-mt-24">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">{result.prompt_name}</CardTitle>
                        <StatusBadge status={result.status} />
                      </CardHeader>
                      <CardContent>
                        {result.status === 'completed' ? (
                          <div className="bg-muted p-4 rounded-lg font-sans text-sm whitespace-pre-wrap">
                            <ReactMarkdown
                              components={{
                                h2: ({ ...props }) => <h2 className="text-base font-semibold my-2" {...props} />,
                                ul: ({ ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
                                li: ({ ...props }) => <li className="mb-1" {...props} />,
                                p: ({ ...props }) => <p className="mb-2" {...props} />,
                                strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
                                hr: ({ ...props }) => <hr className="my-2 border-border" {...props} />,
                              }}
                            >
                              {result.generated_content}
                            </ReactMarkdown>
                          </div>
                        ) : result.status === 'failed' ? (
                          <p className="text-red-500 text-sm">任务失败: {result.error_message}</p>
                        ) : (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            <span>正在处理中...</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                    {overallStatus === 'failed' ? (
                      <p className="text-red-500">任务处理失败。</p>
                    ) : (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="ml-3">正在等待任务完成...</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {showToc && (
          <aside className="hidden lg:block">
            <JobResultsToc results={sortedResults} />
          </aside>
        )}
      </div>
    );
  };

  return <>{renderContent()}</>;
}
