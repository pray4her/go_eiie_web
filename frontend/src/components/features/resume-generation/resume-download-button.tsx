'use client';

import { useAuthStore } from '@/contexts/auth-store';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ResumeDownloadButtonProps {
  jobId: string;
  resultUrl: string;
  compact?: boolean;
}

export function ResumeDownloadButton({ jobId, resultUrl, compact }: ResumeDownloadButtonProps) {
  const { token } = useAuthStore();

  const handleDownload = async () => {
    if (!token) {
      toast.error('认证失败', {
        description: '无法获取下载授权，请重新登录。',
      });
      return;
    }

    try {
      // Build an absolute URL using the server origin from NEXT_PUBLIC_API_BASE_URL
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBase) {
        throw new Error('API base URL not configured');
      }
      const base = new URL(apiBase);
      const fullUrl = new URL(resultUrl, base.origin).toString();

      const response = await axios.get(fullUrl, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Create a URL for the blob
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Try to get filename from content-disposition header
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `resume-job-${jobId}.docx`; // fallback filename
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length > 1) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Download failed:', error);
      toast.error('下载失败', {
        description: '无法下载生成的文件，请稍后重试。',
      });
    }
  };

  return (
    <Button onClick={handleDownload} size={compact ? 'sm' : undefined} variant={compact ? 'outline' : undefined}>
      <Download className="mr-2 h-4 w-4" />
      {compact ? '下载' : '下载生成后的简历'}
    </Button>
  );
}

