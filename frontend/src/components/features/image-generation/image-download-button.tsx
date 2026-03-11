'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';

interface ImageDownloadButtonProps {
  resultUrl: string;
  jobId: number;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ImageDownloadButton({ 
  resultUrl, 
  jobId, 
  disabled = false,
  variant = 'default',
  size = 'default'
}: ImageDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // 通过 Next.js rewrites 同源访问，直接使用相对路径
      const downloadUrl = resultUrl;

      // Fetch the image with authentication
      const token = localStorage.getItem('auth-storage');
      let authToken = '';
      
      if (token) {
        try {
          const authData = JSON.parse(token);
          authToken = authData.state?.token || '';
        } catch {
          console.warn('Could not parse auth token from localStorage');
        }
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      // Get the blob data
      const blob = await response.blob();
      
      // Extract filename from Content-Disposition header or use a default
      let filename = `generated_image_${jobId}.png`;
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('图片下载成功！');
    } catch (error: unknown) {
      console.error('Download failed:', error);
      const errorMessage = error instanceof Error ? error.message : '下载失败，请稍后重试。';
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      variant={variant}
      size={size}
      className="min-w-fit"
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          下载中...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          下载图片
        </>
      )}
    </Button>
  );
}