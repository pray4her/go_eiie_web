'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface ResearchPaperDownloadButtonProps {
  jobId: number | string;
  compact?: boolean;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
}

export function ResearchPaperDownloadButton({
  jobId,
  compact,
  variant,
}: ResearchPaperDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDownloading(true);

    try {
      const response = await api.get(
        `/research-papers/jobs/${jobId}/download`,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `research-paper-annotated-${jobId}.pdf`;
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

      toast.success('下载已开始');
    } catch (error: unknown) {
      console.error('Research paper download failed:', error);
      let description = '无法下载标注 PDF，请稍后重试。';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        description = axiosError.response?.data?.error || description;
      }
      toast.error('下载失败', { description });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      size={compact ? 'sm' : undefined}
      variant={variant || (compact ? 'outline' : 'default')}
      className={variant === 'link' ? 'p-0 h-auto font-normal' : ''}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {compact ? '' : '正在下载...'}
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {compact ? 'PDF' : '下载标注 PDF'}
        </>
      )}
    </Button>
  );
}

