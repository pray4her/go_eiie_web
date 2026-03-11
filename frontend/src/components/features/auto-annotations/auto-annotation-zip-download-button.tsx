'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface AutoAnnotationZipDownloadButtonProps {
  jobId: number | string;
  compact?: boolean;
}

export function AutoAnnotationZipDownloadButton({
  jobId,
  compact,
}: AutoAnnotationZipDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await api.get(
        `/auto-annotations/jobs/${jobId}/download`,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/zip',
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `auto-annotations-${jobId}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('下载已开始', {
        description: '自动标注结果压缩包正在下载。',
      });
    } catch (error) {
      console.error('Auto annotation zip download failed:', error);
      toast.error('下载失败', {
        description: '无法下载自动标注结果压缩包，请稍后重试。',
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
          {compact ? '下载 Zip' : '下载结果压缩包'}
        </>
      )}
    </Button>
  );
}


