'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { isAxiosError } from 'axios';
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/contexts/auth-store';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ResumeUploadFormProps {
  onJobCreated: (jobId: string) => void;
  isProcessing: boolean;
}

export function ResumeUploadForm({ onJobCreated, isProcessing }: ResumeUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuthStore();

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('未选择文件', {
        description: '请先选择一个简历文件再开始生成。',
      });
      return;
    }
    if (!token) {
      toast.error('未认证', {
        description: '无法获取认证信息，请重新登录。',
      });
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/external-resumes/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 202 && response.data.job_id) {
        toast.success('任务已启动', {
          description: '简历生成任务已成功提交，正在处理中...',
        });
        onJobCreated(response.data.job_id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: unknown) {
      const description = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : '无法启动简历生成任务，请稍后重试。';

      toast.error('上传失败', {
        description,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
            setFile(blob);
        }
      }
    }
  };

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
        ${file ? 'border-solid border-primary' : ''}`}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <div className="text-center p-4">
            <FileIcon className="w-16 h-16 mx-auto text-primary" />
            <p className="mt-2 font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            <Button variant="link" size="sm" className="mt-2" onClick={() => setFile(null)}>更换文件</Button>
          </div>
        ) : (
          <div className="text-center">
            <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {isDragActive ? '松开即可上传' : '将简历文件拖到此处，或点击选择'}
            </p>
             <p className="text-sm text-muted-foreground">支持 PDF, DOC, DOCX 格式,也可以直接粘贴截图</p>
          </div>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || isUploading || isProcessing}
        className="w-full"
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在上传...
          </>
        ) : isProcessing ? (
          '正在生成中...'
        ) : (
          '开始生成'
        )}
      </Button>
    </div>
  );
}

