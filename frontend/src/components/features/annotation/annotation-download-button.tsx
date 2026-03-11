'use client';

import { useState } from 'react';
import { useAuthStore } from '@/contexts/auth-store';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface AnnotationDownloadButtonProps {
  fileId: number;
  compact?: boolean;
}

export function AnnotationDownloadButton({
  fileId,
  compact,
}: AnnotationDownloadButtonProps) {
  const { token } = useAuthStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!token) {
      toast.error('认证失败', {
        description: '无法获取下载授权，请重新登录。',
      });
      return;
    }

    setIsDownloading(true);

    try {
      const response = await api.get(
        `/ocr-extract/files/${fileId}/annotated`,
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 创建 Blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);

      // 创建临时链接触发下载
      const link = document.createElement('a');
      link.href = downloadUrl;

      // 尝试从 content-disposition header 获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `${fileId}-annotated.pdf`; // 默认文件名
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length > 1) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // 清理
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('下载成功', {
        description: '标注PDF已开始下载。',
      });
    } catch (error: unknown) {
      console.error('Download failed:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number; data?: { error?: string } } }).response
              ?.status === 404
            ? '文件不存在或权限不足'
            : (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
              '无法下载标注PDF，请稍后重试。'
          : '无法下载标注PDF，请稍后重试。';

      toast.error('下载失败', {
        description: errorMessage,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      size={compact ? 'sm' : undefined}
      variant={compact ? 'outline' : undefined}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {compact ? '下载中...' : '正在下载...'}
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {compact ? '下载' : '下载标注PDF'}
        </>
      )}
    </Button>
  );
}

