'use client';

import { useState, useEffect, useRef } from 'react';
import { ImageGenerationJob, ImageJobUpdatePayload } from '@/types';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createSSEConnection } from '@/lib/sse';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageGenerationStatusProps {
  jobId: number;
  onStatusUpdate: (job: ImageGenerationJob) => void;
}

export function ImageGenerationStatus({ jobId, onStatusUpdate }: ImageGenerationStatusProps) {
  const [job, setJob] = useState<ImageGenerationJob>({
    id: jobId,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');

  const connectionRef = useRef<{ close: () => void } | null>(null);
  const errorNotifiedRef = useRef(false);

  useEffect(() => {
    // 通过 Next.js rewrites 同源访问，避免 CORS
    const sseUrl = `/api/v1/images/subscribe/${jobId}`;
    
    const connection = createSSEConnection(sseUrl, {
      onOpen: () => {
        console.log(`SSE connection opened for job ${jobId}`);
        setConnectionStatus('connected');
        toast.success('已连接到任务状态监听');
      },

      onMessage: (data: ImageJobUpdatePayload) => {
        console.log('Received SSE message:', data);
        
        setJob(prevJob => {
          const updatedJob: ImageGenerationJob = {
            ...prevJob,
            status: data.status,
            updated_at: new Date().toISOString(),
            result_url: data.result_url,
            error_message: data.status === 'failed' ? data.message : undefined,
          };

          onStatusUpdate(updatedJob);
          return updatedJob;
        });

        if (data.status === 'completed') {
          toast.success('图片生成完成！');
          connectionRef.current?.close();
          setConnectionStatus('closed');
        } else if (data.status === 'failed') {
          toast.error(`任务失败: ${data.message}`);
          connectionRef.current?.close();
          setConnectionStatus('closed');
        }
      },

      onError: (error) => {
        console.error('SSE connection error:', error);
        setConnectionStatus('error');
        if (!errorNotifiedRef.current) {
          toast.error('连接中断，请稍后重试');
          errorNotifiedRef.current = true;
        }
      },

      onClose: () => {
        console.log('SSE connection closed');
        setConnectionStatus('closed');
      },
    });

    connectionRef.current = connection;

    // Cleanup function
    return () => {
      connection.close();
    };
  }, [jobId, onStatusUpdate]);

  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'pending':
        return '任务已创建，等待处理...';
      case 'processing':
        return 'AI 正在提取签名... 这可能需要几秒钟，处理完成后结果会自动更新。';
      case 'completed':
        return '图片生成完成！';
      case 'failed':
        return `生成失败: ${job.error_message || '未知错误'}`;
      default:
        return '未知状态';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return '正在连接...';
      case 'connected':
        return '已连接';
      case 'error':
        return '连接错误';
      case 'closed':
        return '连接已关闭';
      default:
        return '未知状态';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>任务状态</span>
        </CardTitle>
        <CardDescription>
          任务 ID: {jobId} | 连接状态: {getConnectionStatusText()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">当前状态</p>
            <StatusBadge status={job.status} />
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm font-medium">创建时间</p>
            <p className="text-sm text-muted-foreground">
              {new Date(job.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">{getStatusText()}</p>
        </div>

        {/* Progress bar removed */}
        {connectionStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              连接中断，可能无法接收实时更新。请刷新页面重新连接。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}