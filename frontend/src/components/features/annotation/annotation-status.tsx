'use client';

import { useEffect } from 'react';
import { useAnnotationProgress } from '@/hooks/use-annotation-progress';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { AnnotationStatusMessage } from '@/types';

interface AnnotationStatusProps {
  fileId: number;
  onStatusUpdate?: (status: AnnotationStatusMessage) => void;
}

export function AnnotationStatus({ fileId, onStatusUpdate }: AnnotationStatusProps) {
  const progress = useAnnotationProgress({
    fileId,
    enabled: true,
    onStatusUpdate,
  });

  useEffect(() => {
    if (progress.status === 'completed') {
      toast.success('标注完成！', {
        description: '标注PDF已生成，可以下载了。',
      });
    } else if (progress.status === 'failed') {
      toast.error('标注失败', {
        description: progress.message || '未知错误',
      });
    }
  }, [progress.status, progress.message]);

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'queued':
        return <Clock className="w-5 h-5 text-blue-500" />;
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
    switch (progress.status) {
      case 'idle':
        return '等待开始...';
      case 'queued':
        return '任务已入队，等待 Python Worker 处理...';
      case 'processing':
        return `正在处理标注: ${progress.message || '请稍候...'}`;
      case 'completed':
        return '标注完成！可以下载标注PDF了。';
      case 'failed':
        return `标注失败: ${progress.message || '未知错误'}`;
      default:
        return '未知状态';
    }
  };

  const getConnectionStatusText = () => {
    switch (progress.connectionStatus) {
      case 'connecting':
        return '正在连接...';
      case 'connected':
        return '已连接';
      case 'error':
        return '连接错误';
      case 'closed':
        return '连接已关闭';
      default:
        return '未连接';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>标注进度</span>
        </CardTitle>
        <CardDescription>
          文件 ID: {fileId} | 连接状态: {getConnectionStatusText()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">当前状态</p>
            <StatusBadge
              status={
                progress.status === 'idle'
                  ? 'pending'
                  : progress.status === 'queued'
                  ? 'pending'
                  : progress.status === 'processing'
                  ? 'processing'
                  : progress.status === 'completed'
                  ? 'completed'
                  : 'failed'
              }
            />
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">{getStatusText()}</p>
        </div>

        {progress.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              连接错误: {progress.error.message}
            </p>
          </div>
        )}

        {progress.connectionStatus === 'error' && (
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

