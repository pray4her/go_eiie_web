'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';

interface ImageUploadFormProps {
  onJobCreated: (jobId: number) => void;
}

export function ImageUploadForm({ onJobCreated }: ImageUploadFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileSelect(acceptedFiles[0]);
      }
    },
    [handleFileSelect],
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  const handleSubmit = async () => {
    if (!imageFile) {
      toast.error('请先选择一张图片。');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await api.post('/images/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.job_id) {
        toast.success('提取签名任务已创建！');
        onJobCreated(response.data.job_id);
        // Reset form
        setImageFile(null);
        setPreviewUrl(null);
      } else {
        toast.error('创建任务失败，未收到任务ID。');
      }
    } catch (error: unknown) {
      console.error('Submission failed', error);
      let message = '创建任务时出错，请稍后重试。';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response?: { data?: unknown } }).response?.data &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
      ) {
        message = (error as { response: { data: { message: string } } }).response.data.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const renderDropzoneContent = () => {
    if (imageFile && previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <Image src={previewUrl} alt="预览" width={128} height={128} className="w-32 h-32 object-cover rounded-lg border" unoptimized />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="font-semibold text-sm">{imageFile.name}</p>
            </div>
            <p className="text-xs text-muted-foreground">{Math.round(imageFile.size / 1024)} KB</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              <XCircle className="w-4 h-4 mr-1" />
              移除
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
        <div className="p-4 rounded-full bg-muted">
          <ImageIcon className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">{isDragActive ? '放开以上传图片' : '上传图片'}</p>
          <p className="text-sm text-muted-foreground">拖拽图片至此区域，或点击/粘贴上传</p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>提取签名</CardTitle>
        <CardDescription>上传一张图片，AI 将为您提取图片中的签名。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <input {...getInputProps()} />
          {renderDropzoneContent()}
        </div>

        <Button onClick={handleSubmit} disabled={!imageFile || isSubmitting} className="w-full" size="lg">
          {isSubmitting ? '正在创建任务...' : '开始提取'}
        </Button>
      </CardContent>
    </Card>
  );
}
