'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JobStatus } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageDownloadButton } from './image-download-button';
import { toast } from 'sonner';
import { Loader2, Eye, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageResultPreviewProps {
  resultUrl: string;
  jobId: number;
  status: JobStatus;
}

export function ImageResultPreview({ resultUrl, jobId, status }: ImageResultPreviewProps) {
  const [imageBlob, setImageBlob] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadImage = useCallback(async () => {
    if (!resultUrl || status !== 'completed') return;

    try {
      setIsLoading(true);
      setLoadError(null);

      // 通过 Next.js rewrites 同源访问，直接使用相对路径
      const downloadUrl = resultUrl;

      // Get auth token
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
        throw new Error(`图片加载失败: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageBlob(url);
    } catch (error: unknown) {
      console.error('Failed to load image:', error);
      const errorMessage = error instanceof Error ? error.message : '图片加载失败';
      setLoadError(errorMessage);
      toast.error('图片预览加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [resultUrl, status]);

  useEffect(() => {
    if (status === 'completed' && resultUrl) {
      void loadImage();
    }
  }, [resultUrl, status, loadImage]);

  // Revoke previous blob URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (imageBlob) {
        URL.revokeObjectURL(imageBlob);
      }
    };
  }, [imageBlob]);

  const renderPreviewContent = () => {
    if (status === 'pending' || status === 'processing') {
      return (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {status === 'pending' ? '等待生成...' : '正在生成图片...'}
          </p>
        </div>
      );
    }

    if (status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-red-500">图片生成失败</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">正在加载预览...</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-red-500">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadImage}>
            重新加载
          </Button>
        </div>
      );
    }

    if (!imageBlob) {
      return (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">暂无预览</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <Image
            src={imageBlob}
            alt="Generated result"
            width={400}
            height={192}
            className="w-full h-48 object-cover rounded-lg border transition-opacity group-hover:opacity-90"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Eye className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <div className="flex justify-center">
          <ImageDownloadButton
            resultUrl={resultUrl}
            jobId={jobId}
            variant="outline"
            size="sm"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>生成结果</CardTitle>
          <CardDescription>
            {status === 'completed' 
              ? '点击图片可查看大图，右击可保存' 
              : '图片生成完成后将在此处显示'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderPreviewContent()}
        </CardContent>
      </Card>

      {/* Full-size image modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>生成的图片</DialogTitle>
            <DialogDescription>
              任务 ID: {jobId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {imageBlob && (
              <div className="flex justify-center">
                <Image
                  src={imageBlob}
                  alt="Generated result - full size"
                  width={800}
                  height={600}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                  unoptimized
                />
              </div>
            )}
            <div className="flex justify-center space-x-2">
              <ImageDownloadButton
                resultUrl={resultUrl}
                jobId={jobId}
                variant="default"
              />
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}